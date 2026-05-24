package room

import (
	"encoding/json"
	"testing"
	"time"
)

func TestHubCreateAndGet(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, err := h.Create("Alice")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if r.Code == "" || len(r.Players) != 1 || r.HostID == "" {
		t.Fatalf("bad room: %+v", r)
	}
	got, ok := h.Get(r.Code)
	if !ok || got.Code != r.Code {
		t.Fatalf("Get miss")
	}
}

func TestHubJoinAndLeave(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, _ := h.Create("Alice")
	host := r.Players[0].ID

	p2, err := h.Join(r.Code, "Bob", "")
	if err != nil {
		t.Fatalf("Join: %v", err)
	}
	if p2.ID == host {
		t.Fatal("new player id collides with host")
	}
	r2, _ := h.Get(r.Code)
	if len(r2.Players) != 2 {
		t.Fatalf("want 2 players, got %d", len(r2.Players))
	}

	if err := h.Leave(r.Code, p2.ID); err != nil {
		t.Fatalf("Leave: %v", err)
	}
	r3, _ := h.Get(r.Code)
	if len(r3.Players) != 1 {
		t.Fatalf("want 1 after leave, got %d", len(r3.Players))
	}
}

func TestHubJoinReconnectKeepsID(t *testing.T) {
	// Connection drop != Leave. Player stays in the room; reconnect by ID
	// returns the same player record. Leave is reserved for explicit exits.
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, _ := h.Create("Alice")
	p2, _ := h.Join(r.Code, "Bob", "")
	again, err := h.Join(r.Code, "Bob", p2.ID)
	if err != nil {
		t.Fatalf("reconnect: %v", err)
	}
	if again.ID != p2.ID {
		t.Fatalf("reconnect lost id: %s vs %s", again.ID, p2.ID)
	}
	if r2, _ := h.Get(r.Code); len(r2.Players) != 2 {
		t.Fatalf("duplicate added: %d", len(r2.Players))
	}
}

func TestHubStartAndApplyAssignsMonotonicSeq(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, _ := h.Create("Alice")
	host := r.HostID
	_, _ = h.Join(r.Code, "Bob", "")

	if err := h.Start(r.Code, host, 42, json.RawMessage(`{"players":2}`)); err != nil {
		t.Fatalf("Start: %v", err)
	}

	a1, err := h.Apply(r.Code, host, json.RawMessage(`{"type":"DrawBlind"}`))
	if err != nil {
		t.Fatalf("Apply1: %v", err)
	}
	a2, err := h.Apply(r.Code, host, json.RawMessage(`{"type":"DrawBlind"}`))
	if err != nil {
		t.Fatalf("Apply2: %v", err)
	}
	if a1.Seq != 1 || a2.Seq != 2 {
		t.Fatalf("seq not monotonic: %d, %d", a1.Seq, a2.Seq)
	}
}

func TestHubReplayFromSeq(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, _ := h.Create("Alice")
	host := r.HostID
	_ = h.Start(r.Code, host, 1, json.RawMessage(`{}`))
	_, _ = h.Apply(r.Code, host, json.RawMessage(`{"type":"DrawBlind"}`))
	_, _ = h.Apply(r.Code, host, json.RawMessage(`{"type":"DrawBlind"}`))
	_, _ = h.Apply(r.Code, host, json.RawMessage(`{"type":"DrawBlind"}`))

	missed, err := h.Replay(r.Code, 1)
	if err != nil {
		t.Fatalf("Replay: %v", err)
	}
	if len(missed) != 2 {
		t.Fatalf("want 2 missed, got %d", len(missed))
	}
	if missed[0].Seq != 2 || missed[1].Seq != 3 {
		t.Fatalf("wrong seqs: %d %d", missed[0].Seq, missed[1].Seq)
	}
}

func TestSweeperEvictsIdle(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: 30 * time.Millisecond})
	r, _ := h.Create("Alice")
	time.Sleep(80 * time.Millisecond)
	h.Sweep(time.Now())
	if _, ok := h.Get(r.Code); ok {
		t.Fatal("idle room not swept")
	}
}

func TestStartOnlyByHost(t *testing.T) {
	h := NewHub(Config{MaxRooms: 10, TTL: time.Hour})
	r, _ := h.Create("Alice")
	p2, _ := h.Join(r.Code, "Bob", "")
	if err := h.Start(r.Code, p2.ID, 1, json.RawMessage(`{}`)); err == nil {
		t.Fatal("non-host should not be able to start")
	}
}

func TestMaxRoomsLimit(t *testing.T) {
	h := NewHub(Config{MaxRooms: 2, TTL: time.Hour})
	_, _ = h.Create("A")
	_, _ = h.Create("B")
	if _, err := h.Create("C"); err == nil {
		t.Fatal("expected MaxRooms error")
	}
}
