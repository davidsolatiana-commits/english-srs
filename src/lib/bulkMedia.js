// Imágenes y ejemplos para muchas palabras a la vez (p. ej. toda la Oxford 3000).
//
// - Imágenes: se guarda el ENLACE a una miniatura (Wikipedia/Wikimedia/Flickr), no la imagen: con
//   miles de palabras, guardarlas dentro haría la base de datos enorme (y lenta de sincronizar).
//   Se ven con conexión. Las palabras gramaticales y conectores no llevan imagen.
// - Ejemplos: frases reales de Tatoeba con traducción, elegidas para que se vean los distintos usos
//   de la palabra (sustantivo, verbo…, con el analizador gramatical) y de distinta longitud.
// Se puede detener y continuar: las palabras ya hechas (o sin resultados) se saltan.

import { fetchExamples, wordPattern } from './media.js';
import { topicOf } from './oxfordTopics.js';

const OPENVERSE = 'https://api.openverse.org/v1/images/';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const TRIED_KEY = 'english-srs:media-tried';
const NO_IMAGE_TOPICS = new Set(['Palabras gramaticales', 'Conectores y adverbios']);
const WORKERS = 3;
const SAVE_EVERY = 20;

// ---------- Estado del trabajo (uno a la vez, sobrevive a cambiar de pantalla) ----------

