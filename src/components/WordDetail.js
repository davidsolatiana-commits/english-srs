import { useEffect, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { translate } from '../lib/translate.js';
import { fetchExamples, searchImages, toStoredImage } from '../lib/media.js';
import { DictLink, SpeakButton } from './WordTools.js';

// ---------- Imagen ----------

function ImageSection({ db, word, onSaved }) {
  const [busy, setBusy] = useState(null); // texto de lo que se está haciendo
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(word.word_en);
  const [results, setResults] = useState(null); // null = sin buscar
  const fileInput = useRef(null);

  async function save(source, credit) {
    setBusy('Guardando imagen…');
    setError(null);
    try {
      await db.updateWord(word.id, { image: await toStoredImage(source), image_credit: credit });
      setResults(null);
      onSaved();
    } catch {
      setError('No se pudo leer esa imagen. Prueba con otra.');
    } finally {
      setBusy(null);
    }
  }

  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setBusy('Buscando imágenes…');
    setError(null);
    try {
      setResults(await searchImages(query, { category: query === word.word_en ? word.category : null }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    await db.updateWord(word.id, { image: null, image_credit: null });
    onSaved();
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) save(file, 'Imagen propia');
  }

  // En el PC: pegar una imagen copiada (Ctrl+V) con la ficha abierta.
  useEffect(() => {
    function onPaste(e) {
      if (e.target.matches?.('input, textarea')) return;
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
      if (item) {
        e.preventDefault();
        save(item.getAsFile(), 'Imagen propia');
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  return html`
    <section className="detail-section">
      <h3>Imagen</h3>
      <div className="detail-image-row">
        ${word.image
          ? html`<figure className="detail-image">
              <img src=${word.image} alt=${word.word_en} />
              ${word.image_credit && html`<figcaption className="muted">${word.image_credit}</figcaption>`}
            </figure>`
          : html`<div className="detail-image empty muted">Sin imagen</div>`}
        <div className="detail-image-actions">
          <button className="btn small primary" onClick=${search} disabled=${!!busy}>🔎 Buscar automáticamente</button>
          <button className="btn small" onClick=${() => fileInput.current?.click()} disabled=${!!busy}>
            📷 Subir una foto
          </button>
          ${word.image && html`<button className="btn small" onClick=${remove} disabled=${!!busy}>🗑 Quitar</button>`}
          <input ref=${fileInput} type="file" accept="image/*" hidden onChange=${onFile} />
          <span className="muted hint">En el PC también puedes pegarla con Ctrl+V.</span>
        </div>
      </div>
      ${busy && html`<p className="muted">${busy}</p>`}
      ${error && html`<p className="msg error">${error}</p>`}

      ${results &&
      html`
        <form className="image-search" onSubmit=${search}>
          <input
            className="search"
            value=${query}
            onChange=${(e) => setQuery(e.target.value)}
            placeholder="Buscar otra cosa (en inglés)…"
          />
          <button className="btn small" type="submit" disabled=${!!busy}>Buscar</button>
          <button className="btn small" type="button" onClick=${() => setResults(null)}>Cerrar</button>
        </form>
        <p className="muted hint">
          Pulsa la que mejor te ayude a recordar la palabra. Si no te convence ninguna, busca algo más concreto
          (p. ej. «${word.word_en} person» o una situación).
        </p>
        ${results.length === 0
          ? html`<p className="muted">No he encontrado imágenes. Prueba con otras palabras.</p>`
          : html`<div className="image-grid">
              ${results.map(
                (r) => html`<button
                  key=${r.thumb}
                  className="image-option"
                  title=${r.credit}
                  disabled=${!!busy}
                  onClick=${() => save(r.thumb, r.credit)}
                >
                  <img src=${r.thumb} alt="" loading="lazy" />
                </button>`,
              )}
            </div>`}
      `}
    </section>
  `;
}

// ---------- Ejemplos ----------

function ExampleRow({ en, es, children }) {
  return html`
    <li className="example-row">
      <div className="example-text">
        <div>${en} <${SpeakButton} text=${en} /></div>
        ${es && html`<div className="muted example-es">${es}</div>`}
      </div>
      <div className="example-actions">${children}</div>
    </li>
  `;
}

function ExamplesSection({ db, word, examples, onSaved }) {
  const [en, setEn] = useState('');
  const [es, setEs] = useState('');
  const [translating, setTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const saved = new Set([word.example_sentence, ...examples.map((x) => x.text_en)].filter(Boolean).map((s) => s.toLowerCase()));

  async function add(e) {
    e.preventDefault();
    if (!en.trim()) return;
    let text_es = es.trim();
    // Sin traducción escrita: intentar traducirla (si falla, se guarda sin ella).
    if (!text_es) {
      try {
        text_es = await translate(en.trim(), 'en', 'es');
      } catch {
        text_es = '';
      }
    }
    if (word.example_sentence) await db.addExample(word.id, { en: en.trim(), es: text_es, source: 'manual' });
    else await db.updateWord(word.id, { example_sentence: en.trim(), example_es: text_es });
    setEn('');
    setEs('');
    onSaved();
  }

  async function translateDraft() {
    if (!en.trim()) return;
    setTranslating(true);
    try {
      setEs(await translate(en.trim(), 'en', 'es'));
    } catch (err) {
      setError(err.message);
    } finally {
      setTranslating(false);
    }
  }

  async function findExamples() {
    setBusy(true);
    setError(null);
    try {
      setSuggestions(await fetchExamples(word.word_en, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addSuggestion(s) {
    if (word.example_sentence) await db.addExample(word.id, { en: s.en, es: s.es, source: 'auto' });
    else await db.updateWord(word.id, { example_sentence: s.en, example_es: s.es });
    onSaved();
  }

  async function removeMain() {
    if (!confirm('¿Quitar el ejemplo principal?')) return;
    await db.updateWord(word.id, { example_sentence: null, example_es: null });
    onSaved();
  }

  const pending = suggestions?.filter((s) => !saved.has(s.en.toLowerCase()));

  return html`
    <section className="detail-section">
      <h3>Ejemplos de uso</h3>
      ${!word.example_sentence && examples.length === 0 && html`<p className="muted">Todavía no tiene ejemplos.</p>`}
      <ul className="example-list">
        ${word.example_sentence &&
        html`<${ExampleRow} en=${word.example_sentence} es=${word.example_es}>
          <span className="tag level" title="Sale en la práctica y en «completar la frase»">★ principal</span>
          <button className="icon-btn" title="Quitar" aria-label="Quitar el ejemplo principal" onClick=${removeMain}>✕</button>
        <//>`}
        ${examples.map(
          (x) => html`<${ExampleRow} key=${x.id} en=${x.text_en} es=${x.text_es}>
            <button
              className="icon-btn"
              title="Usar como principal (sale en la práctica)"
              aria-label="Usar como ejemplo principal"
              onClick=${async () => {
                await db.makeMainExample(x.id);
                onSaved();
              }}
            >
              ☆
            </button>
            <button
              className="icon-btn"
              title="Borrar"
              aria-label="Borrar ejemplo"
              onClick=${async () => {
                await db.deleteExample(x.id);
                onSaved();
              }}
            >
              ✕
            </button>
          <//>`,
        )}
      </ul>

      <form className="example-form" onSubmit=${add}>
        <textarea
          rows="2"
          value=${en}
          onChange=${(e) => setEn(e.target.value)}
          placeholder=${`Escribe tu ejemplo con «${word.word_en}»…`}
        ></textarea>
        <div className="example-form-row">
          <input value=${es} onChange=${(e) => setEs(e.target.value)} placeholder="Traducción (opcional)" />
          <button type="button" className="btn small" onClick=${translateDraft} disabled=${!en.trim() || translating}>
            ${translating ? 'Traduciendo…' : 'Traducir'}
          </button>
          <button type="submit" className="btn small primary" disabled=${!en.trim()}>Añadir</button>
        </div>
      </form>

      <div className="example-auto">
        <button className="btn small" onClick=${findExamples} disabled=${busy}>
          ${busy ? 'Buscando…' : '✨ Buscar ejemplos reales'}
        </button>
        <span className="muted hint">Frases de Tatoeba con traducción hecha por personas.</span>
      </div>
      ${error && html`<p className="msg error">${error}</p>`}
      ${pending &&
      (pending.length === 0
        ? html`<p className="muted">No he encontrado más ejemplos.</p>`
        : html`<ul className="example-list suggestions">
            ${pending.map(
              (s) => html`<${ExampleRow} key=${s.en} en=${s.en} es=${s.es}>
                <button className="btn small" onClick=${() => addSuggestion(s)}>＋ Añadir</button>
              <//>`,
            )}
          </ul>`)}
    </section>
  `;
}

// ---------- Ficha ----------

export function WordDetail({ db, wordId, onClose, onChange }) {
  const [rev, setRev] = useState(0);
  const word = db.getWord(wordId);
  const examples = db.listExamples(wordId);
  const refresh = () => {
    setRev(rev + 1);
    onChange();
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!word) return null;

  return html`
    <div className="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal detail" role="dialog" aria-modal="true" aria-label=${`Ficha de ${word.word_en}`}>
        <button className="icon-btn modal-close" onClick=${onClose} aria-label="Cerrar">✕</button>
        <h2>${word.word_en} <${SpeakButton} text=${word.word_en} /></h2>
        <p className="detail-translation">${word.translation_es}</p>
        <div className="meta">
          <${DictLink} word=${word.word_en} />
          ${word.cefr_level && html`<span className="tag level">${word.cefr_level}</span>`}
          ${word.category && html`<span className="tag">${word.category}</span>`}
          ${word.source && html`<span className="tag source">${word.source}</span>`}
        </div>
        <${ImageSection} key=${'img' + rev} db=${db} word=${word} onSaved=${refresh} />
        <${ExamplesSection} db=${db} word=${word} examples=${examples} onSaved=${refresh} />
      </div>
    </div>
  `;
}
