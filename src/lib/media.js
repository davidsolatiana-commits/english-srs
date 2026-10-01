// Imágenes y ejemplos de uso para las palabras.
//
// - Imágenes: Openverse (fotos e ilustraciones con licencia libre) y, para sustantivos, la imagen
//   del artículo de Wikipedia. Se guardan reducidas (JPEG ~480 px) dentro de la base de datos, así
//   funcionan sin conexión y se sincronizan con el resto de datos.
// - Ejemplos: Tatoeba (frases reales con su traducción al español hecha por personas).
// Todo gratis y sin claves; la palabra se envía a esos servicios al buscar.

import { translate } from './translate.js';

const OPENVERSE ='https://api.openverse.org/v1/images/';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const WIKI_SUMMARY ='https://en.wikipedia.org/api/rest_v1/page/summary/';
const TATOEBA = 'https://api.tatoeba.org/unstable/sentences';
const MAX_SIDE = 480;

async function getJSON(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Sin conexión con el servicio de búsqueda.');
  }
  if (res.status === 429) throw new Error('Demasiadas búsquedas seguidas: espera un minuto.');
  if (!res.ok) throw new Error(`El servicio respondió con un error (${res.status}).`);
  return res.json();
}

// ---------- Imágenes ----------

// Candidatas para elegir: [{ thumb, credit }]. `query` puede ser la palabra o algo más preciso.
export async function searchImages(query, { category } = {}) {
  const q = query.trim();
  const results = [];
  if (category === 'sustantivo' && !q.includes(' ')) {
    try {
      const page = await getJSON(WIKI_SUMMARY + encodeURIComponent(q));
      if (page.type === 'standard' && page.thumbnail?.source) {
        results.push({ thumb: page.thumbnail.source, credit: `Wikipedia · ${page.title}` });
      }
    } catch {
      // sin artículo: solo Openverse
    }
  }
  const [openverse, commons] = await Promise.allSettled([
    getJSON(`${OPENVERSE}?q=${encodeURIComponent(q)}&page_size=20&mature=false`),
    getJSON(
      `${COMMONS}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=20` +
        `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q)}&prop=imageinfo&iiprop=url&iiurlwidth=320`,
    ),
  ]);
  if (openverse.status === 'rejected' && commons.status === 'rejected') throw openverse.reason;

  // Variedad: como mucho 2 imágenes del mismo autor (a menudo suben series casi iguales).
  const perCreator = {};
  for (const r of openverse.value?.results ?? []) {
    const who = r.creator || r.source || '?';
    perCreator[who] = (perCreator[who] ?? 0) + 1;
    if (perCreator[who] > 2) continue;
    results.push({
      thumb: r.thumbnail || `${OPENVERSE}${r.id}/thumb/`,
      credit: ['Openverse', r.creator, r.license && `CC ${r.license.toUpperCase()}`].filter(Boolean).join(' · '),
    });
  }
  const pages = Object.values(commons.value?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const thumb = p.imageinfo?.[0]?.thumburl;
    if (thumb) results.push({ thumb, credit: `Wikimedia Commons · ${p.title.replace(/^File:|\.\w+$/g, '')}` });
  }
  // Intercalar las dos fuentes para que las primeras opciones sean variadas.
  const ov = results.filter((r) => !r.credit.startsWith('Wikimedia'));
  const wc = results.filter((r) => r.credit.startsWith('Wikimedia'));
  const mixed = [];
  for (let i = 0; mixed.length < 12 && (i < ov.length || i < wc.length); i++) {
    if (ov[i]) mixed.push(ov[i]);
    if (wc[i] && mixed.length < 12) mixed.push(wc[i]);
  }
  return mixed;
}

// Reduce una imagen (archivo, Blob o URL) a un JPEG pequeño en data URL.
// Si una URL externa no deja copiarse (CORS), se guarda la URL tal cual.
export async function toStoredImage(source) {
  let blob = source;
  if (typeof source === 'string') {
    try {
      const res = await fetch(source);
      if (!res.ok) throw new Error();
      blob = await res.blob();
    } catch {
      return source;
    }
  }
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG con transparencia → fondo blanco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.72);
}

// ---------- Ejemplos ----------

