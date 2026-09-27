// Cuaderno de escritura libre: notas con guardado automático, temas tipo B2 First,
// palabras de tu vocabulario para usar, "¿Cómo se dice…?" y "Revisar texto".

import { useEffect, useMemo, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { todayISO } from '../lib/dates.js';
import { WRITING_PROMPTS, PROMPT_BY_ID } from '../lib/writingPrompts.js';
import { countWords, reviewText, usesWord } from '../lib/textReview.js';
import { translate, translateWord } from '../lib/translate.js';
import { SpeakButton } from './WordTools.js';
import { UnitLink } from './UnitLink.js';
import { UNIT_BY_ID } from '../lib/grammar.js';

const SAVE_DELAY_MS = 600;
const SUGGESTED_WORDS = 5;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TITLE_MAX = 60;

// Título y resumen para la lista. Título: el tuyo, el del tema o la primera frase del texto
// (cortada entre palabras); el resumen no repite lo que ya sale como título.
function noteHeading(note) {
  const body = note.body.trim();
  const title = note.title.trim() || PROMPT_BY_ID[note.prompt_id]?.title;
  if (title) return { title, snippet: body.slice(0, 140) || 'Nota vacía' };
  if (!body) return { title: 'Sin título', snippet: 'Nota vacía' };

  const first = body.match(/^[^.!?\n]+[.!?]?/)[0].trim();
  if (first.length <= TITLE_MAX) return { title: first, snippet: body.slice(first.length).trim().slice(0, 140) };
  const cut = first.slice(0, TITLE_MAX);
  return { title: cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : TITLE_MAX) + '…', snippet: '' };
}

// ---------- Lista de notas ----------

function NoteList({ db, version, onOpen }) {
  const notes = useMemo(() => db.listNotes(), [db, version]);
  const [query, setQuery] = useState('');

  async function create(promptId = null) {
    const wordIds = db.freePracticeWords('hard', SUGGESTED_WORDS).map((w) => w.id);
    onOpen(await db.createNote({ promptId, wordIds }));
  }

  const q = query.trim().toLowerCase();
  const visible = q ? notes.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q)) : notes;

  return html`
    <section className="card">
      <div className="form-head">
        <h2>Cuaderno</h2>
      </div>
      <p className="muted notebook-intro">
        Escribe en inglés lo que quieras: un diario, ideas, textos de práctica… Se guarda solo mientras escribes.
      </p>
      <div className="empty-actions left">
        <button className="btn primary" onClick=${() => create()}>＋ Nota en blanco</button>
        <button
          className="btn"
          onClick=${() => create(WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)].id)}
        >
          🎲 Tema al azar
        </button>
      </div>

      <details className="prompts">
        <summary>Elegir un tema (del diario a tareas del B2 First)</summary>
        <div className="prompt-grid">
          ${WRITING_PROMPTS.map(
            (p) => html`
              <button key=${p.id} className="prompt-card" onClick=${() => create(p.id)}>
                <span className="prompt-meta"><span className="tag level">${p.level}</span> ${p.type}</span>
                <strong>${p.title}</strong>
                <span className="muted">${p.words[0]}–${p.words[1]} palabras</span>
              </button>
            `,
          )}
        </div>
      </details>
    </section>

    ${notes.length > 0 &&
    html`
      <section className="phrases">
        <div className="list-head">
          <input
            className="search"
            type="search"
            value=${query}
            onChange=${(e) => setQuery(e.target.value)}
            placeholder="Buscar en el cuaderno…"
          />
          <span className="muted">${visible.length} de ${notes.length}</span>
        </div>
        <ul className="word-list">
          ${visible.map((n) => {
            const prompt = PROMPT_BY_ID[n.prompt_id];
            const words = countWords(n.body);
            const { title, snippet } = noteHeading(n);
            return html`
              <li key=${n.id} className="note-item" onClick=${() => onOpen(n.id)}>
                <div className="phrase-main">
                  <strong>${title}</strong>
                  ${snippet && html`<div className="note-snippet muted">${snippet}</div>`}
                  <div className="meta">
                    ${prompt && html`<span className="tag level">${prompt.level}</span><span className="tag">${prompt.type}</span>`}
                    <span className="tag">${words} ${words === 1 ? 'palabra' : 'palabras'}</span>
                    <span className="review">${formatDate(n.updated_at)}</span>
                  </div>
                </div>
              </li>
            `;
          })}
        </ul>
      </section>
    `}
  `;
}

// ---------- "¿Cómo se dice…?" ----------

