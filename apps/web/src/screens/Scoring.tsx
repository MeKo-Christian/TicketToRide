import type { GameState } from '@ttr/engine';
import { finalScores } from '@ttr/engine';
import { useMemo } from 'react';
import { PLAYER_HEX } from '../lib/colors.js';
import { useGameStore } from '../state/store.js';

interface ScoringProps {
  state: GameState;
}

export function Scoring({ state }: ScoringProps) {
  const reset = useGameStore((s) => s.reset);
  const scores = useMemo(() => {
    const xs = finalScores(state);
    return xs
      .map((s) => ({
        ...s,
        player: state.players.find((p) => p.id === s.playerId)!,
      }))
      .sort((a, b) => b.total - a.total);
  }, [state]);

  const winner = scores[0]!;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6 border border-slate-700">
        <header className="text-center space-y-1">
          <p className="text-sm uppercase tracking-widest text-slate-500">Final score</p>
          <h1 className="text-3xl font-bold">
            {winner.player.name} wins with {winner.total} pts
          </h1>
        </header>

        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left pb-2">Player</th>
              <th className="text-right pb-2">Routes</th>
              <th className="text-right pb-2">Tickets</th>
              <th className="text-right pb-2">Longest</th>
              <th className="text-right pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={s.playerId} className="border-t border-slate-800">
                <td className="py-2 flex items-center gap-2">
                  <span className="text-slate-500 w-4">{i + 1}.</span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLAYER_HEX[s.player.color] }}
                  />
                  <span className="font-medium">{s.player.name}</span>
                </td>
                <td className="text-right">{s.routePoints}</td>
                <td className={`text-right ${s.ticketPoints < 0 ? 'text-rose-400' : ''}`}>
                  {s.ticketPoints > 0 ? '+' : ''}
                  {s.ticketPoints}
                </td>
                <td className="text-right">
                  {s.longestPath}
                  {s.longestPathBonus > 0 && (
                    <span className="text-amber-300 ml-1">+{s.longestPathBonus}</span>
                  )}
                </td>
                <td className="text-right font-bold">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={reset}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold"
        >
          New game
        </button>
      </div>
    </main>
  );
}
