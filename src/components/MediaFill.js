import { useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { enrichWord } from '../lib/media.js';

const PAUSE_MS = 700; // entre palabras, para no saturar los servicios gratuitos

// "Completar imágenes y ejemplos" de las palabras que aún no los tienen.
export function MediaFill({ db, words, exampleCounts, onChange }) {
  const [progress, setProgress] = useState(null); // { done, total, images, examples, error? }
  const stop = useRef(false);

  const noImage = words.filter((w) => !w.image);
  const noExamples = words.filter((w) => !w.example_sentence && !exampleCounts[w.id]);
  const todo = words.filter((w) => !w.image || (!exampleCounts[w.id]));
  const running = progress && progress.done < progress.total && !progress.stopped;

  async function run() {
    stop.current = false;
    const total = todo.length;
    let images = 0;
    let examples = 0;
    let error = null;
    setProgress({ done: 0, total, images, examples });
    for (let i = 0; i < total; i++) {
      if (stop.current) {
        setProgress({ done: i, total, images, examples, stopped: true });
        onChange();
        return;
      }
      try {
        const added = await enrichWord(db, db.getWord(todo[i].id));
        images += added.image ? 1 : 0;
        examples += added.examples;
      } catch (err) {
        error = err.message;
        if (/Demasiadas/.test(error)) {
          setProgress({ done: i, total, images, examples, error, stopped: true });
          onChange();
          return;
        }
      }
      setProgress({ done: i + 1, total, images, examples, error });
      if (i % 5 === 4) onChange();
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
    onChange();
  }

  if (todo.length === 0 && !progress) return null;

  return html`
    <div className="card media-fill">
      <h3>🖼️ Imágenes y ejemplos</h3>
      ${progress
        ? html`
            <div className="progress"><div className="progress-bar" style=${{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}></div></div>
            <p className="muted">
              ${progress.done} / ${progress.total} palabras · ${progress.images} imágenes y ${progress.examples} ejemplos añadidos
              ${progress.stopped ? ' · detenido' : progress.done === progress.total ? ' · ¡terminado!' : ''}
            </p>
            ${progress.error && html`<p className="msg error">${progress.error}</p>`}
          `
        : html`<p className="muted">
            ${noImage.length} ${noImage.length === 1 ? 'palabra' : 'palabras'} sin imagen y ${noExamples.length} sin ejemplos.
            La app puede buscarlos sola; luego puedes cambiar lo que no te guste en la ficha de cada palabra.
          </p>`}
      <div className="empty-actions left">
        ${running
          ? html`<button className="btn small" onClick=${() => (stop.current = true)}>Detener</button>`
          : todo.length > 0 && html`<button className="btn small primary" onClick=${run}>Completar automáticamente (${todo.length})</button>`}
      </div>
    </div>
  `;
}
