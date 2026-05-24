package ws

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"

	"github.com/MeKo-Christian/TicketToRide/apps/server/internal/room"
)

func newTestServer(t *testing.T) (*httptest.Server, *Server) {
	t.Helper()
	hub := room.NewHub(room.Config{MaxRooms: 16, TTL: time.Hour})
	s := NewServer(hub, ServerConfig{AllowedOrigins: []string{"*"}})
	ts := httptest.NewServer(s.Handler())
	t.Cleanup(ts.Close)
	return ts, s
}

func wsURL(ts *httptest.Server) string {
	return "ws" + strings.TrimPrefix(ts.URL, "http") + "/ws"
}

func dial(t *testing.T, url string) *websocket.Conn {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	c, _, err := websocket.Dial(ctx, url, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { _ = c.Close(websocket.StatusNormalClosure, "") })
	return c
}

func read(t *testing.T, c *websocket.Conn) map[string]json.RawMessage {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	var v map[string]json.RawMessage
	if err := wsjson.Read(ctx, c, &v); err != nil {
		t.Fatalf("read: %v", err)
	}
	return v
}

func write(t *testing.T, c *websocket.Conn, v any) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := wsjson.Write(ctx, c, v); err != nil {
		t.Fatalf("write: %v", err)
	}
}

func TestHealthz(t *testing.T) {
	ts, _ := newTestServer(t)
	resp, err := ts.Client().Get(ts.URL + "/healthz")
	if err != nil {
		t.Fatalf("healthz: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestCreateAndJoinRoomBroadcasts(t *testing.T) {
	ts, _ := newTestServer(t)
	url := wsURL(ts)

	host := dial(t, url)
	write(t, host, map[string]any{"type": "createRoom", "playerName": "Alice"})

	rs := read(t, host)
	if s, _ := stringField(rs, "type"); s != "roomState" {
		t.Fatalf("want roomState, got %s", s)
	}
	code, _ := stringField(rs, "code")
	hostID, _ := stringField(rs, "youId")
	if code == "" || hostID == "" {
		t.Fatal("missing code or youId")
	}

	guest := dial(t, url)
	write(t, guest, map[string]any{"type": "joinRoom", "code": code, "playerName": "Bob"})
	gRS := read(t, guest)
	if gID, _ := stringField(gRS, "youId"); gID == "" || gID == hostID {
		t.Fatalf("bad guest id: %q vs host %q", gID, hostID)
	}

	hostUpdate := read(t, host)
	if s, _ := stringField(hostUpdate, "type"); s != "roomState" {
		t.Fatalf("host did not get updated roomState, got %s", s)
	}
}

func TestStartGameAndActionBroadcast(t *testing.T) {
	ts, _ := newTestServer(t)
	url := wsURL(ts)

	host := dial(t, url)
	write(t, host, map[string]any{"type": "createRoom", "playerName": "Alice"})
	rs := read(t, host)
	code, _ := stringField(rs, "code")

	guest := dial(t, url)
	write(t, guest, map[string]any{"type": "joinRoom", "code": code, "playerName": "Bob"})
	_ = read(t, guest)
	_ = read(t, host)

	write(t, host, map[string]any{"type": "startGame", "config": map[string]any{"players": 2}})
	hostState := read(t, host)
	if status, _ := stringField(hostState, "status"); status != "playing" {
		t.Fatalf("host status %q", status)
	}
	guestState := read(t, guest)
	if status, _ := stringField(guestState, "status"); status != "playing" {
		t.Fatalf("guest status %q", status)
	}

	write(t, host, map[string]any{"type": "action", "action": map[string]any{"type": "DrawBlind"}})
	hostA := read(t, host)
	guestA := read(t, guest)
	if s, _ := stringField(hostA, "type"); s != "actionApplied" {
		t.Fatalf("host got %s", s)
	}
	if s, _ := stringField(guestA, "type"); s != "actionApplied" {
		t.Fatalf("guest got %s", s)
	}
	if intField(hostA, "seq") != 1 || intField(guestA, "seq") != 1 {
		t.Fatalf("bad seq: %d %d", intField(hostA, "seq"), intField(guestA, "seq"))
	}
}

func TestReconnectReplaysMissedActions(t *testing.T) {
	ts, _ := newTestServer(t)
	url := wsURL(ts)

	host := dial(t, url)
	write(t, host, map[string]any{"type": "createRoom", "playerName": "Alice"})
	rs := read(t, host)
	code, _ := stringField(rs, "code")

	guest := dial(t, url)
	write(t, guest, map[string]any{"type": "joinRoom", "code": code, "playerName": "Bob"})
	gRS := read(t, guest)
	guestID, _ := stringField(gRS, "youId")
	_ = read(t, host) // updated roomState

	write(t, host, map[string]any{"type": "startGame", "config": map[string]any{}})
	_ = read(t, host)
	_ = read(t, guest)

	// Host plays 3 actions while guest is still connected
	for range 3 {
		write(t, host, map[string]any{"type": "action", "action": map[string]any{"type": "DrawBlind"}})
		_ = read(t, host)
		_ = read(t, guest)
	}

	// Guest "drops" and reconnects with lastSeq=1
	_ = guest.Close(websocket.StatusNormalClosure, "")
	guest2 := dial(t, url)
	write(t, guest2, map[string]any{
		"type": "joinRoom", "code": code, "playerName": "Bob", "playerId": guestID, "lastSeq": 1,
	})
	_ = read(t, guest2) // roomState

	// Should now receive seqs 2 and 3
	m1 := read(t, guest2)
	m2 := read(t, guest2)
	if intField(m1, "seq") != 2 || intField(m2, "seq") != 3 {
		t.Fatalf("bad replay: %d %d", intField(m1, "seq"), intField(m2, "seq"))
	}
}
