import { useEffect, useMemo, useState } from 'react';
import { html } from '../lib/html.js';
import { formatInterval, relativeDay, todayISO } from '../lib/dates.js';
import { GRADES, schedule } from '../lib/sm2.js';
import { speak } from '../lib/speech.js';
import { checkAnswer, clozeParts } from '../lib/answers.js';
import { MODE_LABEL, OUTCOME_GRADES, pickMode, shuffle } from '../lib/modes.js';
import { ChoiceCard, FlashCard, WriteCard } from './PracticeCards.js';
import { isStudyFiltered } from '../lib/settings.js';

const GRADE_BY_ID = {
  ...Object.fromEntries(GRADES.map((g) => [g.id, g])),
  // Segunda pasada de una fallada: no reprograma (ya quedó para mañana en el primer intento).
  known: { id: 'known', q: 4, label: 'Ya la sé', key: '2' },
};

const FEEDBACK = {
  correct: { text: '¡Correcto!', tone: 'ok' },
  hinted: { text: 'Correcto, con pista.', tone: 'ok' },
  close: { text: 'Casi: revisa cómo se escribe.', tone: 'warn' },
  wrong: { text: 'No era esa.', tone: 'error' },
};

// Modos en los que el anverso ya está en inglés, así que escucharla no desvela la respuesta.
const ENGLISH_FRONT = new Set(['flash-en', 'choice']);

function buildCard(db, item, modeSetting) {
  if (item.relearn) return { mode: 'flash-en' };
  const { word } = item;
  const distractors = db.distractors(word, 3);
  const cloze = word.example_sentence ? clozeParts(word.example_sentence, word.word_en) : null;
  const mode = pickMode(modeSetting, word, { canChoice: distractors.length === 3, canCloze: cloze !== null });
  return {
    mode,
    cloze: mode === 'cloze' ? cloze : null,
    options: mode === 'choice' ? shuffle([word.translation_es, ...distractors]) : null,
  };
}

