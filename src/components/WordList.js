import { useMemo, useState } from 'react';
import { html } from '../lib/html.js';
import { relativeDay, todayISO } from '../lib/dates.js';
import { CATEGORIES, CEFR_LEVELS } from '../lib/db.js';
import { Backup } from './Backup.js';
import { SyncCard } from './Sync.js';
import { DictLink, SpeakButton } from './WordTools.js';
import { WordDetail } from './WordDetail.js';
import { MediaFill } from './MediaFill.js';

// Filtros del listado. '' = todas; '-' = sin ese dato.
const STATES = [
  { id: '', label: 'Todas' },
  { id: 'due', label: 'Para repasar hoy' },
  { id: 'new', label: 'Nuevas' },
  { id: 'hard', label: 'Difíciles' },
  { id: 'paused', label: 'En pausa' },
];

function matchesState(w, state, today) {
  switch (state) {
    case 'due':
      return !w.suspended && w.next_review_date <= today;
    case 'new':
      return !w.first_review_date;
    case 'hard': // fallada alguna vez (factor por debajo del inicial)
      return w.ease_factor < 2.5;
    case 'paused':
      return Boolean(w.suspended);
    default:
      return true;
  }
}

const matchesField = (value, wanted) => !wanted || (wanted === '-' ? !value : value === wanted);

