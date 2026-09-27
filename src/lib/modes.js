// Modos de práctica y cómo se valora cada resultado.

export const MODES = [
  { id: 'auto', label: 'Automático' },
  { id: 'flash-en', label: 'Tarjetas inglés → español' },
  { id: 'flash-es', label: 'Tarjetas español → inglés' },
  { id: 'choice', label: 'Opción múltiple' },
  { id: 'write', label: 'Escribir en inglés' },
  { id: 'cloze', label: 'Completar la frase' },
];

export const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.id, m.label]));

// Automático: cuanto mejor conoces la palabra, más exigente el ejercicio.
//   0 aciertos seguidos (nueva o fallada) → opción múltiple (reconocer)
//   1 → tarjeta inglés → español
//   2 → tarjeta español → inglés (producir)
//   3+ → escribirla, o completar su frase de ejemplo
function autoMode(word, { canChoice, canCloze }) {
  if (word.repetitions === 0) return canChoice ? 'choice' : 'flash-en';
  if (word.repetitions === 1) return 'flash-en';
  if (word.repetitions === 2) return 'flash-es';
  return canCloze && Math.random() < 0.5 ? 'cloze' : 'write';
}

// Si el modo elegido no es posible para esta palabra, cae en el más parecido.
export function pickMode(setting, word, abilities) {
  let mode = setting === 'auto' ? autoMode(word, abilities) : setting;
  if (mode === 'choice' && !abilities.canChoice) mode = 'flash-en';
  if (mode === 'cloze' && !abilities.canCloze) mode = 'write';
  return mode;
}

// Botones de valoración según el resultado, y cuál usa Enter/Espacio por defecto.
//   self    → tarjetas: te valoras tú
//   correct / hinted / close / wrong → corrección automática
//   relearn → segunda pasada de una palabra fallada en esta sesión
export const OUTCOME_GRADES = {
  self: { ids: ['again', 'hard', 'good', 'easy'], def: 'good' },
  correct: { ids: ['hard', 'good', 'easy'], def: 'good' },
  hinted: { ids: ['hard', 'good'], def: 'hard' },
  close: { ids: ['again', 'hard'], def: 'hard' },
  wrong: { ids: ['again'], def: 'again' },
  relearn: { ids: ['again', 'known'], def: 'known' },
};

export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
