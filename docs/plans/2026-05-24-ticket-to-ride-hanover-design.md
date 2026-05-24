# Ticket to Ride — Hannover Stadtbahn

**Date:** 2026-05-24
**Status:** Design approved, M0 in progress

A web reimplementation of Days of Wonder's *Ticket to Ride* using the Hannover Stadtbahn network as its map. Faithful to the original rules, with route lengths and topology adapted to the real Stadtbahn graph (lines 1-18).

## Goals

- Play locally on a single computer: 2-5 players, any mix of humans (hot-seat) and AI bots.
- Ship as a static SPA on GitHub Pages.
- Architect for later online multiplayer via a Go backend (cobra/viper CLI) without rewriting the engine.

## Non-goals (v1)

- Online multiplayer (planned, deferred to M6).
- Geographic accuracy of the map (schematic only).
- Mobile-first; we'll target desktop browsers first and adapt later.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime / pkg manager | Bun | Fast install + workspace support, user preference |
| Build | Vite | Fast HMR, simple Pages deploy |
| UI | React 18 + TypeScript | User preference |
| Styling | Tailwind CSS + shadcn/ui | Chrome components only; board is custom SVG |
| State | Zustand wrapping a pure reducer | Reducer purity = portable to server later |
| Board | Hand-authored SVG (viewBox, pan/zoom) | Best readability for game state |
| Animation | Framer Motion | Card draws, route claims, scoring reveal |
| Lint/format | Biome | Single tool, fast |
| Tests | Vitest + Testing Library + Playwright + fast-check | Unit, component, E2E, property |
| CI | GitHub Actions | Native Pages deploy |
| Backend (phase 2) | Go + cobra/viper, WebSockets | User preference; cleanly separable |

## Repository layout

```
/
├── apps/web/           # Vite React app
├── packages/engine/    # Pure TS rules engine
├── packages/map-data/  # Hannover Stadtbahn graph + tickets
├── packages/ai/        # Heuristic bots
├── server/             # Go backend (phase 2)
├── docs/               # plans/, design notes
└── .github/workflows/  # ci.yml, pages.yml
```

Bun workspaces glue the TS packages. Engine has no React/DOM imports — provable by lint rule.

## Engine

A single pure module: types, `initialState(config, seed)`, `reduce(state, action) => state`. No I/O; randomness only via an injected seeded RNG so tests, replays, and a future server are deterministic.

### Core types (sketch)

```ts
type Color = 'red'|'orange'|'yellow'|'green'|'blue'|'pink'|'white'|'black'|'rainbow';
type StationId = string;
type RouteId   = string;
type PlayerId  = string;

interface Route {
  id: RouteId;
  a: StationId; b: StationId;
  length: number;           // 1-6, derived from real intermediate-stop count
  color: Color | 'gray';    // 'gray' = any single color
  line: number;             // Stadtbahn line for flavor
  parallel?: RouteId;       // double route, 4-5p only
}

interface Ticket { id: string; from: StationId; to: StationId; points: number; }

interface PlayerState {
  id: PlayerId; name: string; color: PlayerColor; isAI: boolean;
  trainCars: number;        // starts at 45
  hand: Record<Color, number>;
  tickets: Ticket[];
  claimedRoutes: RouteId[];
  score: number;            // running, ticket settlement at end
}

interface GameState {
  players: PlayerState[];
  turn: PlayerId;
  phase: 'setup'|'play'|'lastRound'|'scoring'|'finished';
  trainDeck: Color[]; faceUp: Color[]; discardPile: Color[];
  ticketDeck: Ticket[];
  pendingTicketDraw?: { playerId: PlayerId; offered: Ticket[]; minKeep: number };
  pendingSecondCard?: boolean;
  rngSeed: number;
  log: GameEvent[];
}
```

### Actions

`StartGame`, `DrawFaceUp`, `DrawBlind`, `ClaimRoute`, `DrawTickets`, `KeepTickets`, `EndTurn`. Validated; invalid actions return unchanged state plus an error event in the log.

### Rules the engine must honor

- 3-face-up-rainbow auto-reshuffle.
- Drawing a face-up rainbow ends the turn; otherwise two cards per draw turn.
- Last-round trigger: any player drops to ≤2 cars, everyone (incl. the trigger) gets one more turn.
- Ticket-keep minimum: 2 initial, 1 mid-game.
- Double-route restriction: same player cannot claim both parallels; parallels disabled at 2-3p.
- Longest continuous path bonus: 10 pts, ties share.
- Scoring per route: 1/2/4/7/10/15 for lengths 1-6.

