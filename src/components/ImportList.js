import { useEffect, useMemo, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { todayISO } from '../lib/dates.js';
import { CEFR_LEVELS } from '../lib/db.js';
import { parseFile, parseText, translatePending } from '../lib/importer.js';
import { groupOptions } from '../lib/groups.js';

const SUBGROUPS = [
  { id: 'none', label: 'Sin subgrupos (los creo yo después)' },
  { id: 'level', label: 'Por nivel (A1, A2, B1…)' },
  { id: 'topic', label: 'Por tema (líneas # Tema de la lista)' },
  { id: 'block', label: 'Por bloques de palabras' },
];
const BLOCK_SIZES = [50, 100, 200, 500];

const nameFromFile = (name) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

// Ventana "Importar lista": leer → revisar → importar → traducir.
export function ImportList({ db, onClose, onChange, onDone }) {
  const [step, setStep] = useState('choose'); // choose → preview → working → done
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(false);
  const groups = useMemo(() => db.listGroups(), [db]);
  const [target, setTarget] = useState('new'); // 'new' | id de un grupo existente
  const [groupName, setGroupName] = useState('');
  const [subgroups, setSubgroups] = useState('none');
  const [blockSize, setBlockSize] = useState(100);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [progress, setProgress] = useState(null); // { phase, done, total }
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && step !== 'working' && onClose();
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [step]);

  async function read(file) {
    setReading(true);
    setError(null);
    try {
      const list = file ? await parseFile(file) : parseText(text);
      if (list.length === 0) throw new Error('No he encontrado palabras. Revisa el formato (una palabra por línea).');
      setEntries(list);
      setGroupName((n) => n || (file ? nameFromFile(file.name) : 'Lista importada'));
      setSubgroups('none');
      setStep('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setFileName(file.name);
      read(file);
    }
  }

  const stats = useMemo(() => {
    if (!entries) return null;
    const existing = new Set(db.listWords().map((w) => w.word_en.toLowerCase()));
    const levels = {};
    const topics = new Set();
    let known = 0;
    let translated = 0;
    for (const e of entries) {
      if (e.cefr_level) levels[e.cefr_level] = (levels[e.cefr_level] ?? 0) + 1;
      if (e.topic) topics.add(e.topic);
      if (existing.has(e.word_en.toLowerCase())) known++;
      if (e.translation_es) translated++;
    }
    return { levels, topics: [...topics], known, translated };
  }, [entries]);

  async function runImport() {
    setStep('working');
    setError(null);
    try {
      const today = todayISO();
      let groupId = target === 'new' ? null : Number(target);
      const name = groupName.trim() || 'Lista importada';
      if (!groupId) groupId = await db.createGroup(name, null, '📚');

      // Subgrupos: se crean los que hagan falta y cada palabra va al suyo.
      const subIds = new Map();
      const keyOf = (e, i) =>
        subgroups === 'level' ? e.cefr_level || 'Sin nivel'
        : subgroups === 'topic' ? e.topic || 'Sin tema'
        : subgroups === 'block' ? `${Math.floor(i / blockSize) * blockSize + 1}–${Math.min((Math.floor(i / blockSize) + 1) * blockSize, entries.length)}`
        : null;
      const keys = entries.map(keyOf);
      for (const k of keys) {
        if (k && !subIds.has(k)) subIds.set(k, await db.createGroup(k, groupId));
      }
      const index = new Map(entries.map((e, i) => [e, i]));
      setProgress({ phase: 'Guardando palabras…', done: 0, total: entries.length });
      const { added, existing } = await db.importWords(entries, {
        groupId,
        source: target === 'new' ? name : null,
        today,
        subgroupOf: (e) => subIds.get(keys[index.get(e)]) ?? null,
      });
      onChange();

      let translated = 0;
      if (autoTranslate) {
        const posByWord = Object.fromEntries(entries.map((e) => [e.word_en.toLowerCase(), e.pos]));
        translated = await translatePending(db, {
          groupId,
          posByWord,
          onProgress: (done, total) => setProgress({ phase: 'Traduciendo…', done, total }),
        });
        onChange();
      }
      setResult({ groupId, added, existing, translated, pending: db.untranslatedWords(groupId).length });
      setStep('done');
    } catch (err) {
      onChange();
      setError(err.message);
      setResult((r) => r ?? { pending: null });
      setStep('done');
    }
  }

  const close = () => step !== 'working' && onClose();

  return html`
    <div className="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && close()}>
      <div className="modal picker import" role="dialog" aria-modal="true" aria-label="Importar lista">
        ${step !== 'working' && html`<button className="icon-btn modal-close" onClick=${onClose} aria-label="Cerrar">✕</button>`}
        <h2>📥 Importar lista de palabras</h2>

        ${step === 'choose' &&
        html`
          <p className="muted picker-sub">
            Sube un PDF, CSV o TXT, o pega la lista. Una palabra por línea; opcionalmente con su traducción y nivel:
            <code>achieve; lograr; B1</code>. Las líneas <code>A1</code>, <code>B2</code>… marcan el nivel de las
            siguientes, y <code># Tema</code> el tema.
          </p>
          <div className="import-choose">
            <button className="btn primary" onClick=${() => fileInput.current?.click()} disabled=${reading}>
              📄 Elegir archivo (PDF, CSV, TXT)
            </button>
            <input ref=${fileInput} type="file" accept=".pdf,.csv,.txt,.tsv,application/pdf,text/plain,text/csv" hidden onChange=${onFile} />
            ${fileName && reading && html`<span className="muted">Leyendo ${fileName}…</span>`}
          </div>
          <textarea
            className="import-text"
            rows="7"
            value=${text}
            onChange=${(e) => setText(e.target.value)}
            placeholder=${'…o pega aquí la lista:\n# Comida\napple; manzana; A1\nbread\nB1\nachieve v.'}
          ></textarea>
          <div className="picker-footer">
            <span></span>
            <button className="btn" onClick=${() => read(null)} disabled=${!text.trim() || reading}>Leer el texto</button>
          </div>
        `}

        ${step === 'preview' &&
        stats &&
        html`
          <p className="import-summary">
            <strong>${entries.length} palabras</strong>
            ${Object.keys(stats.levels).length > 0 &&
            html` · ${CEFR_LEVELS.filter((l) => stats.levels[l]).map((l) => `${l}: ${stats.levels[l]}`).join(' · ')}`}
            ${stats.known > 0 && html`<br /><span className="muted">${stats.known} ya las tienes: no se duplican, solo se añaden al grupo (conservan su progreso).</span>`}
          </p>
          <div className="import-preview">
            <table>
              <thead><tr><th>Inglés</th><th>Tipo</th><th>Nivel</th><th>Español</th></tr></thead>
              <tbody>
                ${entries.slice(0, 40).map(
                  (e) => html`<tr key=${e.word_en}>
                    <td><strong>${e.word_en}</strong></td>
                    <td className="muted">${e.category ?? ''}</td>
                    <td>${e.cefr_level ?? ''}</td>
                    <td className="muted">${e.translation_es || (autoTranslate ? 'se traducirá' : '—')}</td>
                  </tr>`,
                )}
              </tbody>
            </table>
            ${entries.length > 40 && html`<p className="muted hint">…y ${entries.length - 40} más.</p>`}
          </div>

          <div className="import-options">
            <label className="field">
              <span>Guardar en</span>
              <select value=${target} onChange=${(e) => setTarget(e.target.value)}>
                <option value="new">Un grupo nuevo</option>
                ${groupOptions(groups).map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
              </select>
            </label>
            ${target === 'new' &&
            html`<label className="field">
              <span>Nombre del grupo</span>
              <input value=${groupName} onChange=${(e) => setGroupName(e.target.value)} />
            </label>`}
            <label className="field">
              <span>Subgrupos</span>
              <select value=${subgroups} onChange=${(e) => setSubgroups(e.target.value)}>
                ${SUBGROUPS.filter(
                  (s) =>
                    (s.id !== 'level' || Object.keys(stats.levels).length > 1) &&
                    (s.id !== 'topic' || stats.topics.length > 0),
                ).map((s) => html`<option key=${s.id} value=${s.id}>${s.label}</option>`)}
              </select>
            </label>
            ${subgroups === 'block' &&
            html`<label className="field">
              <span>Palabras por bloque</span>
              <select value=${blockSize} onChange=${(e) => setBlockSize(Number(e.target.value))}>
                ${BLOCK_SIZES.map((n) => html`<option key=${n} value=${n}>${n}</option>`)}
              </select>
            </label>`}
            ${stats.translated < entries.length &&
            html`<label className="switch" title="Usa el traductor de Google: las palabras se envían a su servidor">
              <input type="checkbox" checked=${autoTranslate} onChange=${(e) => setAutoTranslate(e.target.checked)} />
              Traducir automáticamente las ${entries.length - stats.translated} que no traen traducción
            </label>`}
            <p className="muted hint">
              Entran todas como palabras nuevas, en el orden de la lista, respetando tu límite de «Nuevas al día».
              Las que añades tú a mano salen antes. Los subgrupos (por tema o como quieras) los puedes crear,
              renombrar y llenar después en Palabras → Grupos.
            </p>
          </div>
          ${error && html`<p className="msg error">${error}</p>`}
          <div className="picker-footer">
            <button className="btn" onClick=${() => setStep('choose')}>Atrás</button>
            <button className="btn primary" onClick=${runImport}>Importar ${entries.length} palabras</button>
          </div>
        `}

        ${step === 'working' &&
        html`
          <p>${progress?.phase ?? 'Importando…'}</p>
          ${progress &&
          html`<div className="progress"><div className="progress-bar" style=${{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}></div></div>
            <p className="muted">${progress.done} / ${progress.total}</p>`}
          <p className="muted hint">No cierres la app hasta que termine.</p>
        `}

        ${step === 'done' &&
        html`
          ${result?.added != null &&
          html`<p className="msg ok">
            ✓ ${result.added} palabras nuevas${result.existing ? ` y ${result.existing} que ya tenías` : ''} en el grupo.
            ${result.translated ? ` ${result.translated} traducidas.` : ''}
          </p>`}
          ${result?.pending > 0 &&
          html`<p className="muted">
            Quedan ${result.pending} sin traducir: no saldrán en la práctica hasta tener traducción. Puedes traducirlas
            luego desde Palabras → Grupos → «Traducir pendientes».
          </p>`}
          ${error && html`<p className="msg error">${error}</p>`}
          <div className="picker-footer">
            <button className="btn" onClick=${onClose}>Cerrar</button>
            ${result?.groupId && html`<button className="btn primary" onClick=${() => onDone(result.groupId)}>Ver el grupo</button>`}
          </div>
        `}
      </div>
    </div>
  `;
}
