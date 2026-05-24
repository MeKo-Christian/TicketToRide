import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './index.css';
import { useGameStore } from './state/store.js';

// TEMP-DEBUG: expose store for rotation verification
if (import.meta.env.DEV) (window as unknown as { __store: unknown }).__store = useGameStore;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