function HowToSay({ db, onInsert, onChange }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // { es, best, alternatives } | { error }
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(null);

  async function lookUp(e) {
    e.preventDefault();
    const es = query.trim();
    if (!es || loading) return;
    setLoading(true);
    setSaved(null);
    try {
      // Palabras sueltas: varias candidatas; frases: traducción completa.
      if (countWords(es) <= 3) {
        const r = await translateWord(es, 'es', 'en');
        // Palabras iguales en los dos idiomas ("hospital") se descartan como candidatas: traducción directa.
        setResult(r.best ? { es, ...r } : { es, best: await translate(es, 'es', 'en'), alternatives: [] });
      } else {
        setResult({ es, best: await translate(es, 'es', 'en'), alternatives: [] });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function saveWord(en) {
    await db.addWord({ word_en: en, translation_es: result.es }, todayISO());
    setSaved(en);
    onChange();
  }

  const options = result?.best ? [result.best, ...result.alternatives] : [];

  return html`
    <div className="tool-panel">
      <form className="howto-form" onSubmit=${lookUp}>
        <input
          value=${query}
          onChange=${(e) => setQuery(e.target.value)}
          placeholder="Escribe en español… (p. ej. «tener ganas de»)"
          aria-label="Texto en español para traducir"
          autoFocus
        />
        <button className="btn small primary" type="submit" disabled=${loading || !query.trim()}>
          ${loading ? 'Buscando…' : 'Traducir'}
        </button>
      </form>
      ${result?.error && html`<p className="msg error">${result.error}</p>`}
      ${options.map(
        (en) => html`
          <div key=${en} className="howto-result">
            <strong>${en}</strong>
            <${SpeakButton} text=${en} />
            <span className="howto-actions">
              <button className="btn small" onClick=${() => onInsert(en)}>Insertar en el texto</button>
              <button className="btn small" disabled=${saved === en} onClick=${() => saveWord(en)}>
                ${saved === en ? '✓ Guardada' : 'Guardar en mis palabras'}
              </button>
            </span>
          </div>
        `,
      )}
      ${options.length > 0 && html`<p className="footnote left">Traductor automático: revisa que encaje en tu frase.</p>`}
    </div>
  `;
}

// ---------- Revisión ----------

function Review({ review, level, onOpenUnit }) {
  const { levelCounts } = review;
  return html`
    <div className="tool-panel review-panel">
      <div className="review-stats">
        <span><strong>${review.words}</strong> palabras</span>
        <span><strong>${review.sentences}</strong> frases</span>
        <span><strong>${review.avgSentence}</strong> palabras por frase</span>
        <span><strong>${review.variety}%</strong> palabras distintas</span>
      </div>

      <h4>Estructuras del temario que has usado</h4>
      <p className="level-counts">
        ${['C1', 'B2', 'B1', 'A2', 'A1'].map(
          (l) => html`<span key=${l}><span className="tag level">${l}</span> ${levelCounts[l]}</span>`,
        )}
      </p>
      ${review.structures.length > 0
        ? html`<ul className="analysis-list">
            ${review.structures.map(
              (s, i) => html`<li key=${i}>
                <span className="tag level">${s.level}</span> <strong>${s.name}</strong>
                <span className="evidence">«${s.evidence}»</span>
                <${UnitLink} structure=${s} onOpenUnit=${onOpenUnit} />
              </li>`,
            )}
          </ul>`
        : html`<p className="muted">Todavía no detecto ninguna estructura del temario.</p>`}
      ${level === 'B2' &&
      levelCounts.B2 + levelCounts.C1 < 2 &&
      html`<p className="tip">💡 Para un texto de nivel B2, intenta usar al menos 2 estructuras B2 o C1: tercer
        condicional, <em>wish</em>, modales de deducción, relativas con coma, inversión…</p>`}

      <h4>Conectores</h4>
      ${review.connectors.length > 0
        ? html`<p>${review.connectors.map((c) => html`<span key=${c} className="tag ok">${c}</span> `)}</p>`
        : html`<p className="muted">No has usado conectores de nivel B1/B2.</p>`}
      ${review.missingGroups.length > 0 &&
      html`<ul className="analysis-list">
        ${review.missingGroups.map(
          (g) => html`<li key=${g.label}><span className="muted">${g.label}:</span> prueba <em>${g.examples.join(', ')}</em></li>`,
        )}
      </ul>`}

      ${review.repeated.length > 0 &&
      html`
        <h4>Palabras que repites</h4>
        <p>${review.repeated.map((r) => html`<span key=${r.word} className="tag">${r.word} ×${r.count}</span> `)}</p>
      `}

      ${review.upgrades.length > 0 &&
      html`
        <h4>Palabras muy básicas: alternativas más ricas</h4>
        <ul className="analysis-list">
          ${review.upgrades.map(
            (u) => html`<li key=${u.word}><strong>${u.word}</strong> ×${u.count} → <span className="muted">${u.alt}</span></li>`,
          )}
        </ul>
      `}

      <p className="footnote left">
        Revisión automática sin IA: cuenta y detecta estructuras, pero no corrige la gramática. Las faltas de
        ortografía las subraya el propio navegador.
      </p>
    </div>
  `;
}

// ---------- Editor ----------

function NoteEditor({ db, noteId, onBack, onChange, onOpenUnit }) {
  const [note] = useState(() => db.getNote(noteId));
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [saveState, setSaveState] = useState('saved'); // saved | pending | saving
  const [wordIds, setWordIds] = useState(() => {
    try {
      return JSON.parse(note?.word_ids || '[]');
    } catch {
      return [];
    }
  });
  const [panel, setPanel] = useState(null); // null | 'howto' | 'review'
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const textarea = useRef(null);
  const caret = useRef(0);
  const latest = useRef({ title, body });
  const dirty = useRef(false);

  const prompt = PROMPT_BY_ID[note?.prompt_id];
  const suggested = useMemo(() => db.wordsByIds(wordIds), [db, wordIds]);
  const words = countWords(body);

  async function saveNow() {
    if (!dirty.current) return;
    dirty.current = false;
    setSaveState('saving');
    await db.updateNote(noteId, latest.current);
    setSaveState(dirty.current ? 'pending' : 'saved');
    onChange();
  }

  // Guardado automático: al dejar de escribir un momento, al salir y al cerrar la ventana.
  useEffect(() => {
    latest.current = { title, body };
    if (!dirty.current) return;
    setSaveState('pending');
    const t = setTimeout(saveNow, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [title, body]);

  useEffect(() => {
    const flushOnHide = () => document.visibilityState === 'hidden' && saveNow();
    document.addEventListener('visibilitychange', flushOnHide);
    window.addEventListener('pagehide', saveNow);
    return () => {
      document.removeEventListener('visibilitychange', flushOnHide);
      window.removeEventListener('pagehide', saveNow);
      saveNow();
    };
  }, []);

  if (!note) {
    return html`<div className="card empty"><p>Esta nota ya no existe.</p><button className="btn" onClick=${onBack}>Volver</button></div>`;
  }

  function edit(setter) {
    return (e) => {
      dirty.current = true;
      setter(e.target.value);
    };
  }

  function rememberCaret() {
    if (textarea.current) caret.current = textarea.current.selectionStart;
  }

  // Inserta texto donde estaba el cursor (con espacios alrededor si hace falta).
  function insert(text) {
    const at = Math.min(caret.current ?? body.length, body.length);
    const before = body.slice(0, at);
    const after = body.slice(at);
    // Al principio del texto o tras . ! ? → empieza en mayúscula.
    const startsSentence = /(^|[.!?]\s*|\n\s*)$/.test(before);
    const word = startsSentence ? text.charAt(0).toUpperCase() + text.slice(1) : text;
    const piece = (before && !/\s$/.test(before) ? ' ' : '') + word + (after && !/^\s/.test(after) ? ' ' : '');
    dirty.current = true;
    setBody(before + piece + after);
    caret.current = at + piece.length;
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(caret.current, caret.current);
    });
  }

  async function runReview() {
    setPanel('review');
    setReviewing(true);
    try {
      setReview(await reviewText(body));
    } finally {
      setReviewing(false);
    }
  }

  function refreshWords() {
    const ids = db.freePracticeWords('random', SUGGESTED_WORDS).map((w) => w.id);
    setWordIds(ids);
    db.updateNote(noteId, { word_ids: JSON.stringify(ids) });
  }

  function download() {
    const name = (title.trim() || `nota-${todayISO()}`).replace(/[\\/:*?"<>|]+/g, '').slice(0, 60);
    const blob = new Blob([`${title.trim() ? title.trim() + '\n\n' : ''}${body}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function remove() {
    if (!confirm('¿Borrar esta nota? No se puede deshacer.')) return;
    dirty.current = false;
    await db.deleteNote(noteId);
    onChange();
    onBack();
  }

  const [min, max] = prompt?.words ?? [0, 0];
  const targetState = !prompt ? '' : words < min ? 'under' : words > max ? 'over' : 'ok';
  const saveLabel = { saved: 'Guardado ✓', pending: 'Sin guardar…', saving: 'Guardando…' }[saveState];

  return html`
    <section className="note-editor">
      <div className="editor-bar">
        <button className="btn small" onClick=${onBack}>← Cuaderno</button>
        <span className=${'save-state ' + saveState}>${saveLabel}</span>
        <span className="editor-bar-actions">
          <button className="btn small" onClick=${download} title="Descargar como archivo de texto">⬇ .txt</button>
          <button className="icon-btn" onClick=${remove} title="Borrar nota" aria-label="Borrar nota">🗑</button>
        </span>
      </div>

      ${prompt &&
      html`
        <div className="card prompt-box">
          <div className="meta"><span className="tag level">${prompt.level}</span><span className="tag">${prompt.type}</span></div>
          <p className="prompt-task">${prompt.task}</p>
          <p className="muted prompt-tips">💡 ${prompt.tips}</p>
          ${prompt.units?.length > 0 &&
          html`<p className="prompt-units">
            <span className="muted">Repasa antes:</span>
            ${prompt.units.map((id) => html`<${UnitLink} key=${id} unitId=${id} onOpenUnit=${onOpenUnit} label=${UNIT_BY_ID[id]?.t + ' →'} />`)}
          </p>`}
        </div>
      `}

      ${suggested.length > 0 &&
      html`
        <div className="use-words">
          <span className="muted">Intenta usar:</span>
          ${suggested.map((w) => {
            const used = usesWord(body, w.word_en);
            return html`<span key=${w.id} className=${'chip small' + (used ? ' selected' : '')} title=${w.translation_es}>
              ${used ? '✓ ' : ''}${w.word_en}
            </span>`;
          })}
          <button className="link-btn" onClick=${refreshWords}>cambiar</button>
        </div>
      `}

      <div className="card editor-card">
        <input
          className="note-title"
          value=${title}
          onChange=${edit(setTitle)}
          placeholder=${prompt ? prompt.title : 'Título'}
          aria-label="Título de la nota"
        />
        <textarea
          ref=${textarea}
          className="note-body"
          lang="en"
          spellCheck="true"
          value=${body}
          onChange=${(e) => {
            edit(setBody)(e);
            caret.current = e.target.selectionStart;
          }}
          onSelect=${rememberCaret}
          onClick=${rememberCaret}
          onKeyUp=${rememberCaret}
          placeholder=${prompt ? 'Start writing in English…' : 'Write anything in English: your day, your ideas, a story…'}
          aria-label="Texto de la nota"
          autoFocus
        ></textarea>

        <div className="editor-footer">
          <span className=${'word-count ' + targetState}>
            ${words} ${words === 1 ? 'palabra' : 'palabras'}${prompt ? ` · objetivo ${min}–${max}` : ''}
            ${targetState === 'over' && ' (te pasas)'}
          </span>
          ${prompt &&
          html`<div className="target-bar"><div className=${'target-fill ' + targetState} style=${{ width: `${Math.min(100, (words / max) * 100)}%` }}></div></div>`}
        </div>
      </div>

      <div className="editor-tools">
        <button className=${'btn small' + (panel === 'howto' ? ' active-tool' : '')} onClick=${() => setPanel(panel === 'howto' ? null : 'howto')}>
          🔎 ¿Cómo se dice…?
        </button>
        <button className=${'btn small' + (panel === 'review' ? ' active-tool' : '')} onClick=${runReview} disabled=${!body.trim() || reviewing}>
          ${reviewing ? 'Revisando…' : panel === 'review' ? '↻ Revisar otra vez' : '✅ Revisar texto'}
        </button>
      </div>

      ${panel === 'howto' && html`<${HowToSay} db=${db} onInsert=${insert} onChange=${onChange} />`}
      ${panel === 'review' && review && html`<${Review} review=${review} level=${prompt?.level} onOpenUnit=${onOpenUnit} />`}
    </section>
  `;
}

// ---------- Pantalla ----------

export function Notebook({ db, onChange, version, onOpenUnit }) {
  const [openId, setOpenId] = useState(null);
  if (openId !== null) {
    return html`<${NoteEditor} key=${openId} db=${db} noteId=${openId} onBack=${() => setOpenId(null)} onChange=${onChange} onOpenUnit=${onOpenUnit} />`;
  }
  return html`<${NoteList} db=${db} version=${version} onOpen=${setOpenId} />`;
}
