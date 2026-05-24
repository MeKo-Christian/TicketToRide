import type { PlayerState } from '@ttr/engine';
import { PLAYER_HEX } from '../lib/colors.js';

interface HandoffSplashProps {
  nextPlayer: PlayerState;
  onAcknowledge: () => void;
}

export function HandoffSplash({ nextPlayer, onAcknowledge }: HandoffSplashProps) {
  return (
    <div className="fixed inset-0 bg-slate-950 z-40 flex flex-col items-center justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-widest text-slate-500">Pass the device to</p>
        <h1 className="text-5xl font-bold flex items-center gap-3">
          <span
            className="inline-block w-10 h-10 rounded-full border-4 border-slate-700"
            style={{ backgroundColor: PLAYER_HEX[nextPlayer.color] }}
          />
          {nextPlayer.name}
        </h1>
        <p className="text-slate-400">Tap once you've sat down and the others have looked away.</p>
      </div>
      <button
        type="button"
        onClick={onAcknowledge}
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold"
      >
        I'm {nextPlayer.name} — start my turn
      </button>
    </div>
  );
}
