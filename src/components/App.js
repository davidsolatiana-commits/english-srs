import { useEffect, useState } from 'react';
import { html } from '../lib/html.js';
import { processPending } from '../lib/phrases.js';
import { todayISO } from '../lib/dates.js';
import { MODES } from '../lib/modes.js';
import {
  FREE_ORDERS,
  FREE_SIZES,
  NEW_PER_DAY_OPTIONS,
  WRITE_REPS,
  WRITE_WORD_COUNTS,
  loadSettings,
  saveSettings,
} from '../lib/settings.js';
import { Practice } from './Practice.js';
import { WritingPractice } from './WritingPractice.js';
import { AddWord } from './AddWord.js';
import { WordList } from './WordList.js';
import { Phrases } from './Phrases.js';
import { Notebook } from './Notebook.js';
import { Grammar } from './Grammar.js';
import { InstallButton, IOSInstallHint } from './InstallButton.js';

// "Añadir palabra" no es pestaña: es el botón flotante ＋, disponible en todas.
const TABS = [
  { id: 'practice', label: 'Practicar' },
  { id: 'grammar', label: 'Gramática' },
  { id: 'write', label: 'Escribir' },
  { id: 'list', label: 'Palabras' },
];

// Pestaña "Escribir": frases rápidas (traducción + análisis) y cuaderno (escritura libre).
const WRITE_SECTIONS = [
  { id: 'notebook', label: 'Cuaderno' },
  { id: 'phrases', label: 'Frases rápidas' },
];

// Tipos de práctica: repaso de hoy (SM-2), práctica libre y escritura (estas dos no reprograman).
const KINDS = [
  { id: 'due', label: 'Repaso de hoy', short: 'Hoy' },
  { id: 'free', label: 'Práctica libre', short: 'Libre' },
  { id: 'write', label: 'Escritura', short: 'Escritura' },
];

function PracticeSettings({ settings, onChange, kind, onKind, dueCount, writeWords, onClearWriteWords }) {
  const update = (patch) => (e) => {
    onChange({ ...settings, ...patch(e.target.type === 'checkbox' ? e.target.checked : e.target.value) });
    e.target.blur(); // que Espacio/Enter vuelvan a ser atajos de la práctica
  };
  const select = (label, value, onPick, options) => html`
    <label>
      <span>${label}</span>
      <select value=${value} onChange=${update(onPick)}>
        ${options.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
      </select>
    </label>
  `;
  const orderOptions = FREE_ORDERS.map((o) => ({ value: o.id, label: o.label }));

  return html`
    <div className="segmented" role="tablist" aria-label="Tipo de práctica">
      ${KINDS.map(
        (k) => html`
          <button key=${k.id} role="tab" aria-selected=${kind === k.id} className=${kind === k.id ? 'active' : ''} onClick=${() => onKind(k.id)}>
            <span className="label-long">${k.label}</span><span className="label-short">${k.short}</span>${k.id === 'due' && dueCount > 0
              ? ` (${dueCount})`
              : ''}
          </button>
        `,
      )}
    </div>

    ${kind === 'write'
      ? html`
          <div className="practice-settings">
            ${writeWords
              ? html`<span className="chosen-words">
                  Practicando: <strong>${writeWords}</strong>
                  <button className="btn small" onClick=${onClearWriteWords}>Elegir otras</button>
                </span>`
              : html`
                  ${select('Palabras', settings.writeOrder, (v) => ({ writeOrder: v }), orderOptions)}
                  ${select('Cuántas', settings.writeWords, (v) => ({ writeWords: Number(v) }),
                    WRITE_WORD_COUNTS.map((n) => ({ value: n, label: n })))}
                `}
            ${select('Repeticiones', settings.writeReps, (v) => ({ writeReps: Number(v) }),
              WRITE_REPS.map((n) => ({ value: n, label: `${n} veces` })))}
            <label className="switch">
              <input type="checkbox" checked=${settings.writeAudio} onChange=${update((v) => ({ writeAudio: v }))} />
              Leer en voz alta
            </label>
          </div>
          <p className="free-note muted">Cada palabra se escribe varias veces con cada vez menos ayuda y al final hay un dictado. No cambia tus fechas de repaso.</p>
        `
      : html`
          <div className="practice-settings">
            ${select('Modo', settings.mode, (v) => ({ mode: v }), MODES.map((m) => ({ value: m.id, label: m.label })))}
            ${kind === 'free'
              ? html`
                  ${select('Palabras', settings.freeOrder, (v) => ({ freeOrder: v }), orderOptions)}
                  ${select('Cuántas', settings.freeSize, (v) => ({ freeSize: Number(v) }),
                    FREE_SIZES.map((n) => ({ value: n, label: n === 0 ? 'Todas' : n })))}
                `
              : select('Nuevas al día', settings.newPerDay, (v) => ({ newPerDay: Number(v) }),
                  NEW_PER_DAY_OPTIONS.map((n) => ({ value: n, label: n })))}
          </div>
          ${kind === 'free' &&
          html`<p className="free-note muted">Practica tanto como quieras: la práctica libre no cambia tus fechas de repaso.</p>`}
        `}
  `;
}