export function WordList({ db, onChange, version, onWrite, onPractice }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('');
  // null = sin modo selección; Set de ids en modo selección.
  const [selected, setSelected] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const words = useMemo(() => db.listWords(), [db, version]);
  const exampleCounts = useMemo(() => db.exampleCounts(), [db, version]);
  const today = todayISO();
  const exampleTotal = (w) => (exampleCounts[w.id] || 0) + (w.example_sentence ? 1 : 0);

  const q = query.trim().toLowerCase();
  const visible = words.filter(
    (w) =>
      (!q || w.word_en.toLowerCase().includes(q) || w.translation_es.toLowerCase().includes(q)) &&
      matchesField(w.cefr_level, level) &&
      matchesField(w.category, category) &&
      matchesState(w, state, today),
  );
  const filtering = q || level || category || state;

  async function remove(w) {
    if (!confirm(`¿Borrar «${w.word_en}»?`)) return;
    await db.deleteWord(w.id);
    onChange();
  }

  async function setPaused(ids, paused) {
    await db.setSuspended(ids, paused);
    onChange();
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allVisibleSelected = selected && visible.length > 0 && visible.every((w) => selected.has(w.id));
  function toggleVisible() {
    const next = new Set(selected);
    visible.forEach((w) => (allVisibleSelected ? next.delete(w.id) : next.add(w.id)));
    setSelected(next);
  }

  const selectedIds = selected ? [...selected] : [];
  const selectedWords = words.filter((w) => selected?.has(w.id));
  const anyPaused = selectedWords.some((w) => w.suspended);
  const anyActive = selectedWords.some((w) => !w.suspended);

  async function pauseSelected(paused) {
    await setPaused(selectedIds, paused);
    setSelected(new Set());
  }

  const backup = html`
    <${MediaFill} db=${db} words=${words} exampleCounts=${exampleCounts} onChange=${onChange} />
    <${SyncCard} /><${Backup} db=${db} onChange=${onChange} wordCount=${words.length} />
    ${detailId &&
    html`<${WordDetail} key=${detailId} db=${db} wordId=${detailId} onClose=${() => setDetailId(null)} onChange=${onChange} />`}
  `;

  if (words.length === 0) {
    return html`
      <div className="card empty">Todavía no has añadido ninguna palabra.</div>
      ${backup}
    `;
  }

  const filterSelect = (label, value, onPick, options) => html`
    <label>
      <span>${label}</span>
      <select value=${value} onChange=${(e) => onPick(e.target.value)}>
        ${options.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
      </select>
    </label>
  `;
  const withNone = (values, none) => [
    { value: '', label: 'Todos' },
    ...values.map((v) => ({ value: v, label: v })),
    { value: '-', label: none },
  ];

  return html`
    <section>
      <div className="list-head">
        <input
          className="search"
          type="search"
          value=${query}
          onChange=${(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
        />
        <button
          className=${'btn small' + (selected ? ' primary' : '')}
          onClick=${() => setSelected(selected ? null : new Set())}
        >
          ${selected ? 'Hecho' : 'Seleccionar'}
        </button>
      </div>

      <div className="practice-settings list-filters">
        ${filterSelect('Nivel', level, setLevel, withNone(CEFR_LEVELS, 'Sin nivel'))}
        ${filterSelect('Tipo', category, setCategory, withNone(CATEGORIES, 'Sin tipo'))}
        ${filterSelect('Mostrar', state, setState, STATES.map((s) => ({ value: s.id, label: s.label })))}
        <span className="muted list-count">${visible.length} de ${words.length}</span>
        ${filtering &&
        html`<button
          className="btn small"
          onClick=${() => {
            setQuery('');
            setLevel('');
            setCategory('');
            setState('');
          }}
        >
          Quitar filtros
        </button>`}
      </div>

      ${selected &&
      html`
        <div className="selection-bar">
          <label className="switch">
            <input type="checkbox" checked=${allVisibleSelected} onChange=${toggleVisible} />
            Todas las visibles
          </label>
          <span className="muted">${selectedIds.length} seleccionadas</span>
          <span className="selection-actions">
            <button className="btn small primary" disabled=${!selectedIds.length} onClick=${() => onPractice(selectedIds)}>
              Practicar
            </button>
            <button className="btn small" disabled=${!selectedIds.length} onClick=${() => onWrite(selectedIds)}>
              ✍️ Escribir
            </button>
            ${anyActive && html`<button className="btn small" onClick=${() => pauseSelected(true)}>⏸ Pausar</button>`}
            ${anyPaused && html`<button className="btn small" onClick=${() => pauseSelected(false)}>▶ Reanudar</button>`}
          </span>
          <p className="muted selection-note">
            Practicar y escribir no cambian tus fechas de repaso. Las palabras en pausa no salen en ninguna práctica
            hasta que las reanudes.
          </p>
        </div>
      `}

      ${visible.length === 0 && html`<div className="card empty">Ninguna palabra coincide con los filtros.</div>`}

      <ul className="word-list">
        ${visible.map((w) => {
          const due = w.next_review_date <= today;
          const isSelected = selected?.has(w.id);
          return html`
            <li
              className=${'word-item' + (w.suspended ? ' paused' : '') + (isSelected ? ' selected' : '')}
              key=${w.id}
              onClick=${selected ? () => toggle(w.id) : undefined}
            >
              ${selected &&
              html`<input
                type="checkbox"
                className="word-check"
                checked=${isSelected}
                onClick=${(e) => e.stopPropagation()}
                onChange=${() => toggle(w.id)}
                aria-label=${`Seleccionar ${w.word_en}`}
              />`}
              ${w.image &&
              html`<img
                className="word-thumb"
                src=${w.image}
                alt=""
                loading="lazy"
                onClick=${selected ? undefined : () => setDetailId(w.id)}
              />`}
              <div className="word-main" onClick=${selected ? undefined : () => setDetailId(w.id)}>
                <div>
                  <strong className="word-open" title="Ver ficha: imagen y ejemplos">${w.word_en}</strong>
                  <${SpeakButton} text=${w.word_en} />
                  <span className="muted"> — ${w.translation_es}</span>
                </div>
                ${w.example_sentence &&
                html`<div className="example">${w.example_sentence} <${SpeakButton} text=${w.example_sentence} /></div>`}
                ${w.example_es && html`<div className="example-es muted">${w.example_es}</div>`}
                <div className="meta">
                  <${DictLink} word=${w.word_en} />
                  ${w.cefr_level && html`<span className="tag level">${w.cefr_level}</span>`}
                  ${w.category && html`<span className="tag">${w.category}</span>`}
                  ${w.source && html`<span className="tag source">${w.source}</span>`}
                  ${exampleTotal(w) > 1 && html`<span className="tag" title="Ejemplos guardados">${exampleTotal(w)} ejemplos</span>`}
                  ${w.suspended
                    ? html`<span className="review paused-label">⏸ En pausa</span>`
                    : w.first_review_date
                      ? html`<span className=${'review' + (due ? ' due' : '')}>
                          Repaso: ${relativeDay(w.next_review_date, today)}
                        </span>`
                      : html`<span className="review due">Nueva</span>`}
                </div>
              </div>
              ${!selected &&
              html`<div className="item-actions">
                <button
                  className="icon-btn write"
                  title="Practicar su escritura"
                  aria-label=${`Practicar la escritura de ${w.word_en}`}
                  onClick=${() => onWrite([w.id])}
                >
                  ✍️
                </button>
                <button
                  className="icon-btn"
                  title=${w.suspended ? 'Reanudar' : 'Pausar (no sale en la práctica)'}
                  aria-label=${`${w.suspended ? 'Reanudar' : 'Pausar'} ${w.word_en}`}
                  onClick=${() => setPaused([w.id], !w.suspended)}
                >
                  ${w.suspended ? '▶' : '⏸'}
                </button>
                <button className="icon-btn" title="Borrar" aria-label=${`Borrar ${w.word_en}`} onClick=${() => remove(w)}>
                  ✕
                </button>
              </div>`}
            </li>
          `;
        })}
      </ul>
    </section>
    ${backup}
  `;
}
