import { chooseAction } from '@ttr/ai';
import type { GameState, RouteId } from '@ttr/engine';
import { useEffect, useState } from 'react';
import { ActionPanel } from '../components/ActionPanel.js';
import { Board } from '../components/Board/Board.js';
import { ClaimRouteDialog } from '../components/ClaimRouteDialog.js';
import { HandoffSplash } from '../components/HandoffSplash.js';
import { OpponentBar } from '../components/OpponentBar.js';
import { PlayerHud } from '../components/PlayerHud.js';
import { TicketDrawDialog } from '../components/TicketDrawDialog.js';
import { PLAYER_HEX } from '../lib/colors.js';
import { useGameStore } from '../state/store.js';

interface PlayProps {
  state: GameState;
}

const AI_THINK_MS = 700;

function activePlayerId(state: GameState): string {
  return state.pendingTicketDraw?.playerId ?? state.turn;
}

export function Play({ state }: PlayProps) {
  const seatedPlayerId = useGameStore((s) => s.seatedPlayerId);
  const seat = useGameStore((s) => s.seat);
  const dispatch = useGameStore((s) => s.dispatch);
  const difficulties = useGameStore((s) => s.difficulties);
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  const active = activePlayerId(state);
  const activePlayer = state.players.find((p) => p.id === active);
  const activeIsAI = !!activePlayer?.isAI;

  // Clear selection when the active player flips — `active` is intentionally a trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggers reset, not captured
  useEffect(() => {
    setSelectedRouteId(null);
    setClaimOpen(false);
  }, [active]);

  // AI auto-play: when the active seat is a bot, dispatch its chosen action.
  useEffect(() => {
    if (!activeIsAI) return;
    const difficulty = difficulties[active];
    if (!difficulty) return;
    const id = setTimeout(() => {
      const action = chooseAction(state, active, difficulty);
      dispatch(action);
    }, AI_THINK_MS);
    return () => clearTimeout(id);
  }, [activeIsAI, active, state, difficulties, dispatch]);

  // Hand-off splash only when active is a *human* not currently seated.
  const needsHandoff = !activeIsAI && active !== seatedPlayerId;

  if (needsHandoff) {
    const nextPlayer = state.players.find((p) => p.id === active);
    if (!nextPlayer) return null;
    return <HandoffSplash nextPlayer={nextPlayer} onAcknowledge={() => seat(active)} />;
  }

  const viewer = state.players.find((p) => p.id === seatedPlayerId);
  if (!viewer) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <OpponentBar state={state} viewerId={viewer.id} />
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <Board
            state={state}
            viewerId={viewer.id}
            selectedRouteId={selectedRouteId}
            highlightedStationIds={highlight}
            onSelectRoute={setSelectedRouteId}
          />
          {activeIsAI && activePlayer && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-full px-4 py-1.5 text-sm flex items-center gap-2 shadow-xl">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: PLAYER_HEX[activePlayer.color] }}
              />
              <span className="text-slate-200">{activePlayer.name} is thinking…</span>
            </div>
          )}
        </div>
        <ActionPanel
          state={state}
          viewerId={viewer.id}
          selectedRouteId={selectedRouteId}
          onOpenClaim={() => setClaimOpen(true)}
        />
      </div>
      <PlayerHud
        state={state}
        player={viewer}
        highlightTicketEndpoints={(ids) => setHighlight(new Set(ids))}
      />

      {state.pendingTicketDraw && state.pendingTicketDraw.playerId === viewer.id && !activeIsAI && (
        <TicketDrawDialog state={state} />
      )}
      {claimOpen && selectedRouteId && !activeIsAI && (
        <ClaimRouteDialog
          state={state}
          viewerId={viewer.id}
          routeId={selectedRouteId}
          onClose={() => setClaimOpen(false)}
        />
      )}
    </div>
  );
}