const IRREGULAR = {
  be: 'am|is|are|was|were|been|being',
  have: 'has|had|having',
  do: 'does|did|done|doing',
  go: 'goes|went|gone|going',
  get: 'gets|got|gotten|getting',
  give: 'gives|gave|given|giving',
  take: 'takes|took|taken|taking',
  make: 'makes|made|making',
  come: 'comes|came|coming',
  put: 'puts|putting',
  run: 'runs|ran|running',
  bring: 'brings|brought|bringing',
  keep: 'keeps|kept|keeping',
  set: 'sets|setting',
  break: 'breaks|broke|broken|breaking',
  find: 'finds|found|finding',
  look: 'looks|looked|looking',
  turn: 'turns|turned|turning',
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Expresión que reconoce la palabra y sus formas (achieve → achieved, achieving; give up → gave it up…).
export function wordPattern(word) {
  const tokens = word.toLowerCase().trim().split(/\s+/);
  const form = (t) => {
    if (IRREGULAR[t]) return `(?:${escape(t)}|${IRREGULAR[t]})`;
    if (t.length <= 3) return `${escape(t)}\\w*`;
    return `${escape(t.replace(/(e|y)$/, ''))}\\w*`;
  };
  // En los phrasal verbs puede haber hasta dos palabras en medio (give it up).
  return new RegExp(`\\b${tokens.map(form).join('(?:\\s+\\S+){0,2}?\\s+')}\\b`, 'i');
}

// Frases de ejemplo con traducción: [{ en, es }], las de longitud media primero.
export async function fetchExamples(word, limit = 8) {
  const w = word.trim();
  const q = w.includes(' ') ? `"${w}"` : w;
  const data = await getJSON(
    `${TATOEBA}?lang=eng&trans:lang=spa&sort=relevance&limit=50&q=${encodeURIComponent(q)}`,
  );
  const pattern = wordPattern(w);
  const seen = new Set();
  const all = [];
  for (const s of data.data ?? []) {
    const es = (s.translations ?? []).flat().filter((t) => t.lang === 'spa');
    const best = es.find((t) => t.is_direct) ?? es[0];
    if (!best) continue;
    const key = s.text.toLowerCase().replace(/[^a-z ]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    all.push({ en: s.text, es: best.text, words: s.text.split(/\s+/).length, matches: pattern.test(s.text) });
  }
  // Mejor frases que contengan la palabra y de 6-14 palabras (las de 2-3 enseñan poco).
  const score = (x) => (x.matches ? 0 : 100) + Math.abs(Math.min(Math.max(x.words, 6), 14) - x.words) * 3 + (x.words < 4 ? 20 : 0);
  return all.sort((a, b) => score(a) - score(b)).slice(0, limit).map(({ en, es }) => ({ en, es }));
}

// ---------- Automático ----------

// Completa lo que le falte a una palabra: imagen y/o hasta 3 ejemplos (el primero pasa a ser el
// principal si no tenía). Devuelve { image, examples } con lo añadido.
export async function enrichWord(db, word, { image = true, examples = true } = {}) {
  const added = { image: false, examples: 0 };
  if (image && !word.image) {
    const found = await searchImages(word.word_en, { category: word.category });
    for (const candidate of found.slice(0, 3)) {
      try {
        const stored = await toStoredImage(candidate.thumb);
        await db.updateWord(word.id, { image: stored, image_credit: candidate.credit });
        added.image = true;
        break;
      } catch {
        // esta no se pudo leer: probar la siguiente
      }
    }
  }
  if (examples && word.example_sentence && !word.example_es) {
    try {
      await db.updateWord(word.id, { example_es: await translate(word.example_sentence, 'en', 'es') });
    } catch {
      // sin traducción: no pasa nada
    }
  }
  if (examples) {
    const existing = db.listExamples(word.id);
    if (existing.length === 0) {
      const found = await fetchExamples(word.word_en, 4);
      const known = new Set([word.example_sentence?.toLowerCase()]);
      let rest = found.filter((e) => !known.has(e.en.toLowerCase()));
      if (!word.example_sentence && rest.length) {
        await db.updateWord(word.id, { example_sentence: rest[0].en, example_es: rest[0].es });
        rest = rest.slice(1);
        added.examples++;
      }
      for (const e of rest.slice(0, 3)) {
        await db.addExample(word.id, { ...e, source: 'auto' });
        added.examples++;
      }
    }
  }
  return added;
}
