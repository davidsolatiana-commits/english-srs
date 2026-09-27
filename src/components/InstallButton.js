// Botón "Instalar app" (Chrome/Edge en PC y Android) y aviso para iPhone/iPad,
// donde la instalación se hace a mano desde Safari.

import { useState, useSyncExternalStore } from 'react';
import { html } from '../lib/html.js';

const IOS_HINT_KEY = 'english-srs:ios-install-hint-closed';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

// Hay que llamarlo al arrancar: el navegador puede avisar de que la app es instalable
// antes de que React pinte nada.
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // guardamos el aviso para mostrar nuestro propio botón
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function readHintClosed() {
  try {
    return localStorage.getItem(IOS_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function InstallButton() {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt);
  if (!prompt || isStandalone()) return null;

  async function install() {
    prompt.prompt();
    await prompt.userChoice.catch(() => null);
    deferredPrompt = null;
    notify();
  }

  return html`<button className="btn small install" onClick=${install}>📲 Instalar app</button>`;
}

export function IOSInstallHint() {
  const [closed, setClosed] = useState(readHintClosed);
  if (closed || !isIOS() || isStandalone()) return null;

  function close() {
    setClosed(true);
    try {
      localStorage.setItem(IOS_HINT_KEY, '1');
    } catch {
      // sin localStorage el aviso volverá a salir la próxima vez
    }
  }

  return html`
    <div className="install-hint" role="note">
      <span>📲 Para instalarla: toca <strong>Compartir</strong> (en Safari o Chrome) y luego
        <strong>«Añadir a pantalla de inicio»</strong>.</span>
      <button className="icon-btn" aria-label="Cerrar aviso" onClick=${close}>✕</button>
    </div>
  `;
}
