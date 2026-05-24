import type { GameState, PlayerState } from '@ttr/engine';
import { SOLID_COLORS } from '@ttr/engine';
import { useState } from 'react';
import { CARD_HEX, PLAYER_HEX, cardLabel } from '../lib/colors.js';

interface PlayerHudProps {
  state: GameState;
  player: PlayerState;
  highlightTicketEndpoints: (stationIds: string[]) => void;
}

export function PlayerHud({ state, player, highlightTicketEndpoints }: PlayerHudProps) {
  const [showTickets, setShowTickets] = useState(true);
  const isActive = state.turn === player.id;

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-slate-600"
              style={{ backgroundColor: PLAYER_HEX[player.color] }}
            />
            <span className="font-semibold">{player.name}</span>
            {isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100">
                your turn
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Score <span className="text-slate-100 font-medium">{player.score}</span>
            </div>
            <div>
              Cars <span className="text-slate-100 font-medium">{player.trainCars}</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-1">Hand</div>
          <div className="flex flex-wrap gap-1.5">
            {SOLID_COLORS.map((c) => {
              const n = player.hand[c];
              return (
                <span
                  key={c}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                    n > 0 ? 'border-slate-700' : 'border-slate-800 opacity-30'
                  }`}
                  style={{
                    backgroundColor: CARD_HEX[c],
                    color: c === 'yellow' || c === 'white' ? '#0f172a' : '#fff',
                  }}
                  title={`${cardLabel(c)}: ${n}`}
                >
                  {cardLabel(c)} {n}
                </span>
              );
            })}
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                player.hand.rainbow > 0 ? 'border-slate-700' : 'border-slate-800 opacity-30'
              } text-white`}
              style={{
                background: 'linear-gradient(90deg,#dc2626,#facc15,#16a34a,#2563eb,#a855f7)',
              }}
              title={`Rainbow: ${player.hand.rainbow}`}
            >
              Rainbow {player.hand.rainbow}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 w-72">
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-200 mb-1"
            onClick={() => setShowTickets((v) => !v)}
          >
            Tickets ({player.tickets.length}) {showTickets ? '▾' : '▸'}
          </button>
          {showTickets && (
            <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {player.tickets.length === 0 && <li className="text-slate-500">No tickets yet</li>}
              {player.tickets.map((t) => {
                const from = state.map.stations.find((s) => s.id === t.from);
                const to = state.map.stations.find((s) => s.id === t.to);
                return (
                  <li
                    key={t.id}
                    onMouseEnter={() => highlightTicketEndpoints([t.from, t.to])}
                    onMouseLeave={() => highlightTicketEndpoints([])}
                    className="bg-slate-800 rounded px-2 py-1 flex justify-between gap-2 cursor-default"
                  >
                    <span className="truncate">
                      {from?.name} → {to?.name}
                    </span>
                    <span className="text-amber-300 font-medium">{t.points}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
