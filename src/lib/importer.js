// Importar listas de palabras (PDF, CSV/TXT o texto pegado) y traducirlas por lotes.
//
// Formatos de texto admitidos, una palabra por línea:
//   achieve                     → solo la palabra (se traduce sola)
//   achieve; lograr; B1         → separada por ; o tabulador (también "achieve = lograr", "achieve - lograr")
//   achieve v.                  → con categoría al final (como la Oxford 3000)
//   A1  /  B2                   → una línea con solo el nivel: se aplica a las siguientes
//   # Comida   o   [Comida]     → una línea de tema: las siguientes van a ese subgrupo
// Los PDF a columnas (como "The Oxford 3000 by CEFR level") se leen en orden de columna.

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
// Traductor de Google sin clave (el que usa la extensión del navegador): admite muchas líneas
// por petición, así que 3000 palabras son unas 40 peticiones. No es un servicio oficial.
const GTX = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=';

const P =
  '(?:n\\.|v\\.|adj\\.|adv\\.|prep\\.|conj\\.|pron\\.|det\\.|number|exclam\\.|modal v\\.|auxiliary v\\.|' +
  'linking v\\.|phr\\. v\\.|phrasal verb|(?:in)?definite article|infinitive marker|ordinal number)';
const POS_ONLY = new RegExp(`^${P}(?:\\s*[/,]\\s*${P})*\\s*[/,]?$`, 'i');
const TRAILING_POS = new RegExp(`^(.*?\\S)\\s+(${P}(?:\\s*[/,]\\s*${P})*\\s*[/,]?)$`, 'i');
const LEVEL = /^(A1|A2|B1|B2|C1|C2)$/i;
const TOPIC = /^\s*(?:#+\s*(.+?)|\[(.+?)\])\s*$/;

const splitPos = (s) => s.split(/\s*[/,]\s*/).map((x) => x.trim().toLowerCase()).filter(Boolean);

// Categoría de la app a partir de la categoría gramatical inglesa.
const POS_CATEGORY = [
  [/^(modal |auxiliary |linking )?v\.$/, 'verbo'],
  [/^(phr\. v\.|phrasal verb)$/, 'phrasal verb'],
  [/^n\.$/, 'sustantivo'],
  [/^adj\.$/, 'adjetivo'],
  [/^adv\.$/, 'adverbio'],
  [/^prep\.$/, 'preposición'],
];
export function categoryFromPos(pos = []) {
  for (const p of pos) for (const [re, cat] of POS_CATEGORY) if (re.test(p)) return cat;
  return pos.length ? 'otro' : null;
}

// Limpia la palabra: "second1 (next after the first)" → "second"; guarda el sentido aparte.
function cleanWord(raw) {
  const sense = raw.match(/\((.*?)\)/)?.[1] ?? null;
  const word = raw
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/([a-z])\d+\b/gi, '$1')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return { word, sense };
}

// Quita duplicados (misma palabra en dos niveles: se queda el primero y se juntan categorías).
function dedupe(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.word_en.toLowerCase();
    const prev = map.get(key);
    if (!prev) map.set(key, { ...e, pos: [...(e.pos ?? [])] });
    else {
      for (const p of e.pos ?? []) if (!prev.pos.includes(p)) prev.pos.push(p);
      prev.translation_es ||= e.translation_es;
      prev.cefr_level ||= e.cefr_level;
    }
  }
  return [...map.values()].map((e) => ({ ...e, category: e.category || categoryFromPos(e.pos) }));
}

// ---------- Texto ----------

export function parseText(text, { csv = false } = {}) {
  const entries = [];
  let level = null;
  let topic = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (LEVEL.test(line)) {
      level = line.toUpperCase();
      continue;
    }
    const t = line.match(TOPIC);
    if (t) {
      topic = (t[1] ?? t[2]).trim();
      continue;
    }
    let fields;
    if (line.includes('\t')) fields = line.split('\t');
    else if (line.includes(';')) fields = line.split(';');
    else if (/\s[=–—-]\s/.test(line)) fields = line.split(/\s[=–—-]\s/);
    else if (csv && line.includes(',')) fields = line.split(',');
    else fields = [line];
    fields = fields.map((f) => f.trim().replace(/^"|"$/g, '')).filter((f, i) => f || i === 0);

    let [first, ...rest] = fields;
    let pos = [];
    const m = first.match(TRAILING_POS);
    if (m) {
      first = m[1];
      pos = splitPos(m[2]);
    }
    let entryLevel = level;
    let translation = '';
    for (const f of rest) {
      if (LEVEL.test(f)) entryLevel = f.toUpperCase();
      else if (POS_ONLY.test(f)) pos.push(...splitPos(f));
      else if (!translation) translation = f;
    }
    const { word } = cleanWord(first);
    if (!word || word.length > 60 || !/[a-z]/i.test(word)) continue;
    entries.push({ word_en: word, translation_es: translation, cefr_level: entryLevel, pos, topic });
  }
  return dedupe(entries);
}

