import { ENGINE_VERSION } from '@ttr/engine';
import { MAP_NAME } from '@ttr/map-data';

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Ticket to Ride — Hannover</h1>
      <p className="text-slate-400">Map: {MAP_NAME}</p>
      <p className="text-slate-500 text-sm">Engine v{ENGINE_VERSION} — M0 skeleton</p>
    </main>
  );
}
