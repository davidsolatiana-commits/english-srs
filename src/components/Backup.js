import { useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { diffDays, todayISO } from '../lib/dates.js';

const LAST_EXPORT_KEY = 'english-srs:last-export';
const REMIND_AFTER_DAYS = 7;

function readLastExport() {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

function writeLastExport(iso) {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, iso);
  } catch {
    // Sin localStorage solo perdemos el recordatorio.
  }
}

function lastExportText(iso, today) {
  if (!iso) return 'nunca';
  const n = diffDays(iso, today);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  return `hace ${n} días`;
}

export function Backup({ db, onChange, wordCount }) {
  const [lastExport, setLastExport] = useState(readLastExport);
  const [message, setMessage] = useState(null);
  const fileInput = useRef(null);
  const today = todayISO();
  const phraseCount = db.countPhrases();
  const noteCount = db.countNotes();
  const isEmpty = wordCount === 0 && phraseCount === 0 && noteCount === 0;

  const overdue = !isEmpty && (!lastExport || diffDays(lastExport, today) >= REMIND_AFTER_DAYS);

  function exportDb() {
    const blob = new Blob([db.exportFile()], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-srs-${today}.sqlite`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    writeLastExport(today);
    setLastExport(today);
    setMessage({ type: 'ok', text: `Copia descargada (${wordCount} palabras, ${phraseCount} frases y ${noteCount} notas).` });
  }

  async function importDb(e) {
    const file = e.target.files[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    let backup;
    try {
      backup = db.readBackup(new Uint8Array(await file.arrayBuffer()));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: `No se pudo leer la copia: ${err.message}` });
      return;
    }

    const question =
      `Vas a sustituir tus ${wordCount} palabras, ${phraseCount} frases y ${noteCount} notas por las ` +
      `${backup.wordCount} palabras, ${backup.phraseCount} frases y ${backup.noteCount} notas de «${file.name}».\n\n` +
      'Lo que tienes ahora en este dispositivo se perderá. ¿Continuar?';
    if (!isEmpty && !confirm(question)) {
      backup.discard();
      return;
    }

    try {
      await backup.apply();
      setMessage({
        type: 'ok',
        text: `Copia restaurada: ${backup.wordCount} palabras, ${backup.phraseCount} frases y ${backup.noteCount} notas.`,
      });
      onChange();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: `No se pudo restaurar: ${err.message}` });
    }
  }

  return html`
    <section className="card backup">
      <h2>Copia de seguridad</h2>
      <p className="muted">
        Tus palabras, frases y notas se guardan solo en este navegador. Descarga una copia de vez en cuando y úsala para
        restaurarlas o pasarlas a otro dispositivo.
      </p>
      <p className=${'last-export' + (overdue ? ' overdue' : '')}>Última copia: ${lastExportText(lastExport, today)}</p>

      <div className="actions">
        <button className="btn primary" onClick=${exportDb} disabled=${isEmpty}>Descargar copia</button>
        <button className="btn" onClick=${() => fileInput.current.click()}>Restaurar copia…</button>
        <input ref=${fileInput} type="file" hidden onChange=${importDb} />
      </div>
      ${message && html`<p className=${'msg ' + message.type} role="status">${message.text}</p>`}
    </section>
  `;
}
