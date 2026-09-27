// Traducción con MyMemory (gratis, sin clave; límite diario generoso para frases sueltas).
// Ojo: el texto se envía a su servidor.

const ENDPOINT = 'https://api.mymemory.translated.net/get';
export const MAX_TRANSLATE_CHARS = 500; // límite de MyMemory por petición

// MyMemory a veces devuelve entidades HTML (&#39;). Un <textarea> las decodifica sin ejecutar nada.
function decodeEntities(s) {
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

async function query(text, from, to) {
  const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${from}|${to}`)}`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Sin conexión con el traductor.');
  }
  if (res.status === 429) throw new Error('Límite diario del traductor gratuito alcanzado. Reintenta mañana.');
  if (!res.ok) throw new Error(`El traductor respondió con un error (${res.status}).`);

  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (Number(data?.responseStatus) !== 200 || !out) {
    throw new Error(data?.responseDetails || 'El traductor no devolvió ninguna traducción.');
  }
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) {
    throw new Error('Límite diario del traductor gratuito alcanzado. Reintenta mañana.');
  }
  return data;
}

// Frases completas: la traducción principal suele ser buena.
export async function translate(text, from, to) {
  const data = await query(text, from, to);
  return decodeEntities(data.responseData.translatedText).trim();
}

// ---------- Palabras sueltas ----------
// Con una sola palabra la traducción principal de MyMemory falla a menudo
// ("struggle" → ".", "borrow" → "utilización de crédito"), pero sus alternativas
// suelen incluir la buena. Se ordenan por calidad y se devuelven también las demás.

const wordCache = new Map();

const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:!?¡¿"']/g, '').trim();

function clean(translation, original) {
  let t = decodeEntities(translation).trim().replace(/^["'«]+|["'»]+$/g, '').replace(/[.;:!]+$/, '').trim();
  // "Salario" → "salario" si la palabra original iba en minúscula (pero no siglas como "UE").
  if (/^[a-z]/.test(original) && /^\p{Lu}\p{Ll}/u.test(t)) t = t[0].toLowerCase() + t.slice(1);
  return t;
}

// { best, alternatives } — best es null si no hay ninguna candidata válida.
export async function translateWord(word, from = 'en', to = 'es') {
  const key = `${from}|${to}|${word.trim().toLowerCase()}`;
  if (wordCache.has(key)) return wordCache.get(key);

  const data = await query(word.trim(), from, to);
  const source = plain(word);
  const candidates = [
    { translation: data.responseData.translatedText, quality: 50, match: Number(data.responseData.match) || 0, segment: word },
    ...(data.matches ?? []).map((m) => ({
      translation: m.translation,
      quality: Number(m.quality) || 0,
      match: Number(m.match) || 0,
      segment: m.segment ?? '',
    })),
  ]
    .map((c) => ({ ...c, text: clean(c.translation ?? '', word.trim()), sameSource: plain(c.segment) === source }))
    // Fuera candidatas vacías, larguísimas o que aún contienen la palabra inglesa ("meanwhileComment").
    .filter((c) => /\p{L}/u.test(c.text) && c.text.length <= 60 && !(source.length > 3 && plain(c.text).includes(source)))
    .sort(
      (a, b) =>
        b.sameSource - a.sameSource ||
        (b.quality > 0) - (a.quality > 0) ||
        b.quality - a.quality ||
        b.match - a.match,
    );

  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    const k = plain(c.text);
    if (seen.has(k) || k === source) continue;
    seen.add(k);
    unique.push(c.text);
  }
  const result = { best: unique[0] ?? null, alternatives: unique.slice(1, 4) };
  wordCache.set(key, result);
  return result;
}
