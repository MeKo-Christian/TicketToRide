import { useState } from 'react';
import { useGameStore } from '../state/store.js';

export function Lobby() {
  const room = useGameStore((s) => s.room);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const setReady = useGameStore((s) => s.setReady);
  const startGame = useGameStore((s) => s.startOnlineGame);
  const leave = useGameStore((s) => s.leaveOnline);
  const youId = room?.youId;
  const [code, setCode] = useState('');

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold">Online lobby</h1>
            <p className="text-slate-400 text-sm">Create a new room or join one with a code.</p>
          </header>

          <button
            type="button"
            onClick={createRoom}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition"
          >
            Create new room
          </button>

          <div className="space-y-2">
            <label htmlFor="code-input" className="block text-sm">
              Or join with a code
            </label>
            <div className="flex gap-2">
              <input
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABCDEF"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 font-mono text-lg tracking-widest text-center uppercase"
              />
              <button
                type="button"
                disabled={code.trim().length !== 6}
                onClick={() => joinRoom(code)}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-md font-semibold"
              >
                Join
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={leave}
            className="w-full text-sm text-slate-400 hover:text-slate-200"
          >
            ← Back to home
          </button>
        </div>
      </main>
    );
  }

  const me = room.players.find((p) => p.id === youId);
  const isHost = youId === room.hostId;
  const everyoneReady = room.players.length >= 2 && room.players.every((p) => p.ready);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-2 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Room code</div>
          <div className="font-mono text-4xl tracking-[0.4em] text-emerald-400">{room.code}</div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(room.code)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Copy to clipboard
          </button>
        </header>

        <ul className="space-y-1.5">
          {room.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2"
            >
              <span>
                {p.name}
                {p.id === room.hostId && (
                  <span className="ml-2 text-xs text-amber-400">(host)</span>
                )}
                {p.id === youId && <span className="ml-2 text-xs text-sky-400">(you)</span>}
              </span>
              <span className={p.ready ? 'text-emerald-400 text-sm' : 'text-slate-500 text-sm'}>
                {p.ready ? '✓ ready' : 'waiting'}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReady(!me?.ready)}
            className="flex-1 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-md transition"
          >
            {me?.ready ? 'Un-ready' : 'Ready'}
          </button>
          {isHost && (
            <button
              type="button"
              onClick={startGame}
              disabled={!everyoneReady}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-md font-semibold"
            >
              Start game
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={leave}
          className="w-full text-sm text-slate-400 hover:text-slate-200"
        >
          Leave room
        </button>
      </div>
    </main>
  );
}
