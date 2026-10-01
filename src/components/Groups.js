import { useMemo, useState, useSyncExternalStore } from 'react';
import { html } from '../lib/html.js';
import { flattenTree, groupLabel, groupOptions } from '../lib/groups.js';
import { translatePending } from '../lib/importer.js';
import { organizeByTopics } from '../lib/oxfordTopics.js';
import { getMediaJob, runMediaJob, stopMediaJob, subscribeMediaJob } from '../lib/bulkMedia.js';
import { ImportList } from './ImportList.js';

function GroupProgress({ g }) {
  const learning = g.total - g.fresh - g.mastered;
  const pct = (n) => `${(n / Math.max(g.total, 1)) * 100}%`;
  return html`
    <div className="group-bar" title=${`${g.mastered} dominadas · ${learning} aprendiendo · ${g.fresh} sin empezar`}>
      <span className="seg mastered" style=${{ width: pct(g.mastered) }}></span>
      <span className="seg learning" style=${{ width: pct(learning) }}></span>
    </div>
    <span className="muted group-stats">
      ${g.total} palabras · ${g.mastered} dominadas · ${learning} aprendiendo
      ${g.untranslated > 0 && html` · <span className="warn-text">${g.untranslated} sin traducir</span>`}
    </span>
  `;
}

// Imágenes y ejemplos para todas las palabras del grupo (tarea larga, se puede detener y seguir).
function MediaJobButton({ db, g, onChange }) {
  const job = useSyncExternalStore(subscribeMediaJob, getMediaJob);
  if (job?.running) {
    return html`<span className="media-job">
      <span className="muted">🖼 ${job.done} / ${job.total} · ${job.images} imágenes · ${job.examples} ejemplos</span>
      <button className="btn small" onClick=${stopMediaJob} disabled=${job.stop}>${job.stop ? 'Deteniendo…' : 'Detener'}</button>
    </span>`;
  }
  return html`
    <button
      className="btn small"
      title="Busca una imagen y 3 frases de ejemplo para cada palabra que no las tenga. Tarda (unos 20-30 min para 3000 palabras): puedes detenerlo y seguir otro día."
      onClick=${() => runMediaJob(db, db.groupWordIds(g.id), { onChange })}
    >
      🖼 Imágenes y ejemplos para todo el grupo
    </button>
    ${job && !job.running &&
    html`<span className="muted">
      Última vez: ${job.images} imágenes y ${job.examples} ejemplos en ${job.done} palabras${job.error ? ` (parado: ${job.error})` : ''}.
    </span>`}
  `;
}

