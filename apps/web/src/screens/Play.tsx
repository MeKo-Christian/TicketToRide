import type { GameState, RouteId } from '@ttr/engine';
import { useEffect, useState } from 'react';
import { ActionPanel } from '../components/ActionPanel.js';
import { Board } from '../components/Board/Board.js';
import { ClaimRouteDialog } from '../components/ClaimRouteDialog.js';
import { HandoffSplash } from '../components/HandoffSplash.js';
import { OpponentBar } from '../components/OpponentBar.js';
import { PlayerHud } from '../components/PlayerHud.js';
import { TicketDrawDialog } from '../components/TicketDrawDialog.js';
import { useGameStore } from '../state/store.js';

interface PlayProps {
  state: GameState;
}

function activePlayerId(state: GameState): string {
  return state.pendingTicketDraw?.playerId ?? state.turn;
}

export function Play({ state }: PlayProps) {
  const seatedPlayerId = useGameStore((s) => s.seatedPlayerId);
  const seat = useGameStore((s) => s.seat);
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  const active = activePlayerId(state);
  const needsHandoff = active !== seatedPlayerId;

  // Clear selection when the active player flips — `active` is intentionally a trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggers reset, not captured
  useEffect(() => {
    setSelectedRouteId(null);
    setClaimOpen(false);
  }, [active]);

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

      {state.pendingTicketDraw && state.pendingTicketDraw.playerId === viewer.id && (
        <TicketDrawDialog state={state} />
      )}
      {claimOpen && selectedRouteId && (
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
