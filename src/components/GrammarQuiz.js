// Ejercicios de gramática: huecos (se corrigen con Enter o con "Comprobar todo") y opción
// múltiple (al elegir). Mismo comportamiento que en el artifact «Escalera de gramática».

import { useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { isRight } from '../lib/grammarCheck.js';

// items: [{ q, unit }]. onChecked({ ok, total, unanswered, byUnit }) al pulsar "Comprobar todo".
export function GrammarQuiz({ items, onChecked, message, showSource = false, onOpenUnit, checkLabel = 'Comprobar todo' }) {
  const [values, setValues] = useState({}); // i → texto escrito
  const [results, setResults] = useState({}); // i → true | false
  const [picks, setPicks] = useState({}); // i → opción elegida
  const inputs = useRef({});

  function checkFill(i) {
    const [, answers] = items[i].q;
    const v = (values[i] ?? '').trim();
    setResults((r) => ({ ...r, [i]: v ? isRight(v, answers) : undefined }));
    return v ? isRight(v, answers) : undefined;
  }

  function onKeyDown(e, i) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    checkFill(i);
    const next = items.findIndex((it, j) => j > i && Array.isArray(it.q));
    if (next >= 0) inputs.current[next]?.focus();
  }

  function pick(i, option) {
    if (picks[i] !== undefined) return;
    setPicks((p) => ({ ...p, [i]: option }));
    setResults((r) => ({ ...r, [i]: option === items[i].q.a }));
  }

  function checkAll() {
    const final = { ...results };
    items.forEach((it, i) => {
      if (Array.isArray(it.q)) final[i] = checkFill(i);
    });
    const byUnit = {};
    let ok = 0;
    let unanswered = 0;
    items.forEach((it, i) => {
      const u = (byUnit[it.unit.id] ??= { ok: 0, total: 0 });
      u.total += 1;
      if (final[i] === true) {
        ok += 1;
        u.ok += 1;
      }
      if (final[i] === undefined) unanswered += 1;
    });
    onChecked?.({ ok, total: items.length, unanswered, byUnit });
  }

  function reset() {
    setValues({});
    setResults({});
    setPicks({});
    const first = items.findIndex((it) => Array.isArray(it.q));
    if (first >= 0) inputs.current[first]?.focus();
  }

  return html`
    <div className="quiz">
      <ol className="qs">
        ${items.map((it, i) => {
          const res = results[i];
          const state = res === true ? ' ok' : res === false ? ' bad' : '';
          const source =
            showSource &&
            html`<button className="q-src" onClick=${() => onOpenUnit?.(it.unit.id)}>${it.unit.lv} · ${it.unit.t} →</button>`;

          if (Array.isArray(it.q)) {
            const [sentence, answers] = it.q;
            const [before, after = ''] = sentence.split('___');
            const width = Math.max(6, ...answers.map((a) => a.length)) + 2;
            return html`
              <li key=${i} className=${'q' + state}>
                <div className="q-body">
                  ${before}<input
                    ref=${(el) => (inputs.current[i] = el)}
                    value=${values[i] ?? ''}
                    style=${{ width: `${width}ch` }}
                    onChange=${(e) => {
                      setValues((v) => ({ ...v, [i]: e.target.value }));
                      setResults((r) => ({ ...r, [i]: undefined }));
                    }}
                    onKeyDown=${(e) => onKeyDown(e, i)}
                    aria-label="Respuesta"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />${after}
                </div>
                ${res === true && html`<div className="q-fb ok">Correcto.</div>`}
                ${res === false && html`<div className="q-fb bad">Respuesta: <span className="sol">${answers[0]}</span></div>`}
                ${source}
              </li>
            `;
          }

          const { q, o, a, why } = it.q;
          const picked = picks[i];
          return html`
            <li key=${i} className=${'q' + state}>
              <div className="q-body">${q}</div>
              <div className="opts">
                ${o.map((opt, k) => {
                  let cls = 'opt';
                  if (picked !== undefined && k === a) cls += ' ok';
                  else if (picked === k) cls += ' bad';
                  return html`<button key=${k} className=${cls} disabled=${picked !== undefined} onClick=${() => pick(i, k)}>${opt}</button>`;
                })}
              </div>
              ${picked !== undefined &&
              html`<div className=${'q-fb ' + (res ? 'ok' : 'bad')}>${res ? 'Correcto.' : 'No es esa.'}${why ? ' ' + why : ''}</div>`}
              ${source}
            </li>
          `;
        })}
      </ol>
      <div className="quiz-bar">
        <button className="btn primary" onClick=${checkAll}>${checkLabel}</button>
        <button className="btn" onClick=${reset}>Repetir</button>
        ${message && html`<span className=${'quiz-score ' + (message.tone ?? '')}>${message.text}</span>`}
      </div>
    </div>
  `;
}
