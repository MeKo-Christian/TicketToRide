// Package ws defines the WebSocket message protocol and HTTP handler.
package ws

import "encoding/json"

// Message type discriminators (lowerCamelCase to match TS client).
const (
	TypeCreateRoom    = "createRoom"
	TypeJoinRoom      = "joinRoom"
	TypeRoomState     = "roomState"
	TypeSetReady      = "setReady"
	TypeStartGame     = "startGame"
	TypeAction        = "action"
	TypeActionApplied = "actionApplied"
	TypeLeave         = "leave"
	TypeError         = "error"
	TypePing          = "ping"
	TypePong          = "pong"
)

// Status values for a room.
const (
	StatusLobby   = "lobby"
	StatusPlaying = "playing"
	StatusEnded   = "ended"
)

// Envelope is the wire-level discriminator; raw payload is decoded per type.
type Envelope struct {
	Type string          `json:"type"`
	Raw  json.RawMessage `json:"-"`
}

type CreateRoomMsg struct {
	Type       string `json:"type"`
	PlayerName string `json:"playerName"`
}

type JoinRoomMsg struct {
	Type       string `json:"type"`
	Code       string `json:"code"`
	PlayerName string `json:"playerName"`
	PlayerID   string `json:"playerId,omitempty"`
	LastSeq    int    `json:"lastSeq,omitempty"`
}

type PlayerSnapshot struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Ready bool   `json:"ready"`
}

type RoomStateMsg struct {
	Type    string           `json:"type"`
	Code    string           `json:"code"`
	HostID  string           `json:"hostId"`
	Players []PlayerSnapshot `json:"players"`
	Status  string           `json:"status"`
	Seed    *int64           `json:"seed,omitempty"`
	Seq     int              `json:"seq"`
	YouID   string           `json:"youId"`
}

type SetReadyMsg struct {
	Type  string `json:"type"`
	Ready bool   `json:"ready"`
}

type StartGameMsg struct {
	Type   string          `json:"type"`
	Config json.RawMessage `json:"config"`
}

type ActionMsg struct {
	Type   string          `json:"type"`
	Action json.RawMessage `json:"action"`
}

type ActionAppliedMsg struct {
	Type   string          `json:"type"`
	Seq    int             `json:"seq"`
	Action json.RawMessage `json:"action"`
}

type LeaveMsg struct {
	Type string `json:"type"`
}

type ErrorMsg struct {
	Type    string `json:"type"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

type PingMsg struct {
	Type string `json:"type"`
	T    int64  `json:"t"`
}

type PongMsg struct {
	Type string `json:"type"`
	T    int64  `json:"t"`
}
