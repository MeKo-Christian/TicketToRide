import { Home } from './screens/Home.js';
import { Lobby } from './screens/Lobby.js';
import { Play } from './screens/Play.js';
import { Scoring } from './screens/Scoring.js';
import { Setup } from './screens/Setup.js';
import { useGameStore } from './state/store.js';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const state = useGameStore((s) => s.state);

  if (screen === 'scoring' && state) return <Scoring state={state} />;
  if (screen === 'play' && state) return <Play state={state} />;
  if (screen === 'lobby') return <Lobby />;
  if (screen === 'setup') return <Setup />;
  return <Home />;
}
