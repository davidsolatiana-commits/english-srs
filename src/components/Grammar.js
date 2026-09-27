// Pestaña Gramática: escalera A1 → C1, unidades (teoría + ejercicios), chuleta de tiempos,
// repaso mixto, "¿Dónde está el error?" y repaso espaciado de las unidades dominadas.
// Contenido: src/lib/grammar.js (artifact «Escalera de gramática» + unidades añadidas).

import { useEffect, useMemo, useState } from 'react';
import { html } from '../lib/html.js';
import { todayISO, relativeDay } from '../lib/dates.js';
import {
  CHEAT,
  IRREGULARS,
  LEVELS,
  LEVEL_KEYS,
  MASTERY,
  SAME_VERB,
  UNITS,
  UNIT_BY_ID,
  errorItemsOf,
  questionsOf,
  shuffle,
  unitNumber,
} from '../lib/grammar.js';
import { GrammarQuiz } from './GrammarQuiz.js';
import { SpeakButton } from './WordTools.js';

const LAST_UNIT_KEY = 'english-srs:grammar-last';
const ROUND_SIZE = 10;

// Los textos del temario llevan <b>, <i> y <mark>: contenido propio, no del usuario.
const Rich = ({ text, as = 'span', className }) =>
  html`<${as} className=${className} dangerouslySetInnerHTML=${{ __html: text }} />`;

const levelClass = (lv) => `lv-${lv}`;

function readLastUnit() {
  try {
    return localStorage.getItem(LAST_UNIT_KEY);
  } catch {
    return null;
  }
}

function LevelChip({ unit }) {
  return html`<span className=${'lv-chip ' + levelClass(unit.lv)}>${unit.lv} · ${LEVELS[unit.lv].name}</span>`;
}

// ---------- Escalera ----------

