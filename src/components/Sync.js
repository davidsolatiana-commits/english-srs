// Sincronización con Google Drive: botón ☁ del encabezado, tarjeta en "Palabras" y aviso de conflicto.

import { useState, useSyncExternalStore } from 'react';
import { html } from '../lib/html.js';
import { connect, disconnect, getSyncStatus, isConnected, subscribeSync, syncAvailable, syncNow } from '../lib/sync.js';

const useSync = () => useSyncExternalStore(subscribeSync, getSyncStatus);

function formatWhen(iso) {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Cuando hay cambios aquí y en la nube: elegir qué versión se queda.
function ConflictDialog({ onClose }) {
  const choose = (resolve) => {
    onClose();
    syncNow({ interactive: true, resolve });
  };
  return html`
    <div className="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card conflict" role="dialog" aria-modal="true" aria-label="Elegir versión">
        <h2>¿Qué versión conservo?</h2>
        <p className="muted">
          Hay cambios en este dispositivo y también en Google Drive (desde otro dispositivo). Elige cuál se queda: la
          otra se sustituye. Si dudas, descarga antes una copia en <em>Palabras → Copia de seguridad</em>.
        </p>
        <div className="conflict-options">
          <button className="btn primary" onClick=${() => choose('remote')}>☁ La de Google Drive<small>(otro dispositivo)</small></button>
          <button className="btn" onClick=${() => choose('local')}>📱 La de este dispositivo<small>(sube la de aquí)</small></button>
        </div>
      </div>
    </div>
  `;
}

const CHIP = {
  pending: '☁ Sincronizar',
  syncing: '☁ …',
  ok: '☁ ✓',
  conflict: '☁ ⚠ Elegir',
  error: '☁ ⚠ Reintentar',
};

export function SyncChip() {
  const s = useSync();
  const [conflictOpen, setConflictOpen] = useState(false);
  if (!syncAvailable || s.phase === 'off') return null;
  const onClick = () => (s.phase === 'conflict' ? setConflictOpen(true) : syncNow({ interactive: true }));
  return html`
    <button
      className=${'btn small sync-chip ' + s.phase}
      onClick=${onClick}
      disabled=${s.phase === 'syncing'}
      title=${s.message ?? `Sincronizado con Google Drive ${formatWhen(s.lastSync)}`}
    >
      ${CHIP[s.phase] ?? '☁'}
    </button>
    ${conflictOpen && html`<${ConflictDialog} onClose=${() => setConflictOpen(false)} />`}
  `;
}

export function SyncCard() {
  const s = useSync();
  const [conflictOpen, setConflictOpen] = useState(false);
  const connected = isConnected();

  if (!syncAvailable) {
    return html`
      <section className="card backup">
        <h2>Sincronizar con Google Drive</h2>
        <p className="muted">Disponible en la versión publicada de la app (davidsolatiana-commits.github.io).</p>
      </section>
    `;
  }

  return html`
    <section className="card backup sync-card">
      <h2>Sincronizar con Google Drive</h2>
      ${connected
        ? html`
            <p className=${'sync-state ' + s.phase}>
              ${s.phase === 'ok' && '✓ Al día'}${s.phase === 'syncing' && 'Sincronizando…'}${s.phase === 'pending' && 'Pendiente'}${s.phase === 'conflict' && '⚠ Hay que elegir versión'}${s.phase === 'error' && '⚠ Error'}
              <span className="muted"> · última sincronización: ${formatWhen(s.lastSync)}</span>
            </p>
            ${s.message && html`<p className="muted">${s.message}</p>`}
            <div className="actions">
              ${s.phase === 'conflict'
                ? html`<button className="btn primary" onClick=${() => setConflictOpen(true)}>Elegir versión</button>`
                : html`<button className="btn primary" disabled=${s.phase === 'syncing'} onClick=${() => syncNow({ interactive: true })}>Sincronizar ahora</button>`}
              <button className="btn" onClick=${() => confirm('¿Desconectar Google Drive en este dispositivo? Tus datos se quedan aquí y en Drive.') && disconnect()}>Desconectar</button>
            </div>
          `
        : html`
            <p className="muted">
              Guarda tus datos en tu Google Drive (en una carpeta oculta de la app: no ve ningún otro archivo tuyo) y
              tenlos iguales en el móvil y en el ordenador. Conéctalo en cada dispositivo con la misma cuenta.
            </p>
            ${s.message && html`<p className="msg error">${s.message}</p>`}
            <div className="actions">
              <button className="btn primary" onClick=${() => connect()}>Conectar con Google Drive</button>
            </div>
          `}
      ${conflictOpen && html`<${ConflictDialog} onClose=${() => setConflictOpen(false)} />`}
    </section>
  `;
}