// ---------- PDF ----------

let pdfjsPromise;
function loadPdfJs() {
  pdfjsPromise ??= import(PDFJS + 'pdf.min.mjs').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
    return lib;
  });
  return pdfjsPromise;
}

// Trozos de texto de cada página en orden de lectura (columna por columna, de arriba abajo).
async function pdfEntries(data) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data }).promise;
  const out = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    const lines = {};
    for (const it of content.items) {
      if (!it.str.trim()) continue;
      (lines[Math.round(it.transform[5])] ??= []).push({ x: it.transform[4], w: it.width, s: it.str.trim() });
    }
    const page = [];
    for (const [y, items] of Object.entries(lines)) {
      items.sort((a, b) => a.x - b.x);
      let cur = null;
      for (const it of items) {
        if (it.s === ',' || it.s === '/') continue;
        if (POS_ONLY.test(it.s)) {
          if (cur) cur.pos.push(...splitPos(it.s));
          else page.push((cur = { x: it.x, y: +y, text: null, pos: splitPos(it.s) }));
          continue;
        }
        // Trozos pegados de la misma entrada ("a" + ", an").
        if (cur?.text && cur.pos.length === 0 && it.x - cur.xEnd < 6) {
          cur.text += ' ' + it.s;
          cur.xEnd = it.x + it.w;
          continue;
        }
        const m = it.s.match(TRAILING_POS);
        cur = { x: it.x, xEnd: it.x + it.w, y: +y, text: m ? m[1] : it.s, pos: m ? splitPos(m[2]) : [] };
        page.push(cur);
      }
    }
    // Columnas: posiciones x donde empiezan muchas entradas.
    const freq = {};
    for (const e of page) if (e.text) freq[Math.round(e.x)] = (freq[Math.round(e.x)] ?? 0) + 1;
    const cols = Object.entries(freq)
      .filter(([, n]) => n >= 3)
      .map(([k]) => +k)
      .sort((a, b) => a - b);
    for (const e of page) e.col = cols.filter((c) => c <= e.x + 2).pop() ?? 0;
    page.sort((a, b) => a.col - b.col || b.y - a.y);
    out.push(...page);
  }
  return out;
}

export async function parsePdf(file) {
  const raw = await pdfEntries(new Uint8Array(await file.arrayBuffer()));
  // Categoría partida en la línea siguiente → a la entrada anterior.
  const merged = [];
  for (const e of raw) {
    if (!e.text) {
      if (merged.length) merged[merged.length - 1].pos.push(...e.pos);
    } else merged.push(e);
  }
  const withPos = merged.filter((e) => e.pos.length).length;
  if (withPos < 10) {
    // No es una lista con categorías: leer el texto línea a línea.
    return parseText(merged.map((e) => e.text + (e.pos.length ? ' ' + e.pos.join(', ') : '')).join('\n'));
  }
  const entries = [];
  let level = null;
  for (const e of merged) {
    if (LEVEL.test(e.text)) {
      level = e.text.toUpperCase();
      continue;
    }
    if (!e.pos.length) continue; // títulos, pies de página, números de página
    const { word, sense } = cleanWord(e.text);
    if (word) entries.push({ word_en: word, translation_es: '', cefr_level: level, pos: e.pos, sense, topic: null });
  }
  return dedupe(entries);
}

export async function parseFile(file) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return parsePdf(file);
  return parseText(await file.text(), { csv: /\.csv$/i.test(file.name) });
}

// ---------- Traducción por lotes ----------

const KIND_OF_POS = (p) =>
  /v\.$/.test(p) && !/adv\./.test(p) ? 'verb' : p === 'n.' ? 'noun' : p === 'adj.' ? 'adj' : 'other';
const KIND_OF_CATEGORY = { verbo: 'verb', sustantivo: 'noun', adjetivo: 'adj' };

// Con contexto la traducción acierta mucho más: "to book" → reservar, "the book" → libro.
const HINT = { verb: (w) => `to ${w}`, noun: (w) => `the ${w}`, adj: (w) => `very ${w}`, other: (w) => w };

function cleanTranslation(t, kind, word) {
  let s = t.trim().replace(/[.;:!¡¿?]+$/, '').trim();
  if (kind === 'noun') s = s.replace(/^(el|la|los|las|lo|un|una|unos|unas)\s+/i, '');
  if (kind === 'verb') s = s.replace(/^(para|a)\s+/i, '');
  if (kind === 'adj') s = /^muy\s+/i.test(s) ? s.replace(/^muy\s+/i, '') : null;
  if (s && /^[a-z]/.test(word) && /^\p{Lu}\p{Ll}/u.test(s)) s = s[0].toLowerCase() + s.slice(1);
  return s || null;
}

