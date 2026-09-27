import { useMemo, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { detectLang, processPending } from '../lib/phrases.js';
import { MAX_TRANSLATE_CHARS } from '../lib/translate.js';
import { SpeakButton } from './WordTools.js';
import { UnitLink } from './UnitLink.js';

const LANG_NAME = { en: 'inglés', es: 'español' };
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ---------- Análisis ----------

function PhraseAnalysis({ analysis, fromSpanish, onOpenUnit }) {
  return html`
    <div className="analysis">
      <p className="analysis-type"><span className="muted">Tipo de oración:</span> ${analysis.type}</p>

      <h4>Palabra a palabra</h4>
      <div className="tokens">
        ${analysis.tokens.map(
          (t, i) => html`
            <span key=${i} className=${'token pos-' + t.pos.replace(/\s+/g, '-')}>
              <span className="token-word">${t.text}</span>
              <span className="token-pos">${t.pos}</span>
            </span>
          `,
        )}
      </div>

      ${analysis.verbs.length > 0 &&
      html`
        <h4>Tiempos verbales</h4>
        <ul className="analysis-list">
          ${analysis.verbs.map((v, i) => html`<li key=${i}><strong>${v.text}</strong> → ${v.label}</li>`)}
        </ul>
      `}

      <h4>Estructuras del temario</h4>
      ${analysis.structures.length > 0
        ? html`
            <ul className="analysis-list">
              ${analysis.structures.map(
                (s, i) => html`
                  <li key=${i}>
                    ${s.level ? html`<span className="tag level">${s.level}</span>` : html`<span className="tag">extra</span>`}
                    ${' '}<strong>${s.name}</strong> <span className="evidence">«${s.evidence}»</span>
                    <${UnitLink} structure=${s} onOpenUnit=${onOpenUnit} />
                  </li>
                `,
              )}
            </ul>
          `
        : html`<p className="muted">No se ha detectado ninguna estructura del temario.</p>`}

      <p className="footnote">
        Análisis automático sin IA: es orientativo y puede fallar en frases complejas.
        ${fromSpanish && ' Se ha analizado la traducción al inglés.'}
      </p>
    </div>
  `;
}

// ---------- Una frase ----------

function PhraseItem({ phrase, db, onChange, onOpenUnit }) {
  const analysis = useMemo(() => (phrase.analysis_json ? JSON.parse(phrase.analysis_json) : null), [phrase.analysis_json]);
  const fromSpanish = phrase.original_lang === 'es';
  const levels = analysis ? [...new Set(analysis.structures.map((s) => s.level).filter(Boolean))] : [];
  const topLevel = LEVEL_ORDER.filter((l) => levels.includes(l)).pop();

  async function retry() {
    await db.updatePhrase(phrase.id, { status: 'pending', error: null });
    onChange();
    processPending(db, onChange);
  }

  async function remove() {
    if (!confirm('¿Borrar esta frase?')) return;
    await db.deletePhrase(phrase.id);
    onChange();
  }

  return html`
    <li className="phrase-item">
      <div className="phrase-main">
        <div className="phrase-en">
          ${phrase.text_en
            ? html`<strong>${phrase.text_en}</strong> <${SpeakButton} text=${phrase.text_en} />`
            : html`<span className="muted">${phrase.status === 'pending' ? 'Traduciendo al inglés…' : 'Sin traducción al inglés'}</span>`}
        </div>
        <div className="phrase-es">
          ${phrase.translation_es ??
          html`<span className="muted">${phrase.status === 'pending' ? 'Traduciendo…' : 'Sin traducción al español'}</span>`}
        </div>

        <div className="meta">
          <span className="tag">escrita en ${LANG_NAME[phrase.original_lang]}</span>
          ${topLevel && html`<span className="tag level">hasta ${topLevel}</span>`}
          ${phrase.status === 'pending' && html`<span className="status-pill pending">Analizando…</span>`}
          <span className="review">${formatDate(phrase.created_at)}</span>
        </div>

        ${phrase.status === 'error' &&
        html`
          <p className="msg error">
            ${phrase.error} <button className="btn small" onClick=${retry}>Reintentar</button>
          </p>
        `}

        ${analysis &&
        html`
          <details className="analysis-details">
            <summary>
              Análisis gramatical
              ${analysis.structures.length > 0 &&
              html`<span className="muted"> · ${analysis.structures.map((s) => s.name).slice(0, 3).join(', ')}${
                analysis.structures.length > 3 ? '…' : ''
              }</span>`}
            </summary>
            <${PhraseAnalysis} analysis=${analysis} fromSpanish=${fromSpanish} onOpenUnit=${onOpenUnit} />
          </details>
        `}
      </div>
      <button className="icon-btn" title="Borrar" aria-label="Borrar frase" onClick=${remove}>✕</button>
    </li>
  `;
}

// ---------- Pantalla ----------

export function Phrases({ db, onChange, version, onOpenUnit }) {
  const [text, setText] = useState('');
  const [langOverride, setLangOverride] = useState(null);
  const [query, setQuery] = useState('');
  const input = useRef(null);

  const phrases = useMemo(() => db.listPhrases(), [db, version]);
  const trimmed = text.trim();
  const lang = langOverride ?? (trimmed ? detectLang(trimmed) : null);

  async function save(e) {
    e?.preventDefault();
    if (!trimmed) return;
    setText('');
    setLangOverride(null);
    input.current?.focus();
    await db.addPhrase(trimmed, lang);
    onChange();
    processPending(db, onChange);
  }

  function onKeyDown(e) {
    // Enter guarda; Mayús+Enter hace salto de línea.
    if (e.key === 'Enter' && !e.shiftKey) save(e);
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? phrases.filter((p) =>
        [p.original_text, p.text_en, p.translation_es].some((s) => s && s.toLowerCase().includes(q)),
      )
    : phrases;

  return html`
    <form className="card form" onSubmit=${save}>
      <h2>Apuntar una frase</h2>
      <textarea
        ref=${input}
        className="phrase-input"
        rows="2"
        maxLength=${MAX_TRANSLATE_CHARS}
        value=${text}
        onChange=${(e) => setText(e.target.value)}
        onKeyDown=${onKeyDown}
        placeholder="Escribe una frase en inglés o en español…"
        autoFocus
      ></textarea>
      <div className="actions">
        <button className="btn primary" type="submit" disabled=${!trimmed}>Guardar y analizar</button>
        ${lang &&
        html`
          <button
            type="button"
            className="btn small"
            title="Cambiar el idioma si lo he detectado mal"
            onClick=${() => setLangOverride(lang === 'en' ? 'es' : 'en')}
          >
            Idioma: ${LANG_NAME[lang]} ⇄
          </button>
        `}
      </div>
      <p className="footnote left">
        Se guarda al momento y se traduce y analiza en segundo plano. La traducción usa el servicio gratuito
        MyMemory, así que la frase se envía a su servidor.
      </p>
    </form>

    ${phrases.length > 0 &&
    html`
      <section className="phrases">
        <div className="list-head">
          <input
            className="search"
            type="search"
            value=${query}
            onChange=${(e) => setQuery(e.target.value)}
            placeholder="Buscar frases…"
          />
          <span className="muted">${visible.length} de ${phrases.length}</span>
        </div>
        <ul className="word-list">
          ${visible.map((p) => html`<${PhraseItem} key=${p.id} phrase=${p} db=${db} onChange=${onChange} onOpenUnit=${onOpenUnit} />`)}
        </ul>
      </section>
    `}
  `;
}
