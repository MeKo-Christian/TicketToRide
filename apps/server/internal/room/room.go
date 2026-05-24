// Package room owns in-memory room/lobby state and the per-room action log.
package room

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/codegen"
)

const MaxPlayers = 5

type Player struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Ready bool   `json:"ready"`
}

type Applied struct {
	Seq    int             `json:"seq"`
	Action json.RawMessage `json:"action"`
}

type Status string

const (
	StatusLobby   Status = "lobby"
	StatusPlaying Status = "playing"
	StatusEnded   Status = "ended"
)

type Room struct {
	Code           string
	HostID         string
	Players        []Player
	Status         Status
	Seed           int64
	HasSeed        bool
	Config         json.RawMessage
	ActionLog      []Applied
	CreatedAt      time.Time
	LastActivityAt time.Time
}

type Config struct {
	MaxRooms int
	TTL      time.Duration
}

type Hub struct {
	cfg   Config
	mu    sync.RWMutex
	rooms map[string]*Room
	now   func() time.Time
}

func NewHub(cfg Config) *Hub {
	if cfg.MaxRooms <= 0 {
		cfg.MaxRooms = 1000
	}
	if cfg.TTL <= 0 {
		cfg.TTL = time.Hour
	}
	return &Hub{
		cfg:   cfg,
		rooms: make(map[string]*Room),
		now:   time.Now,
	}
}

var (
	ErrRoomFull      = errors.New("room: full")
	ErrRoomNotFound  = errors.New("room: not found")
	ErrNotHost       = errors.New("room: caller is not host")
	ErrWrongStatus   = errors.New("room: wrong status for operation")
	ErrPlayerUnknown = errors.New("room: player not in room")
	ErrMaxRooms      = errors.New("room: max rooms reached")
	ErrPastEnd       = errors.New("room: lastSeq past end of log")
)

func newPlayerID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		panic("room: rand.Read: " + err.Error())
	}
	return hex.EncodeToString(b)
}

// Create makes a new room with the caller as host.
func (h *Hub) Create(hostName string) (*Room, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.rooms) >= h.cfg.MaxRooms {
		return nil, ErrMaxRooms
	}

	exists := func(c string) bool { _, ok := h.rooms[c]; return ok }
	code, err := codegen.NewUnique(exists, 16)
	if err != nil {
		return nil, err
	}

	host := Player{ID: newPlayerID(), Name: hostName}
	now := h.now()
	r := &Room{
		Code:           code,
		HostID:         host.ID,
		Players:        []Player{host},
		Status:         StatusLobby,
		CreatedAt:      now,
		LastActivityAt: now,
	}
	h.rooms[code] = r
	return r, nil
}

// Get returns a snapshot copy of the room.
func (h *Hub) Get(code string) (*Room, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	r, ok := h.rooms[code]
	if !ok {
		return nil, false
	}
	cp := *r
	cp.Players = append([]Player(nil), r.Players...)
	cp.ActionLog = append([]Applied(nil), r.ActionLog...)
	return &cp, true
}

// Join adds a player to a lobby room. If playerID is provided and matches a
// known player (reconnect), keeps that ID; otherwise mints a new one. During
// lobby a player can also re-join freely by name; during play, reconnect by
// playerID is required.
func (h *Hub) Join(code, name, playerID string) (*Player, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	r, ok := h.rooms[code]
	if !ok {
		return nil, ErrRoomNotFound
	}

	if playerID != "" {
		for i := range r.Players {
			if r.Players[i].ID == playerID {
				r.LastActivityAt = h.now()
				p := r.Players[i]
				return &p, nil
			}
		}
		if r.Status == StatusPlaying {
			// Reconnect attempt with unknown ID during play.
			return nil, ErrPlayerUnknown
		}
	}

	if r.Status != StatusLobby {
		return nil, ErrWrongStatus
	}
	if len(r.Players) >= MaxPlayers {
		return nil, ErrRoomFull
	}

	p := Player{ID: newPlayerID(), Name: name}
	r.Players = append(r.Players, p)
	r.LastActivityAt = h.now()
	return &p, nil
}

// SetReady toggles ready state for a lobby player.
func (h *Hub) SetReady(code, playerID string, ready bool) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[code]
	if !ok {
		return ErrRoomNotFound
	}
	if r.Status != StatusLobby {
		return ErrWrongStatus
	}
	for i := range r.Players {
		if r.Players[i].ID == playerID {
			r.Players[i].Ready = ready
			r.LastActivityAt = h.now()
			return nil
		}
	}
	return ErrPlayerUnknown
}

// Leave removes a player. If the host leaves, the room is marked ended;
// remaining players are kept so the WS server can broadcast a notice before
// the sweeper cleans up.
func (h *Hub) Leave(code, playerID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[code]
	if !ok {
		return ErrRoomNotFound
	}
	idx := -1
	for i := range r.Players {
		if r.Players[i].ID == playerID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return ErrPlayerUnknown
	}
	r.LastActivityAt = h.now()
	if playerID == r.HostID && r.Status != StatusEnded {
		r.Status = StatusEnded
		return nil
	}
	r.Players = append(r.Players[:idx], r.Players[idx+1:]...)
	if len(r.Players) == 0 {
		delete(h.rooms, code)
	}
	return nil
}

// Start transitions a room to playing. Only the host may call this.
func (h *Hub) Start(code, callerID string, seed int64, cfg json.RawMessage) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[code]
	if !ok {
		return ErrRoomNotFound
	}
	if callerID != r.HostID {
		return ErrNotHost
	}
	if r.Status != StatusLobby {
		return ErrWrongStatus
	}
	r.Status = StatusPlaying
	r.Seed = seed
	r.HasSeed = true
	r.Config = cfg
	r.LastActivityAt = h.now()
	return nil
}

// Apply appends an action to the log and returns the seq-stamped record.
// The server does NOT validate game rules; clients enforce them.
func (h *Hub) Apply(code, callerID string, action json.RawMessage) (*Applied, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[code]
	if !ok {
		return nil, ErrRoomNotFound
	}
	if r.Status != StatusPlaying {
		return nil, ErrWrongStatus
	}
	known := false
	for i := range r.Players {
		if r.Players[i].ID == callerID {
			known = true
			break
		}
	}
	if !known {
		return nil, ErrPlayerUnknown
	}
	a := Applied{Seq: len(r.ActionLog) + 1, Action: append(json.RawMessage(nil), action...)}
	r.ActionLog = append(r.ActionLog, a)
	r.LastActivityAt = h.now()
	return &a, nil
}

// Replay returns actions whose seq is > lastSeq.
func (h *Hub) Replay(code string, lastSeq int) ([]Applied, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	r, ok := h.rooms[code]
	if !ok {
		return nil, ErrRoomNotFound
	}
	if lastSeq < 0 || lastSeq > len(r.ActionLog) {
		return nil, ErrPastEnd
	}
	out := make([]Applied, 0, len(r.ActionLog)-lastSeq)
	out = append(out, r.ActionLog[lastSeq:]...)
	return out, nil
}

// Sweep removes rooms idle longer than the configured TTL.
func (h *Hub) Sweep(now time.Time) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for code, r := range h.rooms {
		if now.Sub(r.LastActivityAt) > h.cfg.TTL {
			delete(h.rooms, code)
		}
	}
}

// CodesForTesting returns the active room codes (test helper).
func (h *Hub) CodesForTesting() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	codes := make([]string, 0, len(h.rooms))
	for c := range h.rooms {
		codes = append(codes, c)
	}
	return codes
}
