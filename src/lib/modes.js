// Modos de práctica y cómo se valora cada resultado.

export const MODES = [
  { id: 'auto', label: 'Automático' },
  { id: 'flash-en', label: 'Tarjetas inglés → español' },
  { id: 'flash-es', label: 'Tarjetas español → inglés' },
  { id: 'choice', label: 'Opción múltiple' },
  { id: 'write', label: 'Escribir en inglés' },
  { id: 'cloze', label: 'Completar la frase' },
  { id: 'image', label: 'Imagen → escribir en inglés' },
];

export const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.id, m.label]));

// Automático: cuanto mejor conoces la palabra, más exigente el ejercicio.
//   0 aciertos seguidos (nueva o fallada) → opción múltiple (reconocer)
//   1 → tarjeta inglés → español
//   2 → tarjeta español → inglés (producir)
//   3+ → escribirla, completar su frase de ejemplo o escribirla viendo su imagen
function autoMode(word, { canChoice, canCloze, canImage }) {
  if (word.repetitions === 0) return canChoice ? 'choice' : 'flash-en';
  if (word.repetitions === 1) return 'flash-en';
  if (word.repetitions === 2) return 'flash-es';
  const options = ['write', ...(canCloze ? ['cloze'] : []), ...(canImage ? ['image'] : [])];
  return options[Math.floor(Math.random() * options.length)];
}

// Si el modo elegido no es posible para esta palabra, cae en el más parecido.
export function pickMode(setting, word, abilities) {
  let mode = setting === 'auto' ? autoMode(word, abilities) : setting;
  if (mode === 'choice' && !abilities.canChoice) mode = 'flash-en';
  if (mode === 'cloze' && !abilities.canCloze) mode = 'write';
  if (mode === 'image' && !abilities.canImage) mode = 'write';
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
