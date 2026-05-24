package ws

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"

	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/room"
)

type ServerConfig struct {
	AllowedOrigins []string
	WriteTimeout   time.Duration
	ReadTimeout    time.Duration
	Logger         *slog.Logger
}

// Server owns the HTTP mux and routes WS messages into the room hub.
// It also tracks live connections so it can broadcast actions back to peers
// in the same room.
type Server struct {
	hub *room.Hub
	cfg ServerConfig
	log *slog.Logger

	mu    sync.RWMutex
	rooms map[string]map[*conn]struct{} // code -> set of conns
}

type conn struct {
	ws        *websocket.Conn
	playerID  string
	code      string
	writeMu   sync.Mutex
	writeWait time.Duration
}

func NewServer(hub *room.Hub, cfg ServerConfig) *Server {
	if cfg.WriteTimeout <= 0 {
		cfg.WriteTimeout = 10 * time.Second
	}
	if cfg.ReadTimeout <= 0 {
		cfg.ReadTimeout = 60 * time.Second
	}
	log := cfg.Logger
	if log == nil {
		log = slog.Default()
	}
	return &Server{
		hub:   hub,
		cfg:   cfg,
		log:   log,
		rooms: make(map[string]map[*conn]struct{}),
	}
}

// Handler returns the HTTP handler exposing /healthz and /ws.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/ws", s.handleWS)
	return mux
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	wsc, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: s.cfg.AllowedOrigins,
	})
	if err != nil {
		s.log.Warn("ws accept failed", "err", err)
		return
	}
	defer func() { _ = wsc.Close(websocket.StatusInternalError, "internal error") }()

	c := &conn{ws: wsc, writeWait: s.cfg.WriteTimeout}
	ctx := r.Context()
	s.readLoop(ctx, c)

	if c.code != "" {
		s.removeConn(c.code, c)
	}
	_ = wsc.Close(websocket.StatusNormalClosure, "bye")
}

func (s *Server) readLoop(ctx context.Context, c *conn) {
	for {
		readCtx, cancel := context.WithTimeout(ctx, s.cfg.ReadTimeout)
		var env map[string]json.RawMessage
		err := wsjson.Read(readCtx, c.ws, &env)
		cancel()
		if err != nil {
			if !errors.Is(err, context.Canceled) {
				s.log.Debug("read end", "err", err)
			}
			return
		}
		t, _ := stringField(env, "type")
		if err := s.dispatch(ctx, c, t, env); err != nil {
			s.sendError(c, "badRequest", err.Error())
		}
	}
}

func stringField(env map[string]json.RawMessage, k string) (string, bool) {
	raw, ok := env[k]
	if !ok {
		return "", false
	}
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		return "", false
	}
	return s, true
}

func intField(env map[string]json.RawMessage, k string) int {
	raw, ok := env[k]
	if !ok {
		return 0
	}
	var n int
	if err := json.Unmarshal(raw, &n); err != nil {
		return 0
	}
	return n
}

func boolField(env map[string]json.RawMessage, k string) bool {
	raw, ok := env[k]
	if !ok {
		return false
	}
	var b bool
	if err := json.Unmarshal(raw, &b); err != nil {
		return false
	}
	return b
}

