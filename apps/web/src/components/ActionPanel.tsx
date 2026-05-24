import type { GameState, RouteId } from '@ttr/engine';
import { AnimatePresence, motion } from 'framer-motion';
import { CARD_HEX } from '../lib/colors.js';
import {
  canClaimRoute,
  canDrawBlind,
  canDrawFaceUp,
  canDrawTickets,
} from '../state/action-availability.js';
import { useGameStore } from '../state/store.js';

interface ActionPanelProps {
  state: GameState;
  viewerId: string;
  selectedRouteId: RouteId | null;
  onOpenClaim: () => void;
}

export function ActionPanel({ state, viewerId, selectedRouteId, onOpenClaim }: ActionPanelProps) {
  const dispatch = useGameStore((s) => s.dispatch);

  const blind = canDrawBlind(state, viewerId);
  const tickets = canDrawTickets(state, viewerId);
  const claim = selectedRouteId
    ? canClaimRoute(state, viewerId, selectedRouteId)
    : { allowed: false, reason: 'Select a route on the board' };
  const selectedRoute = selectedRouteId
    ? state.map.routes.find((r) => r.id === selectedRouteId)
    : null;

  return (
    <aside className="w-full md:w-72 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
      <header>
        <h2 className="font-semibold">Your turn</h2>
        <p className="text-xs text-slate-400">
          {state.pendingSecondCard ? 'Draw one more card to end your turn.' : 'Pick an action.'}
        </p>
      </header>

      <section>
        <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Face-up</h3>
        <div className="flex gap-1.5 flex-wrap">
          <AnimatePresence mode="popLayout">
            {state.faceUp.map((card, i) => {
              const ok = canDrawFaceUp(state, viewerId, i);
              return (
                <motion.button
                  type="button"
                  key={`${i}-${card}`}
                  layout
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!ok.allowed}
                  onClick={() => dispatch({ type: 'DrawFaceUp', playerId: viewerId, index: i })}
                  title={ok.reason}
                  aria-label={`Take ${card} card from face-up row`}
                  className="w-12 h-16 rounded-md border border-slate-700 text-[10px] font-semibold flex items-center justify-center disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  style={{
                    background:
                      card === 'rainbow'
                        ? 'linear-gradient(135deg,#dc2626,#facc15,#16a34a,#2563eb,#a855f7)'
                        : CARD_HEX[card],
                    color: card === 'yellow' || card === 'white' ? '#0f172a' : '#fff',
                  }}
                >
                  {card === 'rainbow' ? '★' : card[0]?.toUpperCase()}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <ActionButton
        label="Draw from deck"
        sublabel={`Deck: ${state.trainDeck.length} · Discard: ${state.discardPile.length}`}
        allow={blind}
        onClick={() => dispatch({ type: 'DrawBlind', playerId: viewerId })}
      />

      <ActionButton
        label="Draw 3 tickets"
        sublabel={`${state.ticketDeck.length} remain`}
        allow={tickets}
        onClick={() => dispatch({ type: 'DrawTickets', playerId: viewerId })}
      />

      <ActionButton
        label={selectedRoute ? `Claim ${selectedRoute.length}-route` : 'Claim route'}
        sublabel={
          selectedRoute
            ? `${stationName(state, selectedRoute.a)} ↔ ${stationName(state, selectedRoute.b)}`
            : 'No route selected'
        }
        allow={claim}
        onClick={onOpenClaim}
        accent="emerald"
      />
    </aside>
  );
}

function stationName(state: GameState, id: string): string {
  return state.map.stations.find((s) => s.id === id)?.name ?? id;
}

interface ActionButtonProps {
  label: string;
  sublabel?: string;
  allow: { allowed: boolean; reason?: string };
  onClick: () => void;
  accent?: 'emerald' | 'indigo';
}

function ActionButton({ label, sublabel, allow, onClick, accent = 'indigo' }: ActionButtonProps) {
  const colors =
    accent === 'emerald'
      ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600'
      : 'bg-indigo-700 hover:bg-indigo-600 border-indigo-600';
  return (
    <button
      type="button"
      disabled={!allow.allowed}
      onClick={onClick}
      title={allow.reason}
      className={`text-left rounded-lg border px-3 py-2 transition disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 ${colors}`}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-80 truncate">{allow.allowed ? sublabel : allow.reason}</div>
    </button>
  );
}
