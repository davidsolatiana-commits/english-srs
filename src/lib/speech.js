// Pronunciación con la síntesis de voz del navegador (gratis, sin red en la mayoría
// de sistemas). Preferimos inglés británico, que es el de los exámenes de Cambridge.

const LANG = 'en-GB';
const SLOW_REPEAT_MS = 4000;

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice = null;
// 'loading' hasta que el navegador entrega la lista de voces; 'no-english' si no hay
// ninguna voz inglesa (p. ej. Windows en español sin voces extra): nunca leemos
// inglés con una voz española.
let status = canSpeak ? 'loading' : 'unsupported';
const listeners = new Set();

export function speechStatus() {
  return status;
}

export function subscribeSpeech(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const NO_ENGLISH_VOICE_HELP =
  'Este navegador no tiene ninguna voz en inglés, así que no puede pronunciar.\n\n' +
  'Opciones:\n' +
  '• Abre la app en Google Chrome o Microsoft Edge (traen voces en inglés).\n' +
  '• O instala la voz en Windows: Configuración → Hora e idioma → Voz → ' +
  'Agregar voces → English (United Kingdom). Después reinicia el navegador.';

// Mejor voz disponible: en-GB > otro inglés; dentro de eso, las "naturales"/Google suenan mejor.
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  let best = null;
  let bestScore = 0;
  for (const v of voices) {
    const lang = v.lang.replace('_', '-');
    let score = lang === LANG ? 10 : lang.startsWith('en') ? 5 : 0;
    if (score === 0) continue;
    if (/natural|google|online/i.test(v.name)) score += 2;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  voice = best;
  const next = voices.length === 0 ? 'loading' : best ? 'ready' : 'no-english';
  if (next !== status) {
    status = next;
    listeners.forEach((l) => l());
  }
}

if (canSpeak) {
  pickVoice();
  // En Chrome la lista de voces llega de forma asíncrona.
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

let last = { text: null, at: 0 };

// Repetir el mismo texto enseguida lo lee más despacio (como el traductor de Google).
export function speak(text) {
  if (!text || status === 'unsupported') return;
  if (status === 'no-english') {
    alert(NO_ENGLISH_VOICE_HELP);
    return;
  }
  const now = Date.now();
  const slow = last.text === text && now - last.at < SLOW_REPEAT_MS;
  last = { text: slow ? null : text, at: now };

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? LANG;
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.65 : 0.95;
  speechSynthesis.speak(utterance);
}

// Para lecturas automáticas (sin pulsar nada): si no hay voz inglesa, no dice nada ni avisa.
export function speakIfAvailable(text) {
  if (status === 'ready' || status === 'loading') speak(text);
}

// Entrada del Cambridge Dictionary (inglés, con nivel CEFR y audio).
export function cambridgeUrl(word) {
  const slug = word.trim().toLowerCase().replace(/\s+/g, '-');
  return `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(slug)}`;
}
