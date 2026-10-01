import { useEffect, useMemo, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { todayISO } from '../lib/dates.js';
import { CATEGORIES, CEFR_LEVELS } from '../lib/db.js';
import { translateWord } from '../lib/translate.js';
import { enrichWord } from '../lib/media.js';
import { groupOptions } from '../lib/groups.js';
import { DictLink, SpeakButton } from './WordTools.js';

const EMPTY = { word_en: '', translation_es: '', example_sentence: '', category: '', cefr_level: '' };
const TRANSLATE_DELAY_MS = 500;

// Debajo del campo "Español": estado de la traducción automática y otras opciones para elegir.
function TranslationStatus({ suggestion, current, manual, onPick }) {
  if (!suggestion) return null;
  if (suggestion.status === 'loading') return html`<span className="translate-status muted">Traduciendo…</span>`;
  if (suggestion.status === 'error') return html`<span className="translate-status error">${suggestion.error}</span>`;
  if (!suggestion.best) {
    return html`<span className="translate-status error">No he encontrado traducción: escríbela tú.</span>`;
  }
  const options = [suggestion.best, ...suggestion.alternatives].filter((t) => t.toLowerCase() !== current.toLowerCase());
  return html`
    <span className="translate-status">
      ${!manual && html`<span className="muted">Traducción automática, revísala. </span>`}
      ${options.length > 0 &&
      html`
        <span className="muted">${manual ? 'Sugerencias:' : 'Otras:'}</span>
        ${options.map(
          (t) => html`
            <button key=${t} type="button" className="chip small" tabIndex=${-1} onClick=${() => onPick(t)}>${t}</button>
          `,
        )}
      `}
    </span>
  `;
}

export function AddWord({ db, onChange, version, settings, onSettings }) {
  const auto = settings.autoTranslate;
  const [form, setForm] = useState(EMPTY);
  // La fuente se conserva entre palabras: normalmente añades varias del mismo vídeo.
  const [source, setSource] = useState('');
  // El grupo también se conserva entre palabras.
  const [group, setGroup] = useState('');
  const groups = useMemo(() => db.listGroups(), [db, version]);
  const [message, setMessage] = useState(null);
  // Traducción automática de la palabra actual: { word, status: 'loading'|'done'|'error', best, alternatives, error }
  const [suggestion, setSuggestion] = useState(null);
  const [translating, setTranslating] = useState(false);
  // true cuando la traducción la has escrito o elegido tú: entonces nunca se sobrescribe.
  const manualTranslation = useRef(false);
  const wordInput = useRef(null);
  const translationInput = useRef(null);

  const sources = useMemo(() => db.sources(), [db, version]);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const word = form.word_en.trim();

  // Traducir mientras escribes, al hacer una pausa.
  useEffect(() => {
    if (!auto || !word || manualTranslation.current) {
      setSuggestion(null);
      if (!word && !manualTranslation.current) setForm((f) => (f.translation_es ? { ...f, translation_es: '' } : f));
      return;
    }
    setSuggestion({ word, status: 'loading' });
    const timer = setTimeout(async () => {
      try {
        const r = await translateWord(word);
        setSuggestion((s) => (s?.word === word ? { word, status: 'done', ...r } : s));
        if (!manualTranslation.current) {
          setForm((f) => (f.word_en.trim() === word ? { ...f, translation_es: r.best ?? '' } : f));
        }
      } catch (err) {
        setSuggestion((s) => (s?.word === word ? { word, status: 'error', error: err.message } : s));
      }
    }, TRANSLATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [word, auto]);

  function onTranslationChange(e) {
    manualTranslation.current = e.target.value.trim() !== '';
    setForm({ ...form, translation_es: e.target.value });
  }

  function pickTranslation(t) {
    manualTranslation.current = true;
    setForm({ ...form, translation_es: t });
  }

  async function submit(e) {
    e.preventDefault();
    if (translating) return;
    const word_en = word;
    let translation_es = form.translation_es.trim();
    if (!word_en) {
      setMessage({ type: 'error', text: 'Escribe la palabra en inglés.' });
      return;
    }
    const autoTranslated = auto && !manualTranslation.current;
    const duplicate = db.findWord(word_en);
    if (duplicate) {
      setMessage({
        type: 'error',
        text: `Ya tienes «${duplicate.word_en}»${duplicate.translation_es ? ` (${duplicate.translation_es})` : ''}. Búscala en Palabras.`,
      });
      return;
    }

    // Enter antes de que llegue la traducción: se espera a ella.
    if (!translation_es) {
      if (!auto) {
        setMessage({ type: 'error', text: 'Escribe la traducción (o activa la traducción automática).' });
        translationInput.current?.focus();
        return;
      }
      setTranslating(true);
      let reason = '';
      try {
        translation_es = (await translateWord(word_en)).best ?? '';
      } catch (err) {
        reason = ` (${err.message.replace(/\.$/, '')})`;
      } finally {
        setTranslating(false);
      }
      if (!translation_es) {
        setMessage({ type: 'error', text: `No se pudo traducir «${word_en}» automáticamente${reason}. Escríbela tú.` });
        translationInput.current?.focus();
        return;
      }
    }

    // Vaciar el formulario antes de esperar al guardado, para no borrar
    // lo que ya estés escribiendo de la siguiente palabra.
    const submitted = form;
    setForm((f) => (f.word_en.trim() === word_en ? EMPTY : f));
    manualTranslation.current = false;
    setSuggestion(null);
    wordInput.current?.focus();
    try {
      const id = await db.addWord(
        {
          word_en,
          translation_es,
          example_sentence: submitted.example_sentence.trim(),
          category: submitted.category,
          cefr_level: submitted.cefr_level,
          source: source.trim(),
        },
        todayISO(),
      );
      if (group && groups.some((g) => String(g.id) === group)) await db.addToGroup([id], Number(group));
      setMessage({
        type: 'ok',
        text: `Añadida: «${word_en}» = «${translation_es}»${autoTranslated ? ' (traducción automática)' : ''}`,
      });
      // Imagen y ejemplos en segundo plano: no hace esperar para añadir la siguiente.
      if (settings.autoImage || settings.autoExamples) {
        enrichWord(db, db.getWord(id), { image: settings.autoImage, examples: settings.autoExamples })
          .catch((err) => console.warn('Imagen/ejemplos:', err.message))
          .finally(onChange);
      }
    } catch (err) {
      console.error(err);
      setForm(submitted);
      setMessage({ type: 'error', text: `No se pudo guardar: ${err.message}` });
    } finally {
      onChange();
    }
  }

  return html`
    <form className="card form" onSubmit=${submit}>
      <div className="form-head">
        <h2>Añadir palabra</h2>
        <label className="switch" title="Usa el traductor gratuito MyMemory: la palabra se envía a su servidor">
          <input
            type="checkbox"
            checked=${auto}
            onChange=${(e) => onSettings({ ...settings, autoTranslate: e.target.checked })}
          />
          Traducir automáticamente
        </label>
      </div>

      <div className="row">
        <label className="field">
          <span>Inglés <em>*</em></span>
          <input
            ref=${wordInput}
            value=${form.word_en}
            onChange=${set('word_en')}
            placeholder="e.g. give up"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            autoFocus
          />
          ${form.word_en.trim() &&
          html`
            <span className="word-tools">
              <${SpeakButton} text=${form.word_en.trim()} tabIndex=${-1} />
              <${DictLink} word=${form.word_en} label="Ver en Cambridge (nivel CEFR) ↗" tabIndex=${-1} />
            </span>
          `}
        </label>
        <label className="field">
          <span>Español ${auto ? html`<small className="muted">(automático, puedes cambiarlo)</small>` : html`<em>*</em>`}</span>
          <input
            ref=${translationInput}
            value=${form.translation_es}
            onChange=${onTranslationChange}
            placeholder=${auto ? 'Se traduce sola…' : 'rendirse'}
            autoComplete="off"
          />
          <${TranslationStatus}
            suggestion=${suggestion}
            current=${form.translation_es.trim()}
            manual=${manualTranslation.current}
            onPick=${pickTranslation}
          />
        </label>
      </div>

      <details className="optional">
        <summary>Más detalles (opcional)</summary>

        <label className="field">
          <span>Frase de ejemplo</span>
          <textarea
            rows="2"
            value=${form.example_sentence}
            onChange=${set('example_sentence')}
            placeholder="Don't give up, you're almost there."
          ></textarea>
        </label>

        <div className="field">
          <span>Categoría</span>
          <div className="chips">
            ${CATEGORIES.map(
              (c) => html`
                <button
                  type="button"
                  key=${c}
                  className=${'chip' + (form.category === c ? ' selected' : '')}
                  onClick=${() => setForm({ ...form, category: form.category === c ? '' : c })}
                >
                  ${c}
                </button>
              `,
            )}
          </div>
        </div>

        <div className="field">
          <span>Nivel CEFR</span>
          <div className="chips">
            ${CEFR_LEVELS.map(
              (l) => html`
                <button
                  type="button"
                  key=${l}
                  className=${'chip' + (form.cefr_level === l ? ' selected' : '')}
                  onClick=${() => setForm({ ...form, cefr_level: form.cefr_level === l ? '' : l })}
                >
                  ${l}
                </button>
              `,
            )}
          </div>
        </div>

        <label className="field">
          <span>Fuente</span>
          <input
            value=${source}
            onChange=${(e) => setSource(e.target.value)}
            list="sources"
            placeholder="Vídeo de YouTube, Duolingo, lectura…"
          />
          <datalist id="sources">${sources.map((s) => html`<option key=${s} value=${s} />`)}</datalist>
        </label>

        ${groups.length > 0 &&
        html`<label className="field">
          <span>Grupo</span>
          <select value=${group} onChange=${(e) => setGroup(e.target.value)}>
            <option value="">— Ninguno</option>
            ${groupOptions(groups).map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
          </select>
        </label>`}
      </details>

      <div className="actions">
        <button className="btn primary" type="submit" disabled=${translating}>
          ${translating ? 'Traduciendo…' : 'Añadir'}
        </button>
        ${message && html`<span className=${'msg ' + message.type} role="status">${message.text}</span>`}
      </div>
      <div className="auto-media">
        <span className="muted">Al añadir, buscar sola:</span>
        <label className="switch" title="Busca una imagen en Openverse/Wikipedia (la palabra se envía a esos servicios)">
          <input
            type="checkbox"
            checked=${settings.autoImage}
            onChange=${(e) => onSettings({ ...settings, autoImage: e.target.checked })}
          />
          una imagen
        </label>
        <label className="switch" title="Busca frases reales con traducción en Tatoeba">
          <input
            type="checkbox"
            checked=${settings.autoExamples}
            onChange=${(e) => onSettings({ ...settings, autoExamples: e.target.checked })}
          />
          ejemplos de uso
        </label>
        <span className="muted">· Puedes cambiarlos en Palabras, pulsando la palabra.</span>
      </div>
    </form>
  `;
}
