// Una tarjeta por modo de práctica. Todas reciben la palabra, el `result`
// (null hasta que respondes) y un callback para responder.

import { useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { hintMask } from '../lib/answers.js';
import { DictLink, SpeakButton } from './WordTools.js';

function Tags({ word, isNew }) {
  return html`
    <div className="meta">
      ${isNew && html`<span className="tag new">nueva</span>`}
      ${word.cefr_level && html`<span className="tag level">${word.cefr_level}</span>`}
      ${word.category && html`<span className="tag">${word.category}</span>`}
    </div>
  `;
}

function English({ word }) {
  return html`
    <div className="front">
      ${word.word_en}
      <${SpeakButton} text=${word.word_en} className="speak-lg" />
    </div>
  `;
}

function Example({ word }) {
  if (!word.example_sentence) return null;
  return html`<div className="example">${word.example_sentence} <${SpeakButton} text=${word.example_sentence} /></div>`;
}

// ---------- Tarjetas (te valoras tú) ----------

export function FlashCard({ word, mode, isNew, result, onReveal }) {
  const revealed = result !== null;
  const toSpanish = mode === 'flash-en';
  return html`
    <div className="card flashcard">
      <${Tags} word=${word} isNew=${isNew} />
      ${toSpanish ? html`<${English} word=${word} />` : html`<div className="front prompt-es">${word.translation_es}</div>`}

      ${revealed
        ? html`
            <div className="back">
              ${toSpanish
                ? html`<div className="translation">${word.translation_es}</div>`
                : html`<${English} word=${word} />`}
              <${Example} word=${word} />
              <div className="word-tools"><${DictLink} word=${word.word_en} /></div>
            </div>
          `
        : html`
            <button className="btn primary reveal" onClick=${onReveal}>
              Mostrar respuesta <kbd>Espacio</kbd>
            </button>
          `}
    </div>
  `;
}

// ---------- Opción múltiple (inglés → español) ----------

export function ChoiceCard({ word, options, isNew, result, onPick }) {
  const answered = result !== null;
  return html`
    <div className="card flashcard">
      <${Tags} word=${word} isNew=${isNew} />
      <${English} word=${word} />
      <div className="choices">
        ${options.map((opt, i) => {
          let state = '';
          if (answered && opt === word.translation_es) state = ' correct';
          else if (answered && opt === result.picked) state = ' wrong';
          return html`
            <button key=${opt} className=${'choice' + state} disabled=${answered} onClick=${() => onPick(opt)}>
              <kbd>${i + 1}</kbd> ${opt}
            </button>
          `;
        })}
      </div>
      ${answered &&
      html`
        <div className="back">
          <${Example} word=${word} />
          <div className="word-tools"><${DictLink} word=${word.word_en} /></div>
        </div>
      `}
    </div>
  `;
}

// ---------- Escribir en inglés / completar la frase ----------

export function WriteCard({ word, mode, cloze, isNew, result, onSubmit }) {
  const [typed, setTyped] = useState('');
  const [hinted, setHinted] = useState(false);
  const input = useRef(null);
  const answered = result !== null;
  const expected = mode === 'cloze' ? cloze.answer : word.word_en;

  function submit(e) {
    e.preventDefault();
    if (answered || !typed.trim()) return;
    onSubmit(typed, hinted);
  }

  return html`
    <form className="card flashcard" onSubmit=${submit}>
      <${Tags} word=${word} isNew=${isNew} />

      ${mode === 'cloze'
        ? html`
            <div className="cloze">${cloze.before}<span className=${'blank' + (answered ? ' filled' : '')}>${answered ? cloze.answer : '_____'}</span>${cloze.after}</div>
            <div className="muted">(${word.translation_es})</div>
          `
        : html`<div className="front prompt-es">${word.translation_es}</div>`}

      <input
        ref=${input}
        className=${'answer-input' + (answered ? ' ' + result.outcome : '')}
        value=${typed}
        onChange=${(e) => setTyped(e.target.value)}
        readOnly=${answered}
        placeholder="Escribe en inglés…"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        aria-label="Tu respuesta en inglés"
      />

      ${!answered &&
      html`
        <div className="write-actions">
          ${hinted
            ? html`<span className="hint-mask">${hintMask(expected)}</span>`
            : html`<button type="button" className="btn small" onClick=${() => {
                setHinted(true);
                input.current?.focus();
              }}>Pista</button>`}
          <button type="submit" className="btn primary">Comprobar <kbd>Enter</kbd></button>
        </div>
      `}

      ${answered &&
      html`
        <div className="back">
          ${result.outcome !== 'correct' && result.outcome !== 'hinted'
            ? html`<div className="expected">Respuesta: <strong>${expected}</strong> <${SpeakButton} text=${expected} /></div>`
            : html`<${English} word=${word} />`}
          ${mode === 'write' && html`<${Example} word=${word} />`}
          <div className="word-tools"><${DictLink} word=${word.word_en} /></div>
        </div>
      `}
    </form>
  `;
}