## Map data (`packages/map-data`)

Typed, immutable graph. No game logic.

- **~32 hand-curated stations** covering termini, interchanges, and landmarks across all Stadtbahn lines.
- **Edges follow real line topology**: intermediate stops between curated stations collapse into a single edge; `length` reflects the number of collapsed stops, clamped to 1-6.
- **Gameplay color** is assigned per edge for card-management interest; **line color** is separate flavor metadata.
- **Double routes** on central segments (e.g. Kröpcke–Hauptbahnhof) for 4-5p.
- **~30-35 tickets** mixing short city hops (4 pts) with long cross-network runs (20 pts) and one or two "ride a full line" tickets.
- **Coordinates** are 2D layout positions for the schematic SVG, hand-tuned for readability (center expanded).

Validation tests assert: graph is connected, every line referenced exists, ticket endpoints are reachable, all edges have length ∈ [1, 6].

## UI (`apps/web`)

- **Board** — single SVG, viewBox-scaled, pan/zoom via wheel + drag. Routes are clickable `<path>` segments; hover highlights, dim when unclaimable, color when owned. Selected ticket endpoints pulse.
- **Player HUD** — bottom bar: hand by color with counts, train-car count, score, tickets (collapsible, hand-hide for hot-seat). Other players as compact cards along the top.
- **Action panel** — context-sensitive: "Draw card", "Claim route" (route click → cost preview, rainbow picker), "Draw tickets". Disabled buttons explain why.
- **Hot-seat handoff** — between turns, full-screen "Pass to {next player}" splash.
- **Scoring screen** — animated route bonus reveal, ticket settlement, longest-path highlight.
- shadcn for dialogs/buttons/sheets/tooltips, Tailwind everywhere else, Framer Motion for transitions.

## AI (`packages/ai`)

Pure `chooseAction(state, playerId, difficulty) => Action`. Runs in a Web Worker so the UI never blocks.

Difficulty levels:
- **Passive** — maximize own ticket completion, never blocks, greedy on face-up rainbows.
- **Normal** — Passive + early connector routes, swap tickets when current set looks impossible.
- **Aggressive** — Normal + opportunistic blocking using inferred opponent goals, competes for longest-path.

Shared primitives: Dijkstra over claimable routes, ticket-completion estimator, route-value scorer.

## Multiplayer (phase 2, planned)

Engine reducer is pure → server can host the authoritative state.

- Go service: `cmd/server` using cobra/viper (`--port`, `--db`, `--cors`).
- WebSocket rooms, 6-char join codes, server-side action validation, reconnect token.
- Optional SQLite persistence for in-flight games.
- Client gains a `remote-adapter` mirroring the current `local-adapter`; UI unchanged.

Open question deferred to M6: re-implement the engine in Go vs. embed a JS runtime server-side. Decide at M6 kickoff.

## Testing

- **Engine**: Vitest 90%+ coverage; table-driven tests per action; fast-check properties (card-count conservation, score monotonicity within a turn).
- **AI**: bot-vs-bot simulation harness; asserts termination, legality, and difficulty ordering on win-rate.
- **UI**: component tests for HUD/action panel; one Playwright E2E happy-path.
- **Map data**: graph connectivity, ticket reachability, edge-length range.

## CI/CD

- `ci.yml` — on PR + push to main: bun install (cached), typecheck, Biome, Vitest, Playwright.
- `pages.yml` — on push to main: build with `VITE_BASE=/TicketToRide/`, deploy via `actions/deploy-pages`.
- Branch protection on `main`: CI required.

## Milestones

| ID | Goal | Ships |
|----|------|-------|
| M0 | Skeleton: bun workspace, Vite app, CI green, Pages deploys "hello" build | Working pipeline |
| M1 | Engine core: state, actions, deck/hand, claim validation, full tests | Engine package |
| M2 | Map data: curated stations, edges, tickets, validation tests pass | Map package |
| M3 | Playable hot-seat: SVG board, HUD, action panel, end-of-game scoring | 2-human game |
| M4 | AI bots: passive/normal/aggressive in worker, seat assignment | Solo + AI |
| M5 | Polish: animations, optional sounds, mobile layout, a11y, replay viewer | v1 release |
| M6 | Multiplayer: Go server, WS rooms, remote adapter, separate deploy | Online play |

Each milestone ships a usable build to Pages.
