import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@core/i18n';
import { App } from '@app/App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
