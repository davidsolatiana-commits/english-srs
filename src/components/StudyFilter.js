import { useState } from 'react';
import { html } from '../lib/html.js';
import { CATEGORIES, CEFR_LEVELS } from '../lib/db.js';
import { DEFAULT_SETTINGS, isStudyFiltered } from '../lib/settings.js';

// '' = palabras sin ese dato (ver studyWhere en db.js).
const GROUPS = [
  { key: 'levels', label: 'Nivel', none: 'Sin nivel', options: () => CEFR_LEVELS },
  { key: 'categories', label: 'Tipo', none: 'Sin tipo', options: () => CATEGORIES },
  { key: 'sources', label: 'Fuente', none: 'Sin fuente', options: (db) => db.sources() },
];

export function studySummary(study) {
  const parts = GROUPS.flatMap((g) =>
    study[g.key].length ? [study[g.key].map((v) => (v === '' ? g.none.toLowerCase() : v)).join(' o ')] : [],
  );
  return parts.join(' · ');
}

// "🎯 Qué palabras estudiar": filtro por nivel, tipo y fuente para toda la práctica.
export function StudyFilter({ db, study, onChange }) {
  const [open, setOpen] = useState(false);
  const filtered = isStudyFiltered(study);
  const count = db.countStudy(study);
  const paused = db.countWords() - db.countStudy({});

  function toggle(key, value) {
    const list = study[key];
    onChange({ ...study, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  }

  return html`
    <div className=${'study-filter' + (filtered ? ' active' : '')}>
      <div className="study-filter-head">
        <span>
          🎯 ${filtered
            ? html`Estudiando: <strong>${studySummary(study)}</strong>`
            : html`Estudiando: <strong>todas las palabras</strong>`}
          <span className="muted"> (${count}${paused > 0 ? `, ${paused} en pausa` : ''})</span>
        </span>
        <span className="study-filter-actions">
          ${filtered &&
          html`<button className="btn small" onClick=${() => onChange({ ...DEFAULT_SETTINGS.study })}>Quitar filtro</button>`}
          <button className="btn small" aria-expanded=${open} onClick=${() => setOpen(!open)}>
            ${open ? 'Cerrar' : 'Personalizar'}
          </button>
        </span>
      </div>

      ${open &&
      html`
        <div className="study-filter-body">
          ${GROUPS.map((g) => {
            const options = g.options(db);
            if (g.key === 'sources' && options.length === 0) return null;
            return html`
              <div className="study-group" key=${g.key}>
                <span className="study-group-label">${g.label}</span>
                <div className="chips">
                  ${[...options, ''].map(
                    (v) => html`
                      <button
                        key=${v || '-'}
                        className=${'chip small' + (study[g.key].includes(v) ? ' selected' : '')}
                        aria-pressed=${study[g.key].includes(v)}
                        onClick=${() => toggle(g.key, v)}
                      >
                        ${v === '' ? g.none : v}
                      </button>
                    `,
                  )}
                </div>
              </div>
            `;
          })}
          <p className="muted study-note">
            Sin nada marcado en un grupo, entran todas. Se aplica al repaso de hoy, a la práctica libre y a la escritura.
            Las palabras que no entran no se pierden: su repaso te espera cuando quites el filtro.
            Para elegir palabras una a una o pausarlas, ve a <strong>Palabras → Seleccionar</strong>.
          </p>
          ${count === 0 && html`<p className="msg error">Ninguna palabra coincide con este filtro.</p>`}
        </div>
      `}
    </div>
  `;
}