func (s *Server) dispatch(_ context.Context, c *conn, t string, env map[string]json.RawMessage) error {
	switch t {
	case TypeCreateRoom:
		name, _ := stringField(env, "playerName")
		r, err := s.hub.Create(name)
		if err != nil {
			return err
		}
		c.code = r.Code
		c.playerID = r.HostID
		s.addConn(r.Code, c)
		s.sendRoomState(c, r.Code)
		return nil

	case TypeJoinRoom:
		code, _ := stringField(env, "code")
		code = strings.ToUpper(code)
		name, _ := stringField(env, "playerName")
		pid, _ := stringField(env, "playerId")
		lastSeq := intField(env, "lastSeq")

		p, err := s.hub.Join(code, name, pid)
		if err != nil {
			return err
		}
		c.code = code
		c.playerID = p.ID
		s.addConn(code, c)
		s.sendRoomState(c, code)

		if lastSeq > 0 {
			missed, err := s.hub.Replay(code, lastSeq)
			if err == nil {
				for _, a := range missed {
					s.sendJSON(c, ActionAppliedMsg{Type: TypeActionApplied, Seq: a.Seq, Action: a.Action})
				}
			}
		}
		s.broadcastRoomState(code, c)
		return nil

	case TypeSetReady:
		if c.code == "" {
			return errors.New("not in a room")
		}
		ready := boolField(env, "ready")
		if err := s.hub.SetReady(c.code, c.playerID, ready); err != nil {
			return err
		}
		s.broadcastRoomState(c.code, nil)
		return nil

	case TypeStartGame:
		if c.code == "" {
			return errors.New("not in a room")
		}
		cfg := env["config"]
		seed := time.Now().UnixNano()
		if err := s.hub.Start(c.code, c.playerID, seed, cfg); err != nil {
			return err
		}
		s.broadcastRoomState(c.code, nil)
		return nil

	case TypeAction:
		if c.code == "" {
			return errors.New("not in a room")
		}
		raw, ok := env["action"]
		if !ok {
			return errors.New("missing action")
		}
		a, err := s.hub.Apply(c.code, c.playerID, raw)
		if err != nil {
			return err
		}
		s.broadcastAction(c.code, *a)
		return nil

	case TypeLeave:
		if c.code == "" {
			return nil
		}
		_ = s.hub.Leave(c.code, c.playerID)
		s.broadcastRoomState(c.code, nil)
		return nil

	case TypePing:
		s.sendJSON(c, PongMsg{Type: TypePong, T: time.Now().UnixMilli()})
		return nil
	}
	return fmt.Errorf("unknown message type %q", t)
}

func (s *Server) addConn(code string, c *conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	set, ok := s.rooms[code]
	if !ok {
		set = make(map[*conn]struct{})
		s.rooms[code] = set
	}
	set[c] = struct{}{}
}

func (s *Server) removeConn(code string, c *conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	set, ok := s.rooms[code]
	if !ok {
		return
	}
	delete(set, c)
	if len(set) == 0 {
		delete(s.rooms, code)
	}
}

func (s *Server) connsFor(code string) []*conn {
	s.mu.RLock()
	defer s.mu.RUnlock()
	set := s.rooms[code]
	out := make([]*conn, 0, len(set))
	for c := range set {
		out = append(out, c)
	}
	return out
}

func (s *Server) sendRoomState(c *conn, code string) {
	r, ok := s.hub.Get(code)
	if !ok {
		return
	}
	msg := buildRoomState(r, c.playerID)
	s.sendJSON(c, msg)
}

func (s *Server) broadcastRoomState(code string, except *conn) {
	r, ok := s.hub.Get(code)
	if !ok {
		return
	}
	for _, c := range s.connsFor(code) {
		if c == except {
			continue
		}
		s.sendJSON(c, buildRoomState(r, c.playerID))
	}
}

func (s *Server) broadcastAction(code string, a room.Applied) {
	msg := ActionAppliedMsg{Type: TypeActionApplied, Seq: a.Seq, Action: a.Action}
	for _, c := range s.connsFor(code) {
		s.sendJSON(c, msg)
	}
}

func buildRoomState(r *room.Room, youID string) RoomStateMsg {
	players := make([]PlayerSnapshot, 0, len(r.Players))
	for _, p := range r.Players {
		players = append(players, PlayerSnapshot{ID: p.ID, Name: p.Name, Ready: p.Ready})
	}
	var seedP *int64
	if r.HasSeed {
		v := r.Seed
		seedP = &v
	}
	return RoomStateMsg{
		Type:    TypeRoomState,
		Code:    r.Code,
		HostID:  r.HostID,
		Players: players,
		Status:  string(r.Status),
		Seed:    seedP,
		Seq:     len(r.ActionLog),
		YouID:   youID,
	}
}

func (s *Server) sendJSON(c *conn, v any) {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), c.writeWait)
	defer cancel()
	if err := wsjson.Write(ctx, c.ws, v); err != nil {
		s.log.Debug("write failed", "err", err)
	}
}

func (s *Server) sendError(c *conn, code, msg string) {
	s.sendJSON(c, ErrorMsg{Type: TypeError, Code: code, Message: msg})
}