function GrammarHome({ progress, due, onNavigate }) {
  const mastered = UNITS.filter((u) => progress[u.id]?.status === 'dominado').length;
  const last = UNIT_BY_ID[readLastUnit()];
  const next = UNITS.find((u) => progress[u.id]?.status !== 'dominado') ?? UNITS[0];
  const target = last ?? next;

  return html`
    <section className="grammar-home">
      <div className="card grammar-hero">
        <h2>De <mark>I am</mark> a <mark>Had I known</mark>, peldaño a peldaño</h2>
        <p className="muted">
          ${UNITS.length} unidades de A1 a C1. Cada una: cuándo se usa, cómo se forma, los errores típicos de los
          hispanohablantes y ejercicios que se corrigen al momento. Con un 80 % la unidad queda dominada y vuelve a
          salir para repasarla cada vez más espaciada.
        </p>
        <div className="empty-actions left">
          <button className="btn primary" onClick=${() => onNavigate({ page: 'unit', unitId: target.id })}>
            ${last ? 'Seguir con' : 'Empezar por'}: ${target.t}
          </button>
          ${due.length > 0 &&
          html`<button className="btn" onClick=${() => onNavigate({ page: 'due' })}>🔁 Repasar ${due.length} ${due.length === 1 ? 'unidad' : 'unidades'}</button>`}
        </div>
        <p className="grammar-count"><strong>${mastered}</strong> de ${UNITS.length} unidades dominadas</p>
      </div>

      <div className="ladder">
        ${[...LEVEL_KEYS].reverse().map((lv) => {
          const units = UNITS.filter((u) => u.lv === lv);
          const done = units.filter((u) => progress[u.id]?.status === 'dominado').length;
          return html`
            <div key=${lv} className=${'rung ' + levelClass(lv)}>
              <div className="rung-code">${lv}<small>${LEVELS[lv].name}<br />${done}/${units.length}</small></div>
              <div>
                <div className="rung-bar"><i style=${{ width: `${(done / units.length) * 100}%` }}></i></div>
                <p className="muted">${LEVELS[lv].desc}</p>
                <div className="pills">
                  ${units.map((u) => {
                    const status = progress[u.id]?.status ?? 'nuevo';
                    return html`
                      <button key=${u.id} className=${'pill ' + status} onClick=${() => onNavigate({ page: 'unit', unitId: u.id })}>
                        ${status === 'dominado' ? '✓ ' : ''}${u.t}
                      </button>
                    `;
                  })}
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    </section>
  `;
}

// ---------- Unidad ----------

function GrammarUnit({ db, unit, progress, onChange, onNavigate }) {
  const today = todayISO();
  const row = progress[unit.id];
  const [message, setMessage] = useState(null);
  const index = UNITS.indexOf(unit);
  const prev = UNITS[index - 1];
  const next = UNITS[index + 1];
  const items = useMemo(() => questionsOf([unit]), [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_UNIT_KEY, unit.id);
    } catch {
      // sin localStorage no se recuerda la última unidad
    }
    window.scrollTo(0, 0);
  }, [unit.id]);

  async function onChecked({ ok, total, unanswered }) {
    if (unanswered) {
      setMessage({ tone: 'meh', text: `${ok}/${total} · te faltan ${unanswered} por responder` });
      return;
    }
    await db.saveGrammarAttempt(unit.id, ok, total, today);
    onChange();
    const pct = ok / total;
    setMessage({
      tone: pct >= MASTERY ? 'good' : 'meh',
      text:
        pct === 1
          ? `${ok}/${total}. Perfecto: unidad dominada.`
          : pct >= MASTERY
            ? `${ok}/${total}. Unidad dominada.`
            : `${ok}/${total}. Repasa la teoría y vuelve a intentarlo (hace falta un 80 %).`,
    });
  }

  async function toggleMastered(e) {
    await db.setGrammarMastered(unit.id, e.target.checked, today);
    onChange();
  }

  const status = row?.status ?? 'nuevo';

  return html`
    <article className=${'grammar-unit ' + levelClass(unit.lv)}>
      <button className="btn small" onClick=${() => onNavigate({ page: 'home' })}>← Escalera</button>
      <p className="unit-meta"><${LevelChip} unit=${unit} /> <span className="muted">Unidad ${unitNumber(unit.id)} de ${UNITS.length}</span></p>
      <h2 className="unit-title">${unit.t}</h2>
      <p className="unit-sub muted">${unit.s}</p>
      ${status === 'dominado' &&
      row?.next_review_date &&
      html`<p className="unit-status">✓ Dominada · próximo repaso ${relativeDay(row.next_review_date, today)}</p>`}

      ${unit.when &&
      html`
        <h3>Cuándo se usa</h3>
        <ul className="plain">${unit.when.map((w, i) => html`<li key=${i}><${Rich} text=${w} /></li>`)}</ul>
      `}

      ${(unit.f || unit.tbl) &&
      html`
        <h3>Cómo se forma</h3>
        ${unit.f &&
        html`<div className="formula">
          ${unit.f.map((p, k) => (p === '+' ? html`<em key=${k}>+</em>` : html`<span key=${k}>${p}</span>`))}
        </div>`}
        ${unit.tbl &&
        html`<div className="tbl"><table>
          <thead><tr>${unit.tbl.h.map((h, k) => html`<th key=${k}><${Rich} text=${h} /></th>`)}</tr></thead>
          <tbody>${unit.tbl.r.map((r, k) => html`<tr key=${k}>${r.map((c, j) => html`<td key=${j}><${Rich} text=${c} /></td>`)}</tr>`)}</tbody>
        </table></div>`}
        ${unit.notes && html`<ul className="plain notes">${unit.notes.map((n, i) => html`<li key=${i}><${Rich} text=${n} /></li>`)}</ul>`}
      `}

      <h3>Ejemplos</h3>
      <div className="exs">
        ${unit.ex.map(
          ([en, es], i) => html`
            <div key=${i} className="exr">
              <${SpeakButton} text=${en} />
              <div><div className="ex-en">${en}</div><div className="ex-es muted">${es}</div></div>
            </div>
          `,
        )}
      </div>

      <h3>Errores típicos</h3>
      <div className="errs">
        ${unit.err.map(
          ([wrong, right, why], i) => html`
            <div key=${i} className="err">
              <div className="err-w"><b>NO</b> ${wrong}</div>
              <div className="err-r"><b>SÍ</b> ${right}</div>
              ${why && html`<div className="err-y muted">${why}</div>`}
            </div>
          `,
        )}
      </div>
      ${unit.tip && html`<${Rich} as="div" className="tip" text=${unit.tip} />`}

      <section className="card practice-box">
        <h3>Practica</h3>
        <p className="muted small-note">
          Escribe la forma correcta y pulsa Enter, o elige una opción. Contracciones como <i>don't</i> o <i>do not</i>
          valen igual.${row?.best_total ? ` Mejor resultado: ${row.best_ok}/${row.best_total}.` : ''}
        </p>
        <${GrammarQuiz} key=${unit.id} items=${items} onChecked=${onChecked} message=${message} />
        <label className="switch mastered-toggle">
          <input type="checkbox" checked=${status === 'dominado'} onChange=${toggleMastered} />
          Marcar como dominada
        </label>
      </section>

      <nav className="pager">
        ${prev
          ? html`<button onClick=${() => onNavigate({ page: 'unit', unitId: prev.id })}><small>Anterior</small>${prev.t}</button>`
          : html`<span></span>`}
        ${next
          ? html`<button className="nx" onClick=${() => onNavigate({ page: 'unit', unitId: next.id })}><small>Siguiente</small>${next.t}</button>`
          : html`<button className="nx" onClick=${() => onNavigate({ page: 'review' })}><small>Has llegado arriba</small>Repaso mixto</button>`}
      </nav>
    </article>
  `;
}

// ---------- Chuleta ----------

function GrammarCheat({ onNavigate }) {
  return html`
    <section className="grammar-cheat">
      <h2>Chuleta de tiempos verbales</h2>
      <p className="muted">Los 12 tiempos en una tabla. Toca el nombre para ir a su unidad.</p>
      <div className="tbl"><table>
        <thead><tr><th>Tiempo</th><th>Estructura</th><th>Ejemplo</th><th>Úsalo para</th><th>Palabras clave</th></tr></thead>
        <tbody>
          ${CHEAT.map(
            ([name, form, example, use, keys, unitId]) => html`
              <tr key=${name}>
                <td><button className="link-btn strong" onClick=${() => onNavigate({ page: 'unit', unitId })}>${name}</button></td>
                <td className="mono">${form}</td>
                <td>${example}</td>
                <td>${use}</td>
                <td className="muted">${keys}</td>
              </tr>
            `,
          )}
        </tbody>
      </table></div>

      <h3>El mismo verbo en todos los tiempos</h3>
      <div className="exs">
        ${SAME_VERB.map(
          ([en, es]) => html`
            <div key=${en} className="exr">
              <${SpeakButton} text=${en} />
              <div><div className="ex-en">${en}</div><div className="ex-es muted">${es}</div></div>
            </div>
          `,
        )}
      </div>

      <h3>Verbos irregulares más usados</h3>
      <div className="tbl"><table>
        <thead><tr><th>Infinitivo</th><th>Pasado</th><th>Participio</th><th>Significado</th></tr></thead>
        <tbody>
          ${IRREGULARS.map(
            ([inf, past, pp, es]) => html`
              <tr key=${inf}>
                <td><strong>${inf}</strong> <${SpeakButton} text=${`${inf}, ${past.replace(' / ', ', ')}, ${pp}`} /></td>
                <td>${past}</td><td>${pp}</td><td className="muted">${es}</td>
              </tr>
            `,
          )}
        </tbody>
      </table></div>
    </section>
  `;
}

// ---------- Repaso mixto y "¿Dónde está el error?" ----------

function ErrorSpot({ items, onOpenUnit, onAgain }) {
  // Para cada pareja, orden aleatorio de las dos opciones (se fija al crear la ronda).
  const [rounds] = useState(() => items.map((it) => ({ ...it, flip: Math.random() < 0.5 })));
  const [answers, setAnswers] = useState({});
  const answered = Object.keys(answers).length;
  const right = Object.values(answers).filter(Boolean).length;

  return html`
    <ol className="qs">
      ${rounds.map((it, i) => {
        const options = it.flip ? [it.right, it.wrong] : [it.wrong, it.right];
        const chosen = answers[i];
        return html`
          <li key=${i} className=${'q' + (chosen === true ? ' ok' : chosen === false ? ' bad' : '')}>
            <div className="q-body">¿Cuál es correcta?</div>
            <div className="opts col">
              ${options.map((opt) => {
                const isRight = opt === it.right;
                let cls = 'opt';
                if (chosen !== undefined && isRight) cls += ' ok';
                else if (chosen === false && !isRight) cls += ' bad';
                return html`<button key=${opt} className=${cls} disabled=${chosen !== undefined} onClick=${() => setAnswers((a) => ({ ...a, [i]: isRight }))}>${opt}</button>`;
              })}
            </div>
            ${chosen !== undefined &&
            html`<div className=${'q-fb ' + (chosen ? 'ok' : 'bad')}>${chosen ? 'Correcto.' : 'No.'} ${it.why ?? ''}</div>`}
            <button className="q-src" onClick=${() => onOpenUnit(it.unit.id)}>${it.unit.lv} · ${it.unit.t} →</button>
          </li>
        `;
      })}
    </ol>
    <div className="quiz-bar">
      <button className="btn primary" onClick=${onAgain}>Otra ronda</button>
      ${answered > 0 && html`<span className=${'quiz-score ' + (right / answered >= MASTERY ? 'good' : 'meh')}>${right}/${answered}${answered < rounds.length ? ` · faltan ${rounds.length - answered}` : ''}</span>`}
    </div>
  `;
}

function GrammarReview({ progress, onOpenUnit }) {
  const [mode, setMode] = useState('fill'); // fill | errors
  const [levels, setLevels] = useState(() => {
    const withMastered = [...new Set(UNITS.filter((u) => progress[u.id]?.status === 'dominado').map((u) => u.lv))];
    return new Set(withMastered.length ? withMastered : ['A1', 'A2']);
  });
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState(null);

  const units = UNITS.filter((u) => levels.has(u.lv));
  const items = useMemo(
    () => shuffle(mode === 'fill' ? questionsOf(units) : errorItemsOf(units)).slice(0, ROUND_SIZE),
    [mode, round, [...levels].join()],
  );

  function toggle(lv) {
    const nextLevels = new Set(levels);
    nextLevels.has(lv) ? nextLevels.delete(lv) : nextLevels.add(lv);
    setLevels(nextLevels);
    setMessage(null);
  }

  return html`
    <section className="grammar-review">
      <h2>Repaso mixto</h2>
      <p className="muted">
        Diez preguntas al azar de los niveles que elijas. Mezclar temas es lo que más ayuda a fijar la gramática.
      </p>
      <div className="segmented small">
        <button className=${mode === 'fill' ? 'active' : ''} onClick=${() => { setMode('fill'); setMessage(null); }}>Ejercicios</button>
        <button className=${mode === 'errors' ? 'active' : ''} onClick=${() => { setMode('errors'); setMessage(null); }}>¿Dónde está el error?</button>
      </div>
      <div className="lvsel">
        ${LEVEL_KEYS.map(
          (lv) => html`
            <label key=${lv} className=${levelClass(lv)}>
              <input type="checkbox" checked=${levels.has(lv)} onChange=${() => toggle(lv)} /> ${lv}
            </label>
          `,
        )}
      </div>
      <div className="card practice-box">
        ${items.length === 0
          ? html`<p className="muted">Elige al menos un nivel.</p>`
          : mode === 'fill'
            ? html`
                <${GrammarQuiz}
                  key=${'fill' + round + [...levels].join()}
                  items=${items}
                  showSource=${true}
                  onOpenUnit=${onOpenUnit}
                  message=${message}
                  onChecked=${({ ok, total, unanswered }) =>
                    setMessage({ tone: ok / total >= MASTERY ? 'good' : 'meh', text: `${ok}/${total}${unanswered ? ` · ${unanswered} sin responder` : ''}` })}
                />
                <button className="btn again-btn" onClick=${() => { setRound((r) => r + 1); setMessage(null); }}>Otra ronda</button>
              `
            : html`<${ErrorSpot} key=${'err' + round + [...levels].join()} items=${items} onOpenUnit=${onOpenUnit} onAgain=${() => setRound((r) => r + 1)} />`}
      </div>
    </section>
  `;
}

// ---------- Repaso espaciado de unidades dominadas ----------

function GrammarDue({ db, due, onChange, onNavigate }) {
  const today = todayISO();
  // Hasta 3 preguntas de cada unidad pendiente (máximo 12 en total).
  const [units] = useState(() => due.map((r) => UNIT_BY_ID[r.unit_id]).filter(Boolean));
  const [items] = useState(() =>
    shuffle(units.flatMap((u) => shuffle(questionsOf([u])).slice(0, 3))).slice(0, 12),
  );
  const [outcome, setOutcome] = useState(null); // [{ unit, passed, ok, total }]
  const [message, setMessage] = useState(null);

  async function onChecked({ unanswered, byUnit }) {
    if (unanswered) {
      setMessage({ tone: 'meh', text: `Te faltan ${unanswered} por responder` });
      return;
    }
    const results = [];
    for (const u of units) {
      const r = byUnit[u.id];
      if (!r) continue;
      const passed = r.ok / r.total >= 2 / 3;
      await db.recordGrammarReview(u.id, passed, today);
      results.push({ unit: u, passed, ...r });
    }
    setOutcome(results);
    setMessage(null);
    onChange();
  }

  if (units.length === 0) {
    return html`
      <div className="card empty">
        <h2>Nada de gramática para repasar hoy</h2>
        <p className="muted">Las unidades dominadas vuelven a salir aquí cuando les toca.</p>
        <button className="btn primary" onClick=${() => onNavigate({ page: 'home' })}>Ir a la escalera</button>
      </div>
    `;
  }

  if (outcome) {
    const progress = db.grammarProgress();
    return html`
      <div className="card writing-summary">
        <h2>Repaso de gramática terminado</h2>
        <ul className="summary-list">
          ${outcome.map(
            ({ unit, passed, ok, total }) => html`
              <li key=${unit.id}>
                <span className=${'summary-mark ' + (passed ? 'ok' : 'bad')}>${passed ? '✓' : '✗'}</span>
                <button className="link-btn strong" onClick=${() => onNavigate({ page: 'unit', unitId: unit.id })}>${unit.t}</button>
                <span className="summary-errors">
                  ${ok}/${total} · ${passed
                    ? `próximo repaso ${relativeDay(progress[unit.id]?.next_review_date, today)}`
                    : 'vuelve mañana: repasa la teoría'}
                </span>
              </li>
            `,
          )}
        </ul>
        <div className="empty-actions">
          <button className="btn primary" onClick=${() => onNavigate({ page: 'home' })}>Volver a la escalera</button>
        </div>
      </div>
    `;
  }

  return html`
    <section className="grammar-review">
      <h2>Repaso de gramática</h2>
      <p className="muted">
        Toca repasar: ${units.map((u) => u.t).join(', ')}. Si aciertas al menos 2 de cada 3, la unidad vuelve más
        adelante; si no, mañana.
      </p>
      <div className="card practice-box">
        <${GrammarQuiz}
          items=${items}
          showSource=${true}
          onOpenUnit=${(unitId) => onNavigate({ page: 'unit', unitId })}
          onChecked=${onChecked}
          message=${message}
          checkLabel="Terminar repaso"
        />
      </div>
    </section>
  `;
}

// ---------- Pestaña ----------

const SECTIONS = [
  { page: 'home', label: 'Escalera' },
  { page: 'cheat', label: 'Chuleta' },
  { page: 'review', label: 'Repaso' },
];

export function Grammar({ db, version, nav, onNavigate, onChange }) {
  const progress = useMemo(() => db.grammarProgress(), [db, version]);
  const due = useMemo(() => db.grammarDue(todayISO()), [db, version]);
  const unit = nav.page === 'unit' ? UNIT_BY_ID[nav.unitId] : null;
  const active = nav.page === 'unit' ? 'home' : nav.page === 'due' ? null : nav.page;

  return html`
    <div className="segmented" role="tablist" aria-label="Gramática">
      ${SECTIONS.map(
        (s) => html`
          <button key=${s.page} role="tab" aria-selected=${active === s.page} className=${active === s.page ? 'active' : ''} onClick=${() => onNavigate({ page: s.page })}>
            ${s.label}
          </button>
        `,
      )}
      ${due.length > 0 &&
      html`<button role="tab" aria-selected=${nav.page === 'due'} className=${nav.page === 'due' ? 'active' : ''} onClick=${() => onNavigate({ page: 'due' })}>
        Pendientes (${due.length})
      </button>`}
    </div>

    ${unit
      ? html`<${GrammarUnit} key=${unit.id} db=${db} unit=${unit} progress=${progress} onChange=${onChange} onNavigate=${onNavigate} />`
      : nav.page === 'cheat'
        ? html`<${GrammarCheat} onNavigate=${onNavigate} />`
        : nav.page === 'review'
          ? html`<${GrammarReview} progress=${progress} onOpenUnit=${(unitId) => onNavigate({ page: 'unit', unitId })} />`
          : nav.page === 'due'
            ? html`<${GrammarDue} key=${nav.key ?? 'due'} db=${db} due=${due} onChange=${onChange} onNavigate=${onNavigate} />`
            : html`<${GrammarHome} progress=${progress} due=${due} onNavigate=${onNavigate} />`}
  `;
}
