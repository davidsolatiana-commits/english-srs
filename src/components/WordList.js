import { useMemo, useState } from 'react';
import { html } from '../lib/html.js';
import { relativeDay, todayISO } from '../lib/dates.js';
import { Backup } from './Backup.js';
import { SyncCard } from './Sync.js';
import { DictLink, SpeakButton } from './WordTools.js';

export function WordList({ db, onChange, version, onWrite }) {
  const [query, setQuery] = useState('');
  const words = useMemo(() => db.listWords(), [db, version]);
  const today = todayISO();

  const q = query.trim().toLowerCase();
  const visible = q
    ? words.filter((w) => w.word_en.toLowerCase().includes(q) || w.translation_es.toLowerCase().includes(q))
    : words;

  async function remove(w) {
    if (!confirm(`¿Borrar «${w.word_en}»?`)) return;
    await db.deleteWord(w.id);
    onChange();
  }

  const backup = html`<${SyncCard} /><${Backup} db=${db} onChange=${onChange} wordCount=${words.length} />`;

  if (words.length === 0) {
    return html`
      <div className="card empty">Todavía no has añadido ninguna palabra.</div>
      ${backup}
    `;
  }

  return html`
    <section>
      <div className="list-head">
        <input
          className="search"
          type="search"
          value=${query}
          onChange=${(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
        />
        <span className="muted">${visible.length} de ${words.length}</span>
      </div>

      <ul className="word-list">
        ${visible.map((w) => {
          const due = w.next_review_date <= today;
          return html`
            <li className="word-item" key=${w.id}>
              <div className="word-main">
                <div>
                  <strong>${w.word_en}</strong>
                  <${SpeakButton} text=${w.word_en} />
                  <span className="muted"> — ${w.translation_es}</span>
                </div>
                ${w.example_sentence &&
                html`<div className="example">${w.example_sentence} <${SpeakButton} text=${w.example_sentence} /></div>`}
                <div className="meta">
                  <${DictLink} word=${w.word_en} />
                  ${w.cefr_level && html`<span className="tag level">${w.cefr_level}</span>`}
                  ${w.category && html`<span className="tag">${w.category}</span>`}
                  ${w.source && html`<span className="tag source">${w.source}</span>`}
                  ${w.first_review_date
                    ? html`<span className=${'review' + (due ? ' due' : '')}>
                        Repaso: ${relativeDay(w.next_review_date, today)}
                      </span>`
                    : html`<span className="review due">Nueva</span>`}
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="icon-btn write"
                  title="Practicar su escritura"
                  aria-label=${`Practicar la escritura de ${w.word_en}`}
                  onClick=${() => onWrite(w.id)}
                >
                  ✍️
                </button>
                <button className="icon-btn" title="Borrar" aria-label=${`Borrar ${w.word_en}`} onClick=${() => remove(w)}>
                  ✕
                </button>
              </div>
            </li>
          `;
        })}
      </ul>
    </section>
    ${backup}
  `;
}
