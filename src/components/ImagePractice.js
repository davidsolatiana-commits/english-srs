import { useEffect, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { speak } from '../lib/speech.js';
import { checkAnswer, hintMask } from '../lib/answers.js';
import { shuffle } from '../lib/modes.js';
import { DictLink, SpeakButton } from './WordTools.js';
import { WordImage } from './PracticeCards.js';

// Práctica con imágenes (no cambia las fechas de repaso):
//   learn → la imagen y debajo la palabra, para ir asociándolas
//   guess → solo la imagen: escribes la palabra en inglés
// Las palabras salen del filtro 🎯 (o de las elegidas a mano), solo las que tienen imagen.

function Example({ word }) {
  if (!word.example_sentence) return null;
  return html`<div className="example">
    ${word.example_sentence} <${SpeakButton} text=${word.example_sentence} />
    ${word.example_es && html`<div className="example-es">${word.example_es}</div>`}
  </div>`;
}

const typingInField = (e) => e.target.matches?.('input:not([readonly]), textarea, select');

// ---------- Aprender: imagen + palabra ----------

function Learn({ words, settings, onGuess, onRestart }) {
  const [pos, setPos] = useState(0);
  const word = words[pos];

  useEffect(() => {
    if (word && settings.writeAudio) speak(word.word_en);
  }, [pos]);

  useEffect(() => {
    function onKey(e) {
      if (typingInField(e) || document.body.classList.contains('modal-open')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setPos((p) => Math.min(p + 1, words.length));
      } else if (e.key === 'ArrowLeft') setPos((p) => Math.max(p - 1, 0));
      else if ((e.key === 'p' || e.key === 'P') && word) speak(word.word_en);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!word) {
    return html`
      <div className="card empty">
        <h2>Has visto ${words.length} palabras</h2>
        <p className="muted">Ahora comprueba si las recuerdas solo con la imagen.</p>
        <div className="empty-actions">
          <button className="btn primary" onClick=${onGuess}>✍️ Adivinar estas palabras</button>
          <button className="btn" onClick=${() => setPos(0)}>Verlas otra vez</button>
          <button className="btn" onClick=${onRestart}>Otras palabras</button>
        </div>
      </div>
    `;
  }

  return html`
    <section className="practice">
      <div className="progress"><div className="progress-bar" style=${{ width: `${(pos / words.length) * 100}%` }}></div></div>
      <p className="muted progress-text"><strong>Aprender con imágenes</strong> · ${pos + 1} / ${words.length}</p>
      <div className="card flashcard image-card">
        <${WordImage} key=${word.id} word=${word} className="big-image" />
        <div className="front">
          ${word.word_en}
          <${SpeakButton} text=${word.word_en} className="speak-lg" />
        </div>
        <div className="translation">${word.translation_es}</div>
        <${Example} word=${word} />
        <div className="word-tools"><${DictLink} word=${word.word_en} /></div>
      </div>
      <div className="image-nav">
        <button className="btn" onClick=${() => setPos(pos - 1)} disabled=${pos === 0}>◀ Anterior</button>
        <button className="btn primary" onClick=${() => setPos(pos + 1)}>
          ${pos + 1 === words.length ? 'Terminar' : 'Siguiente ▶'}
        </button>
      </div>
      <p className="key-hint muted">Teclado: <kbd>→</kbd>/<kbd>Espacio</kbd> siguiente · <kbd>←</kbd> anterior · <kbd>P</kbd> escuchar</p>
    </section>
  `;
}

// ---------- Adivinar: imagen → escribir la palabra ----------

const FEEDBACK = {
  correct: { text: '¡Correcto!', tone: 'ok' },
  close: { text: 'Casi: revisa cómo se escribe.', tone: 'warn' },
  wrong: { text: 'No era esa.', tone: 'error' },
  skipped: { text: 'Esta era la palabra:', tone: 'error' },
};

function Guess({ words, settings, onRestart, onRetry }) {
  // Las que fallas vuelven una vez al final de la ronda.
  const [queue, setQueue] = useState(() => words.map((w) => ({ word: w, again: false })));
  const [pos, setPos] = useState(0);
  const [typed, setTyped] = useState('');
  const [hints, setHints] = useState(0); // 0 nada · 1 traducción · 2 letras
  const [result, setResult] = useState(null);
  const [firstTry, setFirstTry] = useState({}); // id → acertada a la primera
  const input = useRef(null);
  const item = queue[pos];
  const word = item?.word;

  useEffect(() => {
    input.current?.focus();
  }, [pos]);

  function check(e) {
    e?.preventDefault();
    if (result || !typed.trim()) return;
    finish(checkAnswer(typed, word.word_en));
  }

  function finish(outcome) {
    setResult(outcome);
    if (settings.writeAudio) speak(word.word_en);
    if (!item.again) setFirstTry((f) => ({ ...f, [word.id]: outcome === 'correct' && hints === 0 }));
    if (outcome !== 'correct' && !item.again) setQueue((q) => [...q, { word, again: true }]);
  }

  function next() {
    setPos(pos + 1);
    setTyped('');
    setHints(0);
    setResult(null);
  }

  useEffect(() => {
    function onKey(e) {
      if (document.body.classList.contains('modal-open')) return;
      if (result && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item) {
    const failed = words.filter((w) => !firstTry[w.id]);
    const ok = words.length - failed.length;
    return html`
      <div className="card empty writing-summary">
        <h2>Ronda terminada</h2>
        <p>${ok} de ${words.length} a la primera y sin pistas.${ok === words.length ? ' ¡Perfecto!' : ''}</p>
        ${failed.length > 0 &&
        html`<ul className="summary-list">
          ${failed.map(
            (w) => html`<li key=${w.id}>
              <span className="summary-mark bad">✗</span>
              <strong>${w.word_en}</strong> <${SpeakButton} text=${w.word_en} />
              <span className="muted">${w.translation_es}</span>
            </li>`,
          )}
        </ul>`}
        <p className="muted">Esta práctica no cambia tus fechas de repaso.</p>
        <div className="empty-actions">
          ${failed.length > 0 &&
          html`<button className="btn primary" onClick=${() => onRetry(failed.map((w) => w.id))}>Repetir las falladas (${failed.length})</button>`}
          <button className=${'btn' + (failed.length ? '' : ' primary')} onClick=${onRestart}>Otra ronda</button>
        </div>
      </div>
    `;
  }

  const done = Object.keys(firstTry).length;
  const feedback = result && FEEDBACK[result];
  return html`
    <section className="practice">
      <div className="progress"><div className="progress-bar" style=${{ width: `${(done / words.length) * 100}%` }}></div></div>
      <p className="muted progress-text">
        <strong>Adivinar con imágenes</strong> · ${done} / ${words.length}
        ${item.again && html`<span className="tag again">repaso de fallo</span>`}
      </p>
      <form className="card flashcard image-card" onSubmit=${check}>
        <${WordImage} key=${word.id + ':' + pos} word=${word} className="big-image" />
        ${!result &&
        html`
          <p className="muted">¿Qué es en inglés?</p>
          ${hints >= 1 && html`<div className="hint-line">Pista: <strong>${word.translation_es}</strong></div>`}
          ${hints >= 2 && html`<div className="hint-mask">${hintMask(word.word_en)}</div>`}
        `}
        <input
          ref=${input}
          className=${'answer-input' + (result ? ' ' + (result === 'skipped' ? 'wrong' : result) : '')}
          value=${typed}
          onChange=${(e) => setTyped(e.target.value)}
          readOnly=${!!result}
          placeholder="Escribe la palabra en inglés…"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="La palabra en inglés"
        />
        ${!result
          ? html`
              <div className="write-actions">
                ${hints < 2 &&
                html`<button type="button" className="btn small" onClick=${() => {
                  setHints(hints + 1);
                  input.current?.focus();
                }}>
                  ${hints === 0 ? 'Pista: traducción' : 'Pista: letras'}
                </button>`}
                <button type="button" className="btn small" onClick=${() => finish('skipped')}>No lo sé</button>
                <button type="submit" className="btn primary" disabled=${!typed.trim()}>Comprobar <kbd>Enter</kbd></button>
              </div>
            `
          : html`
              <p className=${'feedback ' + feedback.tone}>${feedback.text}</p>
              <div className="back">
                <div className="front">${word.word_en} <${SpeakButton} text=${word.word_en} className="speak-lg" /></div>
                <div className="translation">${word.translation_es}</div>
                <${Example} word=${word} />
              </div>
              <button type="button" className="btn primary" onClick=${next}>Siguiente <kbd>Enter</kbd></button>
            `}
      </form>
    </section>
  `;
}

// ---------- Contenedor ----------

export function ImagePractice({ db, settings, wordIds, onModeChange, onRestart, onRetry, goTo }) {
  const [words] = useState(() => {
    if (wordIds?.length) return shuffle(db.wordsByIds(wordIds).filter((w) => w.image && w.translation_es));
    return shuffle(db.freePracticeWords(settings.imgOrder, settings.imgSize, { ...settings.study, withImage: true }));
  });

  if (words.length === 0) {
    return html`
      <div className="card empty">
        <h2>No hay palabras con imagen</h2>
        <p className="muted">
          ${db.countWords() === 0
            ? 'Añade palabras y búscales imagen.'
            : 'Ninguna palabra de tu selección o filtro (🎯) tiene imagen. Pon imágenes desde Palabras (ficha de la palabra) o en Grupos → ⋯ → «Imágenes y ejemplos para todo el grupo».'}
        </p>
        ${db.countWords() === 0 && html`<button className="btn primary" onClick=${() => goTo('add')}>Añadir palabras</button>`}
      </div>
    `;
  }

  return settings.imgMode === 'guess'
    ? html`<${Guess} words=${words} settings=${settings} onRestart=${onRestart} onRetry=${onRetry} />`
    : html`<${Learn}
        words=${words}
        settings=${settings}
        onGuess=${() => onModeChange('guess', words.map((w) => w.id))}
        onRestart=${onRestart}
      />`;
}
