// "Revisar texto" del cuaderno: estadísticas, estructuras del temario, conectores,
// palabras repetidas y palabras básicas con alternativas de nivel B2. Sin IA: no corrige gramática.

import { analyzeEnglish } from './analyzer.js';

const WORD_RE = /[a-z]+(?:'[a-z]+)?/gi;

export function countWords(text) {
  return (text.match(WORD_RE) ?? []).length;
}

// ¿Aparece la palabra de vocabulario en el texto? Acepta -s/-es/-ed/-d/-ing en la primera palabra
// ("give up" → "gives up", "giving up"; los irregulares como "gave up" no se detectan).
export function usesWord(text, wordEn) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const [first, ...rest] = wordEn.toLowerCase().trim().replace(/^to\s+/, '').split(/\s+/);
  if (!first) return false;
  const tail = rest.length ? `\\s+${rest.map(esc).join('\\s+')}` : '';
  return new RegExp(`\\b${esc(first)}(?:s|es|ed|d|ing)?${tail}\\b`, 'i').test(text);
}

const CONNECTOR_GROUPS = [
  { label: 'Contraste', items: ['however', 'although', 'even though', 'whereas', 'despite', 'in spite of', 'nevertheless', 'on the other hand'] },
  { label: 'Añadir ideas', items: ['moreover', 'furthermore', 'in addition', 'what is more', 'besides'] },
  { label: 'Consecuencia', items: ['therefore', 'as a result', 'consequently', 'thus'] },
  { label: 'Ejemplos', items: ['for example', 'for instance', 'such as'] },
  { label: 'Ordenar y concluir', items: ['firstly', 'secondly', 'finally', 'in conclusion', 'to sum up', 'overall'] },
];

// Palabras muy básicas → alternativas más ricas (cuál encaja depende del contexto).
const UPGRADES = [
  { word: 'very', re: /\bvery\b/gi, alt: 'extremely, incredibly, really · o un adjetivo fuerte (very good → excellent)' },
  { word: 'good', re: /\bgood\b/gi, alt: 'excellent, great, beneficial, positive' },
  { word: 'bad', re: /\bbad\b/gi, alt: 'awful, harmful, negative, disappointing' },
  { word: 'big', re: /\bbig\b/gi, alt: 'huge, enormous, significant, considerable' },
  { word: 'small', re: /\bsmall\b/gi, alt: 'tiny, slight, minor' },
  { word: 'nice', re: /\bnice\b/gi, alt: 'pleasant, lovely, enjoyable' },
  { word: 'thing(s)', re: /\bthings?\b/gi, alt: 'aspect, issue, matter, factor' },
  { word: 'a lot of / lots of', re: /\b(?:a lot of|lots of)\b/gi, alt: 'plenty of, a great deal of, numerous' },
  { word: 'think', re: /\bthink\b/gi, alt: 'believe, consider, reckon' },
  { word: 'important', re: /\bimportant\b/gi, alt: 'essential, crucial, vital, significant' },
  { word: 'say / said', re: /\b(?:say|says|said)\b/gi, alt: 'state, claim, mention, point out' },
  { word: 'happy', re: /\bhappy\b/gi, alt: 'delighted, pleased, glad' },
  { word: 'sad', re: /\bsad\b/gi, alt: 'upset, disappointed, down' },
  { word: 'problem', re: /\bproblems?\b/gi, alt: 'issue, difficulty, challenge' },
  { word: 'interesting', re: /\binteresting\b/gi, alt: 'fascinating, engaging, intriguing' },
  { word: 'beautiful', re: /\bbeautiful\b/gi, alt: 'stunning, gorgeous, breathtaking' },
  { word: 'get', re: /\b(?:get|gets|got)\b/gi, alt: 'obtain, receive, become, achieve (según el sentido)' },
];

const STOPWORDS = new Set(
  ('the a an and or but so to of in on at for with from by about as into than then that this these those it its ' +
    'is are was were be been being am have has had do does did will would can could should must may might ' +
    'i you he she we they me him her us them my your his our their mine yours not no yes if when where what who ' +
    'which why how there here all some any very just also too more most much many one two up out over after ' +
    'before because while really get got like').split(' '),
);

const LEVELS = ['C1', 'B2', 'B1', 'A2', 'A1'];

export async function reviewText(text) {
  const words = text.match(WORD_RE) ?? [];
  const lower = words.map((w) => w.toLowerCase());
  const sentences = text.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter((s) => countWords(s) > 0);
  const unique = new Set(lower).size;

  const analysis = await analyzeEnglish(text);
  const structures = analysis.structures.filter((s) => s.level);
  const levelCounts = Object.fromEntries(LEVELS.map((l) => [l, structures.filter((s) => s.level === l).length]));

  const has = (item) => new RegExp(`\\b${item.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text);
  const connectors = CONNECTOR_GROUPS.flatMap((g) => g.items.filter(has));
  const missingGroups = CONNECTOR_GROUPS.filter((g) => !g.items.some(has)).map((g) => ({
    label: g.label,
    examples: g.items.slice(0, 3),
  }));

  const counts = new Map();
  for (const w of lower) {
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const repeated = [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }));

  const upgrades = UPGRADES.map((u) => ({ word: u.word, alt: u.alt, count: (text.match(u.re) ?? []).length })).filter(
    (u) => u.count > 0,
  );

  return {
    words: words.length,
    sentences: sentences.length,
    avgSentence: sentences.length ? Math.round(words.length / sentences.length) : 0,
    variety: words.length ? Math.round((unique / words.length) * 100) : 0,
    structures,
    levelCounts,
    connectors,
    missingGroups,
    repeated,
    upgrades,
  };
}
