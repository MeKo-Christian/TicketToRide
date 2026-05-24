# Ticket to Ride — Hannover Stadtbahn

A web reimplementation of *Ticket to Ride* set on the Hannover Stadtbahn network. Built with React + TypeScript, Bun, Vite, and shadcn/ui. Plays 2-5 hot-seat with AI opponents; online multiplayer planned via a Go backend.

> Status: M0 — skeleton. Not playable yet.

## Quick start

```sh
bun install
bun run dev        # start the Vite dev server
bun run build      # production build
bun run typecheck  # all workspaces
bun run test       # all workspaces
bun run lint       # biome check
```

## Layout

```
apps/web/           Vite React app (UI)
packages/engine/    Pure TS rules engine
packages/map-data/  Hannover Stadtbahn graph + tickets
packages/ai/        Heuristic bots
server/             Go backend (planned, M6)
docs/plans/         Design docs
```

## Design

See [`docs/plans/2026-05-24-ticket-to-ride-hannover-design.md`](docs/plans/2026-05-24-ticket-to-ride-hannover-design.md) for the full design.

## License

TBD. Not affiliated with Days of Wonder.
