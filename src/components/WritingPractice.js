// Escritura: escribir cada palabra varias veces con cada vez menos ayuda
// (copia → con pistas → primera letra → de memoria) y un dictado final con todas.
// No cambia las fechas de repaso.

import { useEffect, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { shuffle } from '../lib/modes.js';
import { speakIfAvailable } from '../lib/speech.js';
import { SpeakButton } from './WordTools.js';

const LEVEL_LABEL = {
  full: 'Copia',
  partial: 'Con pistas',
  first: 'Solo la primera letra',
  none: 'De memoria',
};
// En estos niveles cada letra se colorea mientras escribes; "de memoria" se comprueba con Enter.
const LIVE_LEVELS = new Set(['full', 'partial', 'first']);
const ADVANCE_MS = 700;

// Comparación letra a letra (misma longitud que el original): sin mayúsculas y con apóstrofos rectos.
const norm = (s) => s.toLowerCase().replace(/[’‘`]/g, "'");
const isLetter = (c) => /\p{L}/u.test(c);

// Nivel de ayuda de la repetición i (de reps): la última siempre de memoria.
//   5 reps → copia, copia, pistas, primera letra, memoria
export function levelFor(i, reps) {
  if (reps <= 1) return 'none';
  const p = i / (reps - 1);
  if (p < 0.3) return 'full';
  if (p < 0.6) return 'partial';
  if (p < 0.8) return 'first';
  return 'none';
}

function buildDrill(words, reps) {
  const steps = [];
  words.forEach((_, wi) => {
    for (let rep = 0; rep < reps; rep++) steps.push({ wi, rep, level: levelFor(rep, reps) });
  });
  return steps;
}

// La palabra en casillas: pistas según el nivel y, encima, lo que vas escribiendo coloreado.
// Las casillas van agrupadas por palabra para que una expresión solo salte de línea entre palabras.
function Slots({ target, typed, level, live, status }) {
  const typedChars = [...typed];
  const chars = [...target];
  let inWord = 0;

  const renderChar = (c, i) => {
        if (!isLetter(c)) {
          inWord = 0;
          return html`<span key=${i} className="slot-sym">${c}</span>`;
        }
        const idx = inWord++;
        const hint =
          level === 'full' || (level === 'partial' && idx % 2 === 0) || (level === 'first' && idx === 0) ? c : '';
        const got = typedChars[i];
        const right = got !== undefined && norm(got) === norm(c);

        let cls = 'slot';
        let shown = hint;
        if (status === 'wrong') {
          shown = c; // se enseña la palabra correcta, marcando qué letras habías acertado
          cls += right ? ' ok' : ' bad';
        } else if (got !== undefined) {
          shown = got === ' ' ? '·' : got;
          cls += live || status === 'ok' ? (right ? ' ok' : ' bad') : ' typed';
        } else if (hint) {
          cls += ' hint';
        }
        return html`<span key=${i} className=${cls}>${shown || ' '}</span>`;
  };

  // Grupos de índices por palabra (separadas por espacios).
  const groups = [];
  chars.forEach((c, i) => {
    if (c === ' ') {
      groups.push(null);
      inWord = 0;
    } else {
      if (!groups.length || groups[groups.length - 1] === null) groups.push([]);
      groups[groups.length - 1].push(i);
    }
  });
  inWord = 0;

  return html`
    <div className=${'slots' + (status ? ' ' + status : '') + (chars.length > 12 ? ' compact' : '')} aria-hidden="true">
      ${groups.map((g, gi) => {
        if (g === null) {
          inWord = 0;
          return html`<span key=${'gap' + gi} className="slot-gap"></span>`;
        }
        inWord = 0;
        return html`<span key=${'w' + gi} className="slot-word">${g.map((i) => renderChar(chars[i], i))}</span>`;
      })}
    </div>
  `;
}

export function WritingPractice({ db, settings, wordIds, onRestart, goTo }) {
  const reps = settings.writeReps;
  const [words] = useState(() =>
    shuffle(
      wordIds?.length
        ? db.wordsByIds(wordIds)
        : db.freePracticeWords(settings.writeOrder, settings.writeWords, settings.study),
    ),
  );
  const [phase, setPhase] = useState('drill'); // drill → final (dictado) → done
  const [steps, setSteps] = useState(() => buildDrill(words, reps));
  const [pos, setPos] = useState(0);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState(null); // null | 'ok' | 'wrong'
  const [errors, setErrors] = useState(() => words.map(() => 0)); // fallos durante las repeticiones
  const [finalFailed, setFinalFailed] = useState([]); // índices de palabras falladas en el dictado
  const input = useRef(null);
  const continueButton = useRef(null);

  const step = steps[pos];
  const word = step ? words[step.wi] : null;
  const target = word?.word_en.trim() ?? '';
  const live = step ? LIVE_LEVELS.has(step.level) : false;

  // Al empezar cada paso: leer la palabra (si hay voz inglesa) y poner el cursor.
  useEffect(() => {
    if (!word) return;
    if (settings.writeAudio) speakIfAvailable(target);
    input.current?.focus();
  }, [pos, phase]);

  useEffect(() => {
    if (status === 'wrong') continueButton.current?.focus();
  }, [status]);

  const bumpError = (wi) => setErrors((es) => es.map((n, i) => (i === wi ? n + 1 : n)));

  function next(extraSteps = []) {
    const plan = [...steps.slice(0, pos + 1), ...extraSteps, ...steps.slice(pos + 1)];
    setTyped('');
    setStatus(null);
    if (pos + 1 < plan.length) {
      setSteps(plan);
      setPos(pos + 1);
    } else if (phase === 'drill' && words.length > 0) {
      // Dictado final: todas las palabras, mezcladas y de memoria.
      setPhase('final');
      setSteps(shuffle(words.map((_, wi) => ({ wi, level: 'none', final: true }))));
      setPos(0);
    } else {
      setPhase('done');
    }
  }

  function succeed() {
    setStatus('ok');
    setTimeout(() => next(), ADVANCE_MS);
  }

  function fail() {
    setStatus('wrong');
    if (step.final) setFinalFailed((f) => [...f, step.wi]);
    else bumpError(step.wi);
  }

  // Tras fallar de memoria: volver a copiarla y a escribirla de memoria.
  function continueAfterWrong() {
    if (step.final) next();
    else next([
      { wi: step.wi, rep: step.rep, level: 'full', remedial: true },
      { wi: step.wi, rep: step.rep, level: 'none', remedial: true },
    ]);
  }

  function onType(e) {
    if (status) return;
    const value = e.target.value;
    if (live) {
      // Cuenta como fallo cada letra nueva que no coincide.
      if (value.length > typed.length) {
        const i = value.length - 1;
        if (norm(value[i]) !== norm(target[i] ?? '')) bumpError(step.wi);
      }
      setTyped(value);
      if (norm(value) === norm(target)) succeed();
    } else {
      setTyped(value);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (status === 'wrong') return continueAfterWrong();
    if (status || live || !typed.trim()) return;
    if (norm(typed.trim()) === norm(target)) succeed();
    else fail();
  }

  function giveUp() {
    setTyped('');
    fail();
  }

  // ---------- Pantallas ----------

  if (words.length === 0 && db.countWords() > 0) {
    return html`
      <div className="card empty">
        <h2>No hay palabras para escribir</h2>
        <p className="muted">
          Ninguna palabra coincide con tu filtro de estudio (🎯) o están todas en pausa.
        </p>
      </div>
    `;
  }
  if (words.length === 0) {
    return html`
      <div className="card empty">
        <h2>No hay palabras para escribir</h2>
        <p className="muted">Añade algunas palabras y podrás practicar su escritura.</p>
        <button className="btn primary" onClick=${() => goTo('add')}>Añadir palabras</button>
      </div>
    `;
  }

  if (phase === 'done') {
    const failedSet = new Set(finalFailed);
    const struggled = words.filter((_, wi) => failedSet.has(wi) || errors[wi] >= 2);
    const perfect = words.filter((_, wi) => !failedSet.has(wi) && errors[wi] === 0).length;
    return html`
      <div className="card writing-summary">
        <h2>Sesión de escritura terminada</h2>
        <p className="muted">
          ${`${perfect} de ${words.length} sin ningún fallo. En el dictado final acertaste ` +
          `${words.length - failedSet.size} de ${words.length}.`}
        </p>
        <ul className="summary-list">
          ${words.map(
            (w, wi) => html`
              <li key=${w.id}>
                <span className=${'summary-mark ' + (failedSet.has(wi) ? 'bad' : 'ok')}>${failedSet.has(wi) ? '✗' : '✓'}</span>
                <strong>${w.word_en}</strong> <span className="muted">— ${w.translation_es}</span>
                <span className="summary-errors">
                  ${errors[wi] === 0 ? 'sin fallos' : `${errors[wi]} ${errors[wi] === 1 ? 'fallo' : 'fallos'}`}
                </span>
              </li>
            `,
          )}
        </ul>
        <div className="empty-actions">
          ${struggled.length > 0 &&
          html`<button className="btn primary" onClick=${() => onRestart(struggled.map((w) => w.id))}>
            Repetir las que me han costado (${struggled.length})
          </button>`}
          <button className=${'btn' + (struggled.length ? '' : ' primary')} onClick=${() => onRestart(null)}>
            Otra sesión
          </button>
        </div>
        <p className="footnote">La escritura no cambia tus fechas de repaso.</p>
      </div>
    `;
  }

  const inFinal = phase === 'final';
  const wordNumber = step.wi + 1;
  const overbound = live && !norm(target).startsWith(norm(typed));
  const showExample = word.example_sentence && (step.level === 'full' || status);

  return html`
    <section className="writing">
      <p className="muted progress-text">
        ${inFinal
          ? html`<strong>Dictado final</strong> · ${pos + 1} de ${steps.length}`
          : html`<strong>Palabra ${wordNumber} de ${words.length}</strong> · repetición ${Math.min(step.rep + 1, reps)} de ${reps}`}
      </p>
      ${!inFinal &&
      html`
        <div className="rep-dots" aria-hidden="true">
          ${Array.from({ length: reps }, (_, r) => html`
            <span key=${r} className=${'dot' + (r < step.rep ? ' done' : r === step.rep ? ' current' : '')}></span>
          `)}
        </div>
      `}

      <form className="card flashcard write-drill" onSubmit=${onSubmit}>
        <div className="meta">
          <span className=${'tag level-step ' + step.level}>${LEVEL_LABEL[step.level]}</span>
          ${step.remedial && html`<span className="tag again">otra vez</span>`}
          ${word.category && html`<span className="tag">${word.category}</span>`}
        </div>

        <div className="front prompt-es">
          ${word.translation_es}
          <${SpeakButton} text=${target} className="speak-lg" tabIndex=${-1} />
        </div>

        <${Slots} target=${target} typed=${typed} level=${step.level} live=${live} status=${status} />

        <input
          ref=${input}
          className=${'answer-input' + (status ? ' ' + (status === 'ok' ? 'correct' : 'wrong') : overbound ? ' close' : '')}
          value=${typed}
          onChange=${onType}
          readOnly=${status !== null}
          placeholder=${live ? 'Escríbela aquí…' : 'Escríbela de memoria…'}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Escribe la palabra en inglés"
        />

        ${status === 'wrong'
          ? html`
              <div className="write-actions">
                <span className="expected">Era: <strong>${target}</strong></span>
                <button ref=${continueButton} type="submit" className="btn primary">
                  ${inFinal ? 'Continuar' : 'Copiarla otra vez'} <kbd>Enter</kbd>
                </button>
              </div>
            `
          : status === 'ok'
            ? html`<p className="feedback ok">¡Bien!</p>`
            : live
              ? html`<p className="muted write-hint">Se comprueba sola al terminar. Verde = bien, rojo = revisa esa letra.</p>`
              : html`
                  <div className="write-actions">
                    <button type="button" className="btn small" onClick=${giveUp}>No me acuerdo</button>
                    <button type="submit" className="btn primary" disabled=${!typed.trim()}>Comprobar <kbd>Enter</kbd></button>
                  </div>
                `}

        ${showExample && html`<div className="example">${word.example_sentence}</div>`}
      </form>
    </section>
  `;
}
