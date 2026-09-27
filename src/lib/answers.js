// Corrección de respuestas escritas y huecos en frases de ejemplo.

import { isRight } from './grammarCheck.js';

const EDGE_PUNCT = /^[\s.,!?;:"'¡¿()]+|[\s.,!?;:"'¡¿()]+$/g;

// Minúsculas, apóstrofos rectos, sin puntuación en los extremos, espacios simples
// y sin "to " delante (rely = to rely).
export function normalize(text) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(EDGE_PUNCT, '')
    .replace(/\s+/g, ' ')
    .replace(/^to (?=\S)/, '');
}

// "big / large" o "big; large" admite cualquiera de las dos.
function variants(expected) {
  return expected.split(/[/;]/).map(normalize).filter(Boolean);
}

// Nº de ediciones entre dos textos; intercambiar dos letras seguidas ("relaible") cuenta como 1.
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// 'correct' | 'close' (una errata leve) | 'wrong'
export function checkAnswer(input, expected) {
  const given = normalize(input);
  if (!given) return 'wrong';
  // Contracciones y formas completas valen igual ("don't" = "do not", "I'd" = "I would"/"I had").
  if (isRight(input, expected.split(/[/;]/).map((s) => s.trim()).filter(Boolean))) return 'correct';
  let close = false;
  for (const v of variants(expected)) {
    if (v === given) return 'correct';
    // Tolerancia pequeña: "though" no debe valer como "casi although".
    const allowed = v.length >= 10 ? 2 : v.length >= 4 ? 1 : 0;
    if (allowed > 0 && editDistance(v, given) <= allowed) close = true;
  }
  return close ? 'close' : 'wrong';
}

// Busca la palabra dentro de la frase de ejemplo para convertirla en hueco.
// Devuelve { before, answer, after } o null si la frase no la contiene tal cual.
export function clozeParts(sentence, word) {
  const base = word.split(/[/;]/)[0].trim();
  const candidates = [base, base.replace(/^to\s+/i, '')].filter(Boolean);
  for (const c of candidates) {
    const pattern = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const match = sentence.match(new RegExp(`(?<!\\p{L})${pattern}(?!\\p{L})`, 'iu'));
    if (match) {
      return {
        before: sentence.slice(0, match.index),
        answer: match[0],
        after: sentence.slice(match.index + match[0].length),
      };
    }
  }
  return null;
}

// "look forward to" → "l___ f______ t_"
export function hintMask(expected) {
  return expected
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : part[0] + part.slice(1).replace(/\p{L}/gu, '_')))
    .join('');
}