// "Añadir palabra" en una ventana sobre cualquier pantalla (botón flotante ＋).
function AddWordModal({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.body.classList.add('modal-open'); // la práctica ignora sus atajos de teclado mientras tanto
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return html`
    <div className="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Añadir palabra">
        <button className="icon-btn modal-close" onClick=${onClose} aria-label="Cerrar">✕</button>
        ${children}
      </div>
    </div>
  `;
}

export function App({ db }) {
  const [tab, setTab] = useState('practice');
  const [writeSection, setWriteSection] = useState('notebook');
  const [addOpen, setAddOpen] = useState(false);
  // Navegación dentro de Gramática: { page: home|unit|cheat|review|due, unitId? }.
  const [grammarNav, setGrammarNav] = useState({ page: 'home' });
  // Se incrementa tras cada escritura para refrescar contadores y listados.
  const [version, setVersion] = useState(0);
  const onChange = () => setVersion((v) => v + 1);

  // Ir a una pestaña; "add" abre la ventana de añadir palabra.
  const goTo = (target) => (target === 'add' ? setAddOpen(true) : setTab(target));

  function openGrammar(nav) {
    setGrammarNav({ ...nav, key: Date.now() });
    setTab('grammar');
    window.scrollTo(0, 0);
  }
  const openUnit = (unitId) => openGrammar({ page: 'unit', unitId });

  // Tipo de práctica y palabras concretas para la escritura (null = según los ajustes).
  // `round` fuerza una sesión nueva.
  const [kind, setKind] = useState('due');
  const [writeIds, setWriteIds] = useState(null);
  const [round, setRound] = useState(0);
  function startPractice(nextKind, ids = null) {
    setKind(nextKind);
    setWriteIds(ids);
    setRound((r) => r + 1);
    setTab('practice');
  }

  const [settings, setSettings] = useState(loadSettings);
  function changeSettings(next) {
    setSettings(next);
    saveSettings(next);
  }

  // Al abrir la app: completar las frases que quedaron a medias o fallaron (p. ej. sin conexión).
  useEffect(() => {
    db.retryFailedPhrases().then(() => processPending(db, onChange));
  }, [db]);

  const dueCount = db.countDue(todayISO(), settings.newPerDay);
  const grammarDue = db.grammarDue(todayISO()).length;
  const writeWordsLabel = writeIds ? db.wordsByIds(writeIds).map((w) => w.word_en).join(', ') : null;
  const badges = { practice: dueCount, grammar: grammarDue };

  return html`
    <header className="topbar">
      <div className="brand-row">
        <h1 className="brand">English <span>SRS</span></h1>
        <${InstallButton} />
      </div>
      <nav className="tabs" role="tablist">
        ${TABS.map(
          (t) => html`
            <button
              key=${t.id}
              role="tab"
              aria-selected=${tab === t.id}
              className=${'tab' + (tab === t.id ? ' active' : '')}
              onClick=${() => setTab(t.id)}
            >
              ${t.label}
              ${badges[t.id] > 0 && html`<span className="badge">${badges[t.id]}</span>`}
            </button>
          `,
        )}
      </nav>
    </header>

    <main className="page">
      <${IOSInstallHint} />
      ${tab === 'practice' &&
      html`
        <${PracticeSettings}
          settings=${settings}
          onChange=${changeSettings}
          kind=${kind}
          onKind=${(k) => startPractice(k)}
          dueCount=${dueCount}
          writeWords=${writeWordsLabel}
          onClearWriteWords=${() => startPractice('write')}
        />
        ${kind === 'write'
          ? html`<${WritingPractice}
              key=${[round, settings.writeOrder, settings.writeWords, settings.writeReps].join('/')}
              db=${db}
              settings=${settings}
              wordIds=${writeIds}
              onRestart=${(ids) => startPractice('write', ids)}
              goTo=${goTo}
            />`
          : html`<${Practice}
              key=${[kind, round, settings.mode, settings.newPerDay, settings.freeOrder, settings.freeSize].join('/')}
              db=${db}
              onChange=${onChange}
              goTo=${goTo}
              settings=${settings}
              free=${kind === 'free'}
              dueCount=${dueCount}
              grammarDue=${grammarDue}
              onGrammarReview=${() => openGrammar({ page: 'due' })}
              onStartFree=${() => startPractice('free')}
              onNewRound=${() => startPractice('free')}
              onBackToDue=${() => startPractice('due')}
            />`}
      `}
      ${tab === 'grammar' &&
      html`<${Grammar} db=${db} version=${version} nav=${grammarNav} onNavigate=${openGrammar} onChange=${onChange} />`}
      ${tab === 'write' &&
      html`
        <div className="segmented" role="tablist" aria-label="Tipo de escritura">
          ${WRITE_SECTIONS.map(
            (s) => html`
              <button
                key=${s.id}
                role="tab"
                aria-selected=${writeSection === s.id}
                className=${writeSection === s.id ? 'active' : ''}
                onClick=${() => setWriteSection(s.id)}
              >
                ${s.label}
              </button>
            `,
          )}
        </div>
        ${writeSection === 'notebook'
          ? html`<${Notebook} db=${db} onChange=${onChange} version=${version} onOpenUnit=${openUnit} />`
          : html`<${Phrases} db=${db} onChange=${onChange} version=${version} onOpenUnit=${openUnit} />`}
      `}
      ${tab === 'list' &&
      html`<${WordList} db=${db} onChange=${onChange} version=${version} onWrite=${(id) => startPractice('write', [id])} />`}
    </main>

    ${!addOpen &&
    html`<button className="fab" onClick=${() => setAddOpen(true)} title="Añadir palabra" aria-label="Añadir palabra">＋</button>`}
    ${addOpen &&
    html`
      <${AddWordModal} onClose=${() => setAddOpen(false)}>
        <${AddWord} db=${db} onChange=${onChange} version=${version} settings=${settings} onSettings=${changeSettings} />
      <//>
    `}
  `;
}
