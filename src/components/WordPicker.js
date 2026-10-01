import { useEffect, useMemo, useState } from 'react';
import { html } from '../lib/html.js';
import { CEFR_LEVELS } from '../lib/db.js';
import { shuffle } from '../lib/modes.js';
import { groupOptions } from '../lib/groups.js';

// Cuántas palabras elegir (0 = sin límite).
export const PICK_SIZES = [5, 10, 15, 20, 0];

const LAST_KEY = 'english-srs:last-pick';

export function loadLastPick() {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveLastPick(pick) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(pick));
  } catch {
    // sin localStorage no se recuerda la última selección
  }
}

// Ventana para escoger una a una las palabras de la práctica libre o la escritura.
export function WordPicker({ db, kind, initialIds, onStart, onClose }) {
  const words = useMemo(() => db.listWords(), [db]);
  const last = loadLastPick();
  const [size, setSize] = useState(last?.size ?? 10);
  // Array (no Set) para conservar el orden en que se eligen.
  const [picked, setPicked] = useState(() => {
    const exists = new Set(words.map((w) => w.id));
    return (initialIds ?? []).filter((id) => exists.has(id));
  });
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [group, setGroup] = useState('');
  const [showPaused, setShowPaused] = useState(false);
  const groups = useMemo(() => db.listGroups(), [db]);
  const groupIds = useMemo(() => (group ? new Set(db.groupWordIds(Number(group))) : null), [db, group]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const q = query.trim().toLowerCase();
  const visible = words.filter(
    (w) =>
      (showPaused || !w.suspended || picked.includes(w.id)) &&
      (w.translation_es || picked.includes(w.id)) &&
      (!groupIds || groupIds.has(w.id)) &&
      (!level || w.cefr_level === level) &&
      (!q || w.word_en.toLowerCase().includes(q) || w.translation_es.toLowerCase().includes(q)),
  );

  const full = size > 0 && picked.length >= size;
  const byId = new Map(words.map((w) => [w.id, w]));

  function toggle(id) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (size > 0 && prev.length >= size) return prev;
      return [...prev, id];
    });
  }

  function changeSize(n) {
    setSize(n);
    if (n > 0) setPicked((prev) => prev.slice(0, n));
  }

  // Completa lo que falta con palabras al azar de las visibles (útil: eliges unas y la app pone el resto).
  function fillRandom() {
    setPicked((prev) => {
      const pool = shuffle(visible.filter((w) => !w.suspended && !prev.includes(w.id)).map((w) => w.id));
      const missing = size > 0 ? size - prev.length : pool.length;
      return [...prev, ...pool.slice(0, Math.max(0, missing))];
    });
  }

  // "Cargar grupo": todas las palabras visibles del grupo (sin límite de cantidad).
  function loadGroup() {
    setSize(0);
    setPicked(visible.filter((w) => !w.suspended).map((w) => w.id));
  }

  function start() {
    saveLastPick({ size, ids: picked });
    onStart(picked);
  }

  const lastIds = (last?.ids ?? []).filter((id) => byId.has(id));
  const target = size > 0 ? size : '∞';

  return html`
    <div className="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal picker" role="dialog" aria-modal="true" aria-label="Elegir palabras">
        <button className="icon-btn modal-close" onClick=${onClose} aria-label="Cerrar">✕</button>
        <h2>Elegir palabras</h2>
        <p className="muted picker-sub">
          Para ${kind === 'write' ? 'la escritura' : 'la práctica libre'}. No cambia tus fechas de repaso.
        </p>

        <div className="picker-size">
          <span className="muted">¿Cuántas?</span>
          <div className="chips">
            ${PICK_SIZES.map(
              (n) => html`<button
                key=${n}
                className=${'chip small' + (size === n ? ' selected' : '')}
                onClick=${() => changeSize(n)}
              >
                ${n === 0 ? 'Sin límite' : n}
              </button>`,
            )}
          </div>
        </div>

        <div className="picker-tools">
          <input
            className="search"
            type="search"
            value=${query}
            onChange=${(e) => setQuery(e.target.value)}
            placeholder="Buscar palabra…"
          />
          <select value=${level} onChange=${(e) => setLevel(e.target.value)} aria-label="Nivel">
            <option value="">Todos los niveles</option>
            ${CEFR_LEVELS.map((l) => html`<option key=${l} value=${l}>${l}</option>`)}
          </select>
        </div>
        ${groups.length > 0 &&
        html`<div className="picker-tools">
          <select value=${group} onChange=${(e) => setGroup(e.target.value)} aria-label="Grupo">
            <option value="">Todos los grupos</option>
            ${groupOptions(groups).map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
          </select>
          ${group &&
          html`<button className="btn small primary" onClick=${loadGroup}>📁 Cargar el grupo (${visible.filter((w) => !w.suspended).length})</button>`}
        </div>`}
        <div className="picker-links">
          <button className="btn small" onClick=${fillRandom} disabled=${full}>🎲 Completar al azar</button>
          ${picked.length > 0 && html`<button className="btn small" onClick=${() => setPicked([])}>Vaciar</button>`}
          ${lastIds.length > 0 &&
          picked.length === 0 &&
          html`<button className="btn small" onClick=${() => setPicked(size > 0 ? lastIds.slice(0, size) : lastIds)}>
            ↺ Última selección (${lastIds.length})
          </button>`}
          <label className="switch">
            <input type="checkbox" checked=${showPaused} onChange=${(e) => setShowPaused(e.target.checked)} />
            Ver en pausa
          </label>
        </div>

        ${picked.length > 0 &&
        html`<div className="picked-chips">
          ${picked.slice(0, 40).map(
            (id) => html`<button key=${id} className="chip small selected" onClick=${() => toggle(id)} title="Quitar">
              ${byId.get(id)?.word_en} ✕
            </button>`,
          )}
          ${picked.length > 40 && html`<span className="muted hint">y ${picked.length - 40} más</span>`}
        </div>`}

        <ul className="picker-list">
          ${visible.length === 0 && html`<li className="muted picker-empty">Ninguna palabra coincide.</li>`}
          ${visible.slice(0, 300).map((w) => {
            const on = picked.includes(w.id);
            const disabled = !on && full;
            return html`
              <li key=${w.id}>
                <label className=${'picker-item' + (on ? ' on' : '') + (disabled ? ' disabled' : '')}>
                  <input type="checkbox" checked=${on} disabled=${disabled} onChange=${() => toggle(w.id)} />
                  <span className="picker-word">
                    <strong>${w.word_en}</strong>
                    <span className="muted"> — ${w.translation_es}</span>
                  </span>
                  ${w.suspended ? html`<span className="tag">⏸</span>` : null}
                  ${w.cefr_level && html`<span className="tag level">${w.cefr_level}</span>`}
                </label>
              </li>
            `;
          })}
          ${visible.length > 300 &&
          html`<li className="muted picker-empty">…y ${visible.length - 300} más: usa el buscador o los filtros.</li>`}
        </ul>

        <div className="picker-footer">
          <span className=${'picker-count' + (full ? ' full' : '')}>${picked.length} / ${target}</span>
          <button className="btn primary" disabled=${picked.length === 0} onClick=${start}>
            ${kind === 'write' ? '✍️ Empezar a escribir' : 'Empezar a practicar'}
          </button>
        </div>
      </div>
    </div>
  `;
}