function GroupEditor({ db, g, groups, onChange, onClose }) {
  const [name, setName] = useState(g.name);
  const [emoji, setEmoji] = useState(g.emoji ?? '');
  const [sub, setSub] = useState('');
  const [msg, setMsg] = useState(null);
  const [translating, setTranslating] = useState(null);
  const [working, setWorking] = useState(null);

  async function organize() {
    const ok = confirm(
      `Se crearán subgrupos por tema dentro de «${g.name}» (comida, deportes, emociones…) y las palabras nuevas ` +
        'pasarán a llegarte por nivel y, dentro de cada nivel, tema a tema. Tu progreso no cambia. ¿Seguimos?',
    );
    if (!ok) return;
    setWorking('Organizando por temas…');
    try {
      const r = await organizeByTopics(db, g.id);
      setWorking(`✓ ${r.words} palabras repartidas en ${r.topics} temas.`);
      onChange();
    } catch (err) {
      setWorking(null);
      setMsg(err.message);
    }
  }

  async function save() {
    if (!name.trim()) return;
    await db.updateGroup(g.id, { name: name.trim(), emoji: emoji.trim() });
    onChange();
    onClose();
  }

  async function addSub(e) {
    e.preventDefault();
    if (!sub.trim()) return;
    await db.createGroup(sub.trim(), g.id);
    setSub('');
    onChange();
  }

  async function move(parent) {
    try {
      await db.updateGroup(g.id, { parentId: parent ? Number(parent) : null });
      onChange();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function translate() {
    try {
      await translatePending(db, { groupId: g.id, onProgress: (done, total) => setTranslating(`${done} / ${total}`) });
      setTranslating(null);
      onChange();
    } catch (err) {
      setTranslating(null);
      setMsg(err.message);
      onChange();
    }
  }

  async function remove(withWords) {
    const question = withWords
      ? `¿Borrar «${g.name}», sus subgrupos y las palabras que llegaron con la lista importada (con su progreso)? ` +
        'Las que añadiste tú a mano y las que estén también en otro grupo se conservan. No se puede deshacer.'
      : `¿Borrar el grupo «${g.name}» y sus subgrupos? Las palabras NO se borran.`;
    if (!confirm(question)) return;
    await db.deleteGroup(g.id, { withWords });
    onChange();
  }

  // No se puede mover dentro de sí mismo ni de sus subgrupos.
  const inside = new Set([g.id]);
  for (const x of flattenTree(groups)) if (inside.has(x.parent_id)) inside.add(x.id);
  const parents = groupOptions(groups).filter((o) => !inside.has(Number(o.value)));

  return html`
    <div className="group-editor">
      <div className="group-editor-row">
        <input className="emoji-input" value=${emoji} onChange=${(e) => setEmoji(e.target.value)} placeholder="🙂" maxLength="4" aria-label="Emoji" />
        <input value=${name} onChange=${(e) => setName(e.target.value)} aria-label="Nombre del grupo" />
        <button className="btn small primary" onClick=${save}>Guardar</button>
      </div>
      <form className="group-editor-row" onSubmit=${addSub}>
        <input value=${sub} onChange=${(e) => setSub(e.target.value)} placeholder="Nuevo subgrupo (p. ej. Comida)" />
        <button className="btn small" type="submit" disabled=${!sub.trim()}>＋ Subgrupo</button>
      </form>
      <label className="group-editor-row">
        <span className="muted">Dentro de</span>
        <select value=${g.parent_id ?? ''} onChange=${(e) => move(e.target.value)}>
          <option value="">— (grupo principal)</option>
          ${parents.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
      </label>
      <div className="group-editor-row">
        <button className="btn small" onClick=${organize} disabled=${!!working}>🗂 Organizar por temas</button>
        <${MediaJobButton} db=${db} g=${g} onChange=${onChange} />
      </div>
      ${working && html`<p className="muted">${working}</p>`}
      <div className="group-editor-row">
        ${g.untranslated > 0 &&
        html`<button className="btn small" onClick=${translate} disabled=${!!translating}>
          ${translating ? `Traduciendo ${translating}…` : `Traducir pendientes (${g.untranslated})`}
        </button>`}
        <button className="btn small danger" onClick=${() => remove(false)}>Borrar grupo</button>
        <button className="btn small danger" onClick=${() => remove(true)}>Borrar grupo y sus palabras importadas</button>
      </div>
      ${msg && html`<p className="msg error">${msg}</p>`}
    </div>
  `;
}

// Pestaña Palabras → Grupos.
export function Groups({ db, version, onChange, onStudy, onShowWords }) {
  const groups = useMemo(() => db.listGroups(), [db, version]);
  const tree = flattenTree(groups);
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState('');
  const [importing, setImporting] = useState(false);
  // Subgrupos plegados (ids de los grupos cuyo contenido se oculta).
  const [collapsed, setCollapsed] = useState(() => new Set());

  async function create(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await db.createGroup(newName.trim());
    setNewName('');
    onChange();
  }

  const hasChildren = new Set(groups.map((g) => g.parent_id).filter(Boolean));
  const hidden = new Set();
  for (const g of tree) if (collapsed.has(g.parent_id) || hidden.has(g.parent_id)) hidden.add(g.id);

  function toggle(id) {
    const next = new Set(collapsed);
    next.has(id) ? next.delete(id) : next.add(id);
    setCollapsed(next);
  }

  return html`
    <section className="groups">
      <div className="groups-actions">
        <form className="group-new" onSubmit=${create}>
          <input value=${newName} onChange=${(e) => setNewName(e.target.value)} placeholder="Nombre del grupo nuevo…" />
          <button className="btn small primary" type="submit" disabled=${!newName.trim()}>＋ Crear grupo</button>
        </form>
        <button className="btn small" onClick=${() => setImporting(true)}>📥 Importar lista</button>
      </div>

      ${tree.length === 0
        ? html`<div className="card empty">
            <h2>Aún no tienes grupos</h2>
            <p className="muted">
              Crea uno (p. ej. «Viaje» o «Trabajo») o importa una lista como la Oxford 3000. Para meter palabras en un
              grupo: Lista → Seleccionar → «Añadir a grupo».
            </p>
          </div>`
        : html`<ul className="group-list">
            ${tree
              .filter((g) => !hidden.has(g.id))
              .map(
                (g) => html`
                  <li key=${g.id} className="group-item" style=${{ marginLeft: `${g.depth * 18}px` }}>
                    <div className="group-head">
                      ${hasChildren.has(g.id)
                        ? html`<button className="icon-btn" onClick=${() => toggle(g.id)} aria-label=${collapsed.has(g.id) ? 'Mostrar subgrupos' : 'Ocultar subgrupos'}>
                            ${collapsed.has(g.id) ? '▸' : '▾'}
                          </button>`
                        : html`<span className="group-spacer"></span>`}
                      <strong className="group-name">${groupLabel(g)}</strong>
                      <span className="group-buttons">
                        <button className="btn small primary" onClick=${() => onStudy(g.id)} disabled=${g.total === 0}>🎯 Estudiar</button>
                        <button className="btn small" onClick=${() => onShowWords(g.id)}>Ver</button>
                        <button
                          className="icon-btn"
                          title="Editar, subgrupos, borrar…"
                          aria-label=${`Editar ${g.name}`}
                          onClick=${() => setEditing(editing === g.id ? null : g.id)}
                        >
                          ⋯
                        </button>
                      </span>
                    </div>
                    <${GroupProgress} g=${g} />
                    ${editing === g.id &&
                    html`<${GroupEditor} db=${db} g=${g} groups=${groups} onChange=${onChange} onClose=${() => setEditing(null)} />`}
                  </li>
                `,
              )}
          </ul>
          <p className="muted hint">
            Para meter palabras en un grupo o subgrupo: Lista → Seleccionar → «Añadir a grupo». Una palabra puede estar
            en varios grupos.
          </p>`}

      ${importing &&
      html`<${ImportList}
        db=${db}
        onClose=${() => setImporting(false)}
        onChange=${onChange}
        onDone=${(id) => {
          setImporting(false);
          onShowWords(id);
        }}
      />`}
    </section>
  `;
}