async function gtx(lines) {
  let res;
  try {
    res = await fetch(GTX + encodeURIComponent(lines.join('\n')));
  } catch {
    throw new Error('Sin conexión con el traductor.');
  }
  if (res.status === 429) throw new Error('El traductor pide una pausa: espera unos minutos y pulsa «Traducir pendientes».');
  if (!res.ok) throw new Error(`El traductor respondió con un error (${res.status}).`);
  const data = await res.json();
  return data[0].map((s) => s[0]).join('').split('\n');
}

// Traduce líneas en lotes; si un lote no devuelve las mismas líneas, se parte en dos.
async function translateLines(lines, onBatch) {
  const out = new Array(lines.length);
  async function run(start, end) {
    const chunk = lines.slice(start, end);
    const result = await gtx(chunk);
    if (result.length === chunk.length) {
      result.forEach((r, i) => (out[start + i] = r));
      onBatch?.(end - start);
    } else if (chunk.length === 1) {
      out[start] = result.join(' ');
      onBatch?.(1);
    } else {
      const mid = start + Math.floor(chunk.length / 2);
      await run(start, mid);
      await run(mid, end);
    }
  }
  const SIZE = 80;
  for (let i = 0; i < lines.length; i += SIZE) {
    await run(i, Math.min(i + SIZE, lines.length));
    await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}

// Traduce y guarda las palabras sin traducción (de un grupo o todas) por tandas, para no perder lo
// hecho si se corta. posByWord: { "book": ["n.", "v."] } de la lista recién leída (opcional).
// onProgress(hechas, total). Devuelve cuántas se han traducido.
export async function translatePending(db, { groupId = null, posByWord = {}, onProgress } = {}) {
  const pending = db.untranslatedWords(groupId).map((w) => ({ ...w, pos: posByWord[w.word_en.toLowerCase()] }));
  const SLICE = 300;
  let saved = 0;
  onProgress?.(0, pending.length);
  for (let i = 0; i < pending.length; i += SLICE) {
    const slice = pending.slice(i, i + SLICE);
    const translations = await translateWords(slice);
    await db.setTranslations(translations);
    saved += translations.length;
    onProgress?.(Math.min(i + SLICE, pending.length), pending.length);
  }
  return saved;
}

// words: [{ id, word_en, pos?, category? }] → [{ id, translation_es }]. Hasta dos acepciones
// ("dance" n./v. → "baile / bailar"). onProgress(hechas, total).
// Google quita las tildes en frases muy cortas ("the imagination" → "la imaginacion") pero no si
// llevan mayúscula y punto ("The imagination." → "La imaginación."), aunque así a veces cambia de
// sentido ("The book." → "Biblia"). Se piden las dos: si coinciden salvo tildes, gana la acentuada.
const bare = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.!¡¿?"]/g, '').trim();
const sentence = (s) => s[0].toUpperCase() + s.slice(1) + '.';

export async function translateWords(words, onProgress) {
  const jobs = []; // { wi, kind, line }
  words.forEach((w, wi) => {
    const kinds = [...new Set((w.pos?.length ? w.pos.map(KIND_OF_POS) : [KIND_OF_CATEGORY[w.category] ?? 'other']))];
    for (const kind of kinds.slice(0, 2)) {
      jobs.push({ wi, kind, line: HINT[kind](w.word_en) });
      if (kind === 'adj') jobs.push({ wi, kind: 'plain', line: w.word_en }); // por si "very X" no da "muy …"
    }
  });
  const lines = jobs.flatMap((j) => [j.line, sentence(j.line)]);
  let done = 0;
  const raw = await translateLines(lines, (n) => onProgress?.(Math.round((done += n) / 2), jobs.length));
  const perWord = words.map(() => []);
  jobs.forEach((j, i) => {
    const kind = j.kind === 'plain' ? 'other' : j.kind;
    const word = words[j.wi].word_en;
    const plain = cleanTranslation(raw[2 * i] ?? '', kind, word);
    const accented = cleanTranslation(raw[2 * i + 1] ?? '', kind, word);
    const t = plain && accented && bare(plain) === bare(accented) ? accented : plain;
    if (j.kind === 'plain') {
      if (!perWord[j.wi].length && t) perWord[j.wi].push(t);
      return;
    }
    if (t) perWord[j.wi].push(t);
  });
  return words
    .map((w, i) => {
      // "máximo / maximo" → "máximo": iguales salvo tildes cuentan como una (gana la que las lleva).
      const unique = new Map();
      for (const t of perWord[i]) {
        const k = bare(t);
        if (!unique.has(k) || /[áéíóúüñ]/i.test(t)) unique.set(k, t.trim());
      }
      return { id: w.id, translation_es: [...unique.values()].slice(0, 2).join(' / ') };
    })
    .filter((t) => t.translation_es);
}
