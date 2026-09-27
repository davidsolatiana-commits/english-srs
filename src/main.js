import { createRoot } from 'react-dom/client';
import { html } from './lib/html.js';
import { openDatabase } from './lib/db.js';
import { App } from './components/App.js';
import { captureInstallPrompt } from './components/InstallButton.js';

captureInstallPrompt();

// Service worker: hace la app instalable y que abra sin conexión.
// Solo funciona en https o en localhost (no al abrir index.html como archivo).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker no registrado:', err));
}

const root = createRoot(document.getElementById('root'));
root.render(html`<p className="status">Cargando…</p>`);

openDatabase()
  .then((db) => root.render(html`<${App} db=${db} />`))
  .catch((err) => {
    console.error(err);
    root.render(html`
      <div className="status error">
        <strong>No se pudo abrir la base de datos.</strong>
        <p>${String(err?.message || err)}</p>
      </div>
    `);
  });
