// Preferencias de práctica de este dispositivo (localStorage).

const KEY = 'english-srs:settings';

export const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20, 30, 50];

// Práctica libre: qué palabras y cuántas por ronda (0 = todas).
export const FREE_ORDERS = [
  { id: 'random', label: 'Al azar' },
  { id: 'hard', label: 'Las más difíciles' },
  { id: 'recent', label: 'Las últimas añadidas' },
];
export const FREE_SIZES = [10, 20, 50, 0];

// Escritura: cuántas palabras por sesión y cuántas veces se escribe cada una.
export const WRITE_WORD_COUNTS = [3, 5, 10];
export const WRITE_REPS = [3, 5, 10];

export const DEFAULT_SETTINGS = {
  mode: 'auto',
  newPerDay: 10,
  autoTranslate: true,
  // Al añadir una palabra, buscar sola una imagen y ejemplos de uso (src/lib/media.js).
  autoImage: true,
  autoExamples: true,
  freeOrder: 'random',
  freeSize: 20,
  writeOrder: 'hard',
  writeWords: 5,
  writeReps: 5,
  writeAudio: true,
  // Qué palabras estudiar (repaso de hoy, práctica libre y escritura). Listas vacías = todas.
  study: { levels: [], categories: [], sources: [] },
};

export function isStudyFiltered(study) {
  return Boolean(study && (study.levels.length || study.categories.length || study.sources.length));
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...saved, study: { ...DEFAULT_SETTINGS.study, ...saved.study } };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Sin localStorage los ajustes solo duran esta sesión.
  }
}