// free = práctica libre: palabras elegidas en los ajustes, estén o no pendientes, y sin
// tocar su programación (las fechas de repaso solo las cambia el repaso de hoy).
export function Practice({
  db,
  onChange,
  goTo,
  settings,
  free,
  wordIds,
  dueCount,
  grammarDue = 0,
  onGrammarReview,
  onStartFree,
  onNewRound,
  onBackToDue,
}) {
  const [today] = useState(todayISO);
  const [session] = useState(() =>
    free
      ? {
          words: shuffle(
            wordIds?.length
              ? db.wordsByIds(wordIds)
              : db.freePracticeWords(settings.freeOrder, settings.freeSize, settings.study),
          ),
          newWaiting: 0,
        }
      : db.practiceQueue(today, settings.newPerDay, settings.study),
  );
  const [queue, setQueue] = useState(() => session.words.map((word) => ({ word, relearn: false })));
  const total = session.words.length;
  const [pos, setPos] = useState(0);
  // null hasta que respondes; luego { outcome, picked?, typed? }
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ reviewed: 0, failed: 0 });

  const item = queue[pos];
  const card = useMemo(() => (item ? buildCard(db, item, settings.mode) : null), [item]);
  const answered = result !== null;
  const gradeSet = answered ? OUTCOME_GRADES[result.outcome] : null;
  const grades = gradeSet ? gradeSet.ids.map((id) => GRADE_BY_ID[id]) : [];

  function answer(r) {
    if (!answered) setResult(r);
  }

  function reveal() {
    answer({ outcome: item.relearn ? 'relearn' : 'self' });
  }

  function pick(option) {
    answer({ outcome: option === item.word.translation_es ? 'correct' : 'wrong', picked: option });
  }

  function submitTyped(typed, hinted) {
    const expected = card.mode === 'cloze' ? card.cloze.answer : item.word.word_en;
    let outcome = checkAnswer(typed, expected);
    if (outcome === 'correct' && hinted) outcome = 'hinted';
    answer({ outcome, typed });
  }

  function grade(g) {
    if (!item || !answered) return;
    const failed = g.q < 3;

    if (!item.relearn) {
      if (!free) {
        db.saveReview(item.word.id, schedule(item.word, g.q, today)).catch((err) => console.error(err));
        onChange();
      }
      setStats((s) => ({ reviewed: s.reviewed + 1, failed: s.failed + (failed ? 1 : 0) }));
    }
    // Las falladas vuelven al final de la sesión hasta que las aciertes.
    if (failed) setQueue([...queue, { word: item.word, relearn: true }]);
    setPos(pos + 1);
    setResult(null);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !item) return;
      if (document.body.classList.contains('modal-open')) return; // escribiendo en "Añadir palabra"
      // Mientras escribes una respuesta, las teclas son del campo de texto.
      if (e.target.matches?.('input:not([readonly]), textarea, select')) return;

      if (e.key === 'p' || e.key === 'P') {
        if (answered || ENGLISH_FRONT.has(card.mode)) speak(item.word.word_en);
        return;
      }
      const confirmKey = e.key === ' ' || e.key === 'Enter';

      if (!answered) {
        if (card.mode.startsWith('flash') && confirmKey) {
          e.preventDefault();
          reveal();
        } else if (card.mode === 'choice' && /^[1-4]$/.test(e.key)) {
          pick(card.options[Number(e.key) - 1]);
        }
        return;
      }

      const g = confirmKey ? GRADE_BY_ID[gradeSet.def] : grades.find((x) => x.key === e.key);
      if (g) {
        e.preventDefault();
        grade(g);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const waitingNote =
    session.newWaiting > 0 &&
    html`<p className="muted">
      ${`Hay ${session.newWaiting} ${session.newWaiting === 1 ? 'palabra nueva esperando' : 'palabras nuevas esperando'} ` +
      `(límite: ${settings.newPerDay} nuevas al día). Puedes subir el límite arriba.`}
    </p>`;

  const hasWords = db.countWords() > 0;
  const freeButton = (label, primary) =>
    hasWords && html`<button className=${'btn' + (primary ? ' primary' : '')} onClick=${onStartFree}>${label}</button>`;
  const addButton = (primary) =>
    html`<button className=${'btn' + (primary ? ' primary' : '')} onClick=${() => goTo('add')}>Añadir palabras</button>`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Tras las palabras, la gramática que toca repasar hoy (repaso espaciado por unidad).
  const grammarNote =
    !free &&
    grammarDue > 0 &&
    html`<div className="grammar-due-note">
      <span>📘 También tienes <strong>${plural(grammarDue, 'unidad', 'unidades')} de gramática</strong> para repasar hoy.</span>
      <button className="btn small primary" onClick=${onGrammarReview}>Repasar gramática</button>
    </div>`;

  const filtered = isStudyFiltered(settings.study);
  if (total === 0) {
    if (free && hasWords) {
      return html`
        <div className="card empty">
          <h2>No hay palabras que practicar</h2>
          <p className="muted">
            ${filtered
              ? 'Ninguna palabra coincide con tu filtro de estudio. Cámbialo o quítalo arriba (🎯).'
              : 'Todas tus palabras están en pausa. Reanúdalas en Palabras → Seleccionar.'}
          </p>
        </div>
      `;
    }
    if (free) {
      return html`
        <div className="card empty">
          <h2>Aún no tienes palabras</h2>
          <p className="muted">Añade algunas y podrás practicarlas cuando quieras.</p>
          ${addButton(true)}
        </div>
      `;
    }
    const next = db.nextReview(today, settings.study);
    return html`
      <div className="card empty">
        <h2>Nada pendiente hoy${filtered ? ' con este filtro' : ''}</h2>
        ${waitingNote ||
        html`<p className="muted">
          ${next
            ? `Próximo repaso: ${relativeDay(next.date, today)} (${plural(next.n, 'palabra', 'palabras')}).`
            : 'Añade palabras para empezar a repasar.'}
        </p>`}
        ${grammarNote}
        <div className="empty-actions">${freeButton('Práctica libre', true)} ${addButton(!hasWords)}</div>
      </div>
    `;
  }

  if (!item) {
    if (free) {
      return html`
        <div className="card empty">
          <h2>Ronda terminada</h2>
          <p>
            ${`Has practicado ${plural(stats.reviewed, 'palabra', 'palabras')}` +
            (stats.failed > 0 ? `; has fallado ${stats.failed} a la primera.` : ', todas a la primera. ¡Bien!')}
          </p>
          <p className="muted">La práctica libre no cambia tus fechas de repaso.</p>
          <div className="empty-actions">
            <button className="btn primary" onClick=${onNewRound}>Otra ronda</button>
            ${dueCount > 0 && html`<button className="btn" onClick=${onBackToDue}>Repaso de hoy (${dueCount})</button>`}
          </div>
        </div>
      `;
    }
    return html`
      <div className="card empty">
        <h2>Sesión terminada</h2>
        <p>
          Has repasado ${plural(stats.reviewed, 'palabra', 'palabras')}${stats.failed > 0
            ? `; ${stats.failed} ${stats.failed === 1 ? 'vuelve' : 'vuelven'} mañana`
            : ''}.
        </p>
        ${waitingNote}
        ${grammarNote}
        <div className="empty-actions">${freeButton('Seguir practicando', true)} ${addButton(false)}</div>
      </div>
    `;
  }

  const w = item.word;
  const isNew = !item.relearn && !w.first_review_date;
  const feedback = answered && FEEDBACK[result.outcome];
  const cardProps = { word: w, isNew, result };

  return html`
    <section className="practice">
      <div className="progress" aria-label="Progreso">
        <div className="progress-bar" style=${{ width: `${(stats.reviewed / total) * 100}%` }}></div>
      </div>
      <p className="muted progress-text">
        ${free && html`<strong>Práctica libre</strong> · `}${stats.reviewed} / ${total} · ${MODE_LABEL[card.mode]}
        ${item.relearn && html`<span className="tag again">repaso de fallo</span>`}
      </p>

      ${card.mode === 'choice'
        ? html`<${ChoiceCard} key=${pos} ...${cardProps} options=${card.options} onPick=${pick} />`
        : card.mode === 'write' || card.mode === 'cloze'
          ? html`<${WriteCard} key=${pos} ...${cardProps} mode=${card.mode} cloze=${card.cloze} onSubmit=${submitTyped} />`
          : html`<${FlashCard} key=${pos} ...${cardProps} mode=${card.mode} onReveal=${reveal} />`}

      ${answered &&
      html`
        ${feedback && html`<p className=${'feedback ' + feedback.tone}>${feedback.text}</p>`}
        <div className=${'grades n' + grades.length}>
          ${grades.map(
            (g) => html`
              <button
                key=${g.id}
                className=${'btn grade ' + g.id + (g.id === gradeSet.def ? ' default' : '')}
                onClick=${() => grade(g)}
              >
                <span className="grade-label">${g.id === 'again' && grades.length === 1 ? 'Continuar' : g.label}</span>
                ${!item.relearn &&
                !free &&
                html`<span className="grade-interval">${formatInterval(schedule(w, g.q, today).interval_days)}</span>`}
                <kbd>${g.key}</kbd>
              </button>
            `,
          )}
        </div>
      `}
      <p className="key-hint muted">
        Teclado: <kbd>Espacio</kbd>/<kbd>Enter</kbd> mostrar o continuar · <kbd>1</kbd>–<kbd>4</kbd> elegir o valorar ·
        <kbd>P</kbd> escuchar
      </p>
    </section>
  `;
}
