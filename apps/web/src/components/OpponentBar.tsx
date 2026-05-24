import type { GameState } from '@ttr/engine';
import { PLAYER_HEX } from '../lib/colors.js';

interface OpponentBarProps {
  state: GameState;
  viewerId: string;
}

export function OpponentBar({ state, viewerId }: OpponentBarProps) {
  const others = state.players.filter((p) => p.id !== viewerId);
  const handTotal = (p: { hand: Record<string, number> }) =>
    Object.values(p.hand).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex gap-3 items-center text-xs overflow-x-auto">
      <span className="text-slate-400 mr-1 flex-shrink-0">Opponents</span>
      {others.map((p) => {
        const active = state.turn === p.id;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border flex-shrink-0 ${
              active ? 'border-emerald-500 bg-emerald-900/30' : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: PLAYER_HEX[p.color] }}
            />
            <span className="font-medium text-slate-100">{p.name}</span>
            <span className="text-slate-400">{p.score} pts</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{handTotal(p)} cards</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{p.trainCars} cars</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{p.tickets.length} tix</span>
          </div>
        );
      })}
      <div className="ml-auto flex items-center gap-3 text-slate-400 flex-shrink-0">
        <span>Deck: {state.trainDeck.length}</span>
        <span>Tickets: {state.ticketDeck.length}</span>
        {state.phase === 'lastRound' && (
          <span className="text-amber-300 font-semibold">LAST ROUND</span>
        )}
      </div>
    </div>
  );
}
