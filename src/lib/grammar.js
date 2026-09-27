// Temario de gramática de la app: unidades del artifact + unidades añadidas, ordenadas por nivel.

import { LEVELS, UNITS as BASE_UNITS, CHEAT, SAME_VERB, IRREGULARS } from './grammarContent.js';
import { EXTRA_UNITS } from './grammarExtra.js';

export { LEVELS, CHEAT, SAME_VERB, IRREGULARS };

export const LEVEL_KEYS = Object.keys(LEVELS); // A1 … C1

// Orden de la escalera: por nivel; dentro de cada nivel, las del artifact y luego las añadidas.
export const UNITS = LEVEL_KEYS.flatMap((lv) => [...BASE_UNITS, ...EXTRA_UNITS].filter((u) => u.lv === lv));
export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const unitNumber = (id) => UNITS.findIndex((u) => u.id === id) + 1;

// Una unidad está dominada con un 80 % de aciertos en sus ejercicios.
export const MASTERY = 0.8;

// Repaso espaciado de unidades dominadas: días hasta el siguiente repaso según cuántos lleva.
export const REVIEW_STEPS = [3, 7, 21, 60, 120];

// Preguntas de unas unidades: [{ q, unit }].
export function questionsOf(units) {
  return units.flatMap((u) => u.q.map((q) => ({ q, unit: u })));
}

// "¿Dónde está el error?": cada error típico da una pareja incorrecta/correcta.
export function errorItemsOf(units) {
  return units.flatMap((u) => u.err.map(([wrong, right, why]) => ({ wrong, right, why, unit: u })));
}

export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
