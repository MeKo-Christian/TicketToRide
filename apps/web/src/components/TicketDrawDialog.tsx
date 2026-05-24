import type { GameState } from '@ttr/engine';
import { useState } from 'react';
import { useGameStore } from '../state/store.js';

interface TicketDrawDialogProps {
  state: GameState;
}

export function TicketDrawDialog({ state }: TicketDrawDialogProps) {
  const dispatch = useGameStore((s) => s.dispatch);
  const pending = state.pendingTicketDraw;
  // Default to keeping all offered tickets; the player toggles off any they want to discard.
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(pending?.offered.map((t) => t.id) ?? []),
  );

  if (!pending) return null;
  const player = state.players.find((p) => p.id === pending.playerId);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const enough = picked.size >= pending.minKeep;

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-30">
      <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700 shadow-2xl">
        <header>
          <h2 className="text-xl font-bold">Tickets for {player?.name}</h2>
          <p className="text-sm text-slate-400">
            Keep at least {pending.minKeep} of the {pending.offered.length} offered tickets. Unmet
            tickets cost you their points at the end of the game.
          </p>
        </header>
        <ul className="space-y-2">
          {pending.offered.map((t) => {
            const from = state.map.stations.find((s) => s.id === t.from);
            const to = state.map.stations.find((s) => s.id === t.to);
            const on = picked.has(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 transition text-left ${
                    on
                      ? 'bg-emerald-900/40 border-emerald-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {from?.name} → {to?.name}
                    </div>
                    <div className="text-xs text-slate-400">{on ? 'Keeping' : 'Discarding'}</div>
                  </div>
                  <div className="text-amber-300 font-bold text-lg">{t.points}</div>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          disabled={!enough}
          onClick={() =>
            dispatch({
              type: 'KeepTickets',
              playerId: pending.playerId,
              keep: [...picked],
            })
          }
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold"
        >
          Confirm ({picked.size} keeping)
        </button>
      </div>
    </div>
  );
}
