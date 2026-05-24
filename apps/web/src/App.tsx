import { Play } from './screens/Play.js';
import { Scoring } from './screens/Scoring.js';
import { Setup } from './screens/Setup.js';
import { useGameStore } from './state/store.js';

export default function App() {
  const state = useGameStore((s) => s.state);

  if (!state) return <Setup />;
  if (state.phase === 'finished') return <Scoring state={state} />;
  return <Play state={state} />;
}
