import type { GameState } from '@ttr/engine';
import { finalScores } from '@ttr/engine';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Confetti } from '../components/Confetti.js';
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

  const topScore = scores[0]!.total;
  const winners = scores.filter((s) => s.total === topScore);
  const isTie = winners.length > 1;
  const winnerColors = winners.map((w) => PLAYER_HEX[w.player.color]);
  const confettiColors = [...winnerColors, '#facc15', '#f8fafc'];

  const headline = isTie
    ? `Tie at ${topScore} pts — ${winners.map((w) => w.player.name).join(' & ')}`
    : `${winners[0]!.player.name} wins with ${topScore} pts`;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative">
      <Confetti colors={confettiColors} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6 border border-slate-700 relative z-10"
      >
        <header className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 12 }}
            className="text-5xl"
            aria-hidden="true"
          >
            🏆
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm uppercase tracking-widest text-slate-500"
          >
            {isTie ? 'Game over' : 'Final score'}
          </motion.p>
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
            className="text-3xl font-bold"
            style={
              !isTie
                ? {
                    textShadow: `0 0 24px ${winnerColors[0]}66`,
                  }
                : undefined
            }
            aria-live="polite"
          >
            {headline}
          </motion.h1>
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
            {scores.map((s, i) => {
              const isWinner = s.total === topScore;
              return (
                <motion.tr
                  key={s.playerId}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  className={`border-t border-slate-800 ${isWinner ? 'bg-amber-500/10' : ''}`}
                >
                  <td className="py-2 flex items-center gap-2">
                    <span className="text-slate-500 w-4">{i + 1}.</span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: PLAYER_HEX[s.player.color],
                        boxShadow: isWinner ? `0 0 8px ${PLAYER_HEX[s.player.color]}` : undefined,
                      }}
                    />
                    <span className="font-medium">{s.player.name}</span>
                    {isWinner && (
                      <span aria-hidden="true" className="text-amber-300">
                        👑
                      </span>
                    )}
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
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        <button
          type="button"
          onClick={reset}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          New game
        </button>
      </motion.div>
    </main>
  );
}