let job = null; // { total, done, images, examples, running, stop, error }
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
export const getMediaJob = () => job;
export function subscribeMediaJob(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function stopMediaJob() {
  if (job?.running) job.stop = true;
}

function loadTried() {
  try {
    return new Set(JSON.parse(localStorage.getItem(TRIED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function saveTried(set) {
  try {
    localStorage.setItem(TRIED_KEY, JSON.stringify([...set]));
  } catch {
    // sin localStorage se reintentará la próxima vez
  }
}

// ---------- Imágenes (enlace a una miniatura) ----------

async function json(url) {
  const res = await fetch(url);
  if (res.status === 429 || res.status === 401) {
    const err = new Error('rate');
    err.rate = true;
    throw err;
  }
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

// Miniatura de ~320 px a partir de la URL original.
function thumbUrl(url) {
  const flickr = url.match(/^(https:\/\/live\.staticflickr\.com\/.+?)(?:_[a-z])?\.(jpg|png)$/i);
  if (flickr) return `${flickr[1]}_n.${flickr[2]}`;
  const commons = url.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(\w)\/(\w\w)\/([^/]+)$/);
  if (commons) return `https://upload.wikimedia.org/wikipedia/commons/thumb/${commons[1]}/${commons[2]}/${commons[3]}/320px-${commons[3]}`;
  return null;
}

let openverseOff = false; // si Openverse limita las peticiones, se sigue solo con Wikimedia

async function findImage(word) {
  const q = word.word_en.trim();
  // 1) Sustantivos: la imagen del artículo de Wikipedia suele ser la más representativa.
  if (word.category === 'sustantivo' && !q.includes(' ')) {
    try {
      const page = await json(WIKI_SUMMARY + encodeURIComponent(q.toLowerCase()));
      if (page.type === 'standard' && page.thumbnail?.source) {
        return { image: page.thumbnail.source, credit: `Wikipedia · ${page.title}` };
      }
    } catch {
      // sin artículo
    }
  }
  // 2) Openverse (fotos etiquetadas por personas: mejor para verbos y adjetivos).
  if (!openverseOff) {
    try {
      const data = await json(`${OPENVERSE}?q=${encodeURIComponent(q)}&page_size=10&mature=false`);
      for (const r of data.results ?? []) {
        const thumb = r.url && thumbUrl(r.url);
        if (thumb) {
          return {
            image: thumb,
            credit: ['Openverse', r.creator, r.license && `CC ${r.license.toUpperCase()}`].filter(Boolean).join(' · '),
          };
        }
      }
    } catch (err) {
      if (err.rate) openverseOff = true;
    }
  }
  // 3) Wikimedia Commons.
  try {
    const data = await json(
      `${COMMONS}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=5` +
        `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q)}&prop=imageinfo&iiprop=url&iiurlwidth=320`,
    );
    const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const p = pages.find((x) => x.imageinfo?.[0]?.thumburl);
    if (p) return { image: p.imageinfo[0].thumburl, credit: `Wikimedia Commons · ${p.title.replace(/^File:|\.\w+$/g, '')}` };
  } catch {
    // nada
  }
  return null;
}

// ---------- Ejemplos con distintos usos ----------

// El analizador (compromise) se carga solo al usarlo: pesa y no hace falta para arrancar la app.
let nlpPromise;
const loadNlp = () => (nlpPromise ??= import('compromise').then((m) => m.default));

// Uso gramatical de la palabra en la frase: Verb, Noun, Adjective, Adverb u Other.
function usageIn(nlp, sentence, pattern) {
  const doc = nlp(sentence);
  for (const t of doc.json({ terms: { normal: true } })[0]?.terms ?? []) {
    if (!pattern.test(t.text)) continue;
    for (const tag of ['Verb', 'Noun', 'Adjective', 'Adverb']) if (t.tags.includes(tag)) return tag;
    return 'Other';
  }
  return 'Other';
}

export async function diverseExamples(word, n = 3) {
  let candidates = await fetchExamples(word.word_en, 20);
  // Con dos significados ("libro / reservar"), buscar también el uso como verbo y como sustantivo,
  // que si no suele quedar fuera.
  if (word.translation_es?.includes(' / ') && !word.word_en.includes(' ')) {
    const seen = new Set(candidates.map((c) => c.en));
    for (const q of [`to ${word.word_en}`, `the ${word.word_en}`]) {
      try {
        for (const c of await fetchExamples(q, 5)) if (!seen.has(c.en)) (seen.add(c.en), candidates.push(c));
      } catch {
        // sin resultados extra
      }
    }
  }
  if (candidates.length <= 1) return candidates;
  const multiword = word.word_en.trim().includes(' ');
  const pattern = multiword ? null : wordPattern(word.word_en);
  const nlp = pattern ? await loadNlp() : null;
  const tagged = candidates.map((c) => ({
    ...c,
    use: pattern ? usageIn(nlp, c.en, pattern) : 'Other',
    len: c.en.split(/\s+/).length,
  }));
  const picked = [];
  const uses = new Set();
  // Primero, una frase por cada uso distinto (p. ej. "book" como sustantivo y como verbo).
  for (const c of tagged) {
    if (picked.length >= n) break;
    if (!uses.has(c.use)) {
      uses.add(c.use);
      picked.push(c);
    }
  }
  // Después, completar con frases de longitud distinta a las ya elegidas.
  for (const c of tagged) {
    if (picked.length >= n) break;
    if (!picked.includes(c) && !picked.some((p) => Math.abs(p.len - c.len) < 3)) picked.push(c);
  }
  for (const c of tagged) {
    if (picked.length >= n) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.map(({ en, es }) => ({ en, es }));
}

// ---------- Trabajo ----------

// ids: palabras a completar. Devuelve cuando termina (o se detiene).
export async function runMediaJob(db, ids, { images = true, examples = true, onChange } = {}) {
  if (job?.running) return job;
  const tried = loadTried();
  const exampleCounts = db.exampleCounts();
  const queue = db
    .wordsByIds(ids)
    .filter(
      (w) =>
        w.translation_es &&
        ((images && !w.image && !tried.has(`${w.id}:img`) && !NO_IMAGE_TOPICS.has(topicOf(w).name)) ||
          (examples && !exampleCounts[w.id] && !tried.has(`${w.id}:ex`))),
    );
  job = { total: queue.length, done: 0, images: 0, examples: 0, running: true, stop: false, error: null };
  emit();

  let next = 0;
  async function one(w) {
    if (images && !w.image && !tried.has(`${w.id}:img`) && !NO_IMAGE_TOPICS.has(topicOf(w).name)) {
      const found = await findImage(w);
      if (found) {
        await db.updateWord(w.id, { image: found.image, image_credit: found.credit });
        job.images++;
      } else tried.add(`${w.id}:img`);
    }
    if (examples && !exampleCounts[w.id] && !tried.has(`${w.id}:ex`)) {
      try {
        const list = await diverseExamples(w, 3);
        if (list.length === 0) tried.add(`${w.id}:ex`);
        let rest = list;
        if (!w.example_sentence && rest.length) {
          await db.updateWord(w.id, { example_sentence: rest[0].en, example_es: rest[0].es });
          rest = rest.slice(1);
          job.examples++;
        }
        for (const e of rest) {
          await db.addExample(w.id, { ...e, source: 'auto' });
          job.examples++;
        }
      } catch (err) {
        if (/Demasiadas/.test(err.message)) throw err; // Tatoeba pide pausa: parar
      }
    }
  }

  // Por tandas de SAVE_EVERY palabras (WORKERS a la vez); cada tanda se guarda de una vez.
  while (!job.stop && next < queue.length) {
    const end = Math.min(next + SAVE_EVERY, queue.length);
    const worker = async () => {
      while (!job.stop && next < end) {
        const w = queue[next++];
        try {
          await one(w);
        } catch (err) {
          job.error = err.message;
          job.stop = true;
        }
        job.done++;
        emit();
        await new Promise((r) => setTimeout(r, 200)); // sin saturar los servicios gratuitos
      }
    };
    await db.batch(() => Promise.all(Array.from({ length: WORKERS }, worker)));
    saveTried(tried);
    onChange?.();
  }
  job.running = false;
  saveTried(tried);
  emit();
  onChange?.();
  return job;
}
