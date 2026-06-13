import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { bootstrapTheme } from '@/context/ThemeContext';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/premium.css';
import './styles/apple.css';
import './styles/tablet.css';
import './styles/ultra.css';

bootstrapTheme();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
