import type { PlayerColor } from '@ttr/engine';
import { PLAYER_COLORS } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { useState } from 'react';
import { PLAYER_HEX } from '../lib/colors.js';
import { useGameStore } from '../state/store.js';

interface SeatInput {
  name: string;
  color: PlayerColor;
}

const DEFAULT_NAMES = ['Alex', 'Bea', 'Cara', 'Dan', 'Evi'];

function makeSeats(n: number): SeatInput[] {
  return Array.from({ length: n }, (_, i) => ({
    name: DEFAULT_NAMES[i] ?? `Player ${i + 1}`,
    color: PLAYER_COLORS[i] ?? 'red',
  }));
}

export function Setup() {
  const startGame = useGameStore((s) => s.startGame);
  const [count, setCount] = useState(2);
  const [seats, setSeats] = useState<SeatInput[]>(() => makeSeats(2));
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));

  const updateCount = (n: number) => {
    setCount(n);
    setSeats(makeSeats(n));
  };

  const updateSeat = (i: number, patch: Partial<SeatInput>) =>
    setSeats((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const duplicateColors = new Set(
    seats.map((s) => s.color).filter((c, i, arr) => arr.indexOf(c) !== i),
  );
  const duplicateNames = new Set(
    seats.map((s) => s.name.trim().toLowerCase()).filter((n, i, arr) => n && arr.indexOf(n) !== i),
  );
  const blank = seats.some((s) => !s.name.trim());
  const canStart = duplicateColors.size === 0 && duplicateNames.size === 0 && !blank;

  const start = () => {
    if (!canStart) return;
    startGame({
      seed,
      map: hannoverMap,
      players: seats.map((s, i) => ({
        id: `p${i + 1}`,
        name: s.name.trim(),
        color: s.color,
        isAI: false,
      })),
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Ticket to Ride — Hannover</h1>
          <p className="text-slate-400 text-sm">Hot-seat for 2-5 humans · Hannover Stadtbahn map</p>
        </header>

        <section className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="player-count">
            Players
          </label>
          <div id="player-count" className="flex gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateCount(n)}
                className={`flex-1 py-2 rounded-lg border transition ${
                  count === n
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {seats.map((seat, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-slate-400 text-right">{i + 1}.</span>
              <input
                type="text"
                value={seat.name}
                onChange={(e) => updateSeat(i, { name: e.target.value })}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Player ${i + 1}`}
                maxLength={20}
              />
              <div className="flex gap-1">
                {PLAYER_COLORS.map((c) => {
                  const taken = seats.some((s, idx) => idx !== i && s.color === c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={taken}
                      onClick={() => updateSeat(i, { color: c })}
                      title={taken ? `${c} taken` : c}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        seat.color === c
                          ? 'border-white scale-110'
                          : 'border-slate-700 hover:border-slate-500'
                      } ${taken ? 'opacity-25 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: PLAYER_HEX[c] }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-2 text-sm">
          <label className="block font-medium" htmlFor="seed-input">
            RNG seed
          </label>
          <div className="flex gap-2">
            <input
              id="seed-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}
              className="px-3 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700"
            >
              Randomise
            </button>
          </div>
          <p className="text-slate-500 text-xs">Same seed → same shuffles. Handy for retries.</p>
        </section>

        {!canStart && (
          <p className="text-amber-400 text-sm">
            Each player needs a unique name and colour before you can start.
          </p>
        )}

        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold transition"
        >
          Start game
        </button>
      </div>
    </main>
  );
}
