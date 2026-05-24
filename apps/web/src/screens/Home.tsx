import { isOnlineModeAvailable } from '../net/mpClient.js';
import { useGameStore } from '../state/store.js';

export function Home() {
  const goSetup = useGameStore((s) => s.goSetup);
  const enterOnline = useGameStore((s) => s.enterOnline);
  const onlineAvailable = isOnlineModeAvailable();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Ticket to Ride — Hannover</h1>
          <p className="text-slate-400 text-sm">
            Hannover Stadtbahn map · 2-5 players · hot-seat, vs AI, or online
          </p>
        </header>

        <div className={`grid gap-4 ${onlineAvailable ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          <Tile
            title="Local game"
            subtitle="Hot-seat or vs AI"
            description="Mix humans and bots on this device. No server required."
            accent="emerald"
            onClick={goSetup}
          />

          {onlineAvailable && (
            <Tile
              title="Online game"
              subtitle="Create or join with a code"
              description="Play across devices via the relay server. 2-5 humans only."
              accent="indigo"
              onClick={() => {
                const name = window.prompt('Display name', 'Player') ?? '';
                if (!name.trim()) return;
                enterOnline(name.trim());
              }}
            />
          )}
        </div>

        {!onlineAvailable && (
          <p className="text-slate-500 text-xs text-center">
            Online mode is disabled in this build (no <code>VITE_MP_SERVER_URL</code>).
          </p>
        )}
      </div>
    </main>
  );
}

interface TileProps {
  title: string;
  subtitle: string;
  description: string;
  accent: 'emerald' | 'indigo';
  onClick: () => void;
}

function Tile({ title, subtitle, description, accent, onClick }: TileProps) {
  const ring =
    accent === 'emerald'
      ? 'border-emerald-700 hover:border-emerald-500'
      : 'border-indigo-700 hover:border-indigo-500';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border-2 bg-slate-800/40 p-5 transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${ring}`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{subtitle}</div>
      <div className="text-xl font-semibold text-slate-100 mt-1">{title}</div>
      <div className="text-sm text-slate-400 mt-2">{description}</div>
    </button>
  );
}
