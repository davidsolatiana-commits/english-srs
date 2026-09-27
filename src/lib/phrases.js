// Frases: detección de idioma y procesado (traducir + analizar) en segundo plano.
// Cada frase se guarda al instante con status 'pending'; este módulo la completa después,
// así que nunca se pierde aunque falle la conexión.

import { translate } from './translate.js';
import { analyzeEnglish } from './analyzer.js';

const ES_WORDS = new Set(
  ('el la los las un una unos unas de del al que y en es son está están estoy estás por para con sin no se lo le les ' +
    'me te nos mi mis tu tus su sus pero muy más como cuando donde qué cómo cuándo dónde yo tú él ella ellos nosotros ' +
    'hay tengo tiene quiero puedo ser estar hacer he ha han fue era porque también ya esto eso esta este aquí').split(' '),
);
const EN_WORDS = new Set(
  ('the a an of and to in is are was were be been it i you he she we they my your his her our their this that ' +
    'these those have has had do does did will would can could should must not no for on with at by from what ' +
    'when where why how who which there here if but so because just very really about').split(' '),
);

// 'en' | 'es'. Tildes, ñ o ¿¡ → español; si no, gana el idioma con más palabras frecuentes.
export function detectLang(text) {
  if (/[ñáéíóú¿¡]/i.test(text)) return 'es';
  let es = 0;
  let en = 0;
  for (const w of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (ES_WORDS.has(w)) es++;
    if (EN_WORDS.has(w)) en++;
  }
  return es > en ? 'es' : 'en';
}

// Traduce y analiza una frase. Devuelve los campos a guardar; nunca lanza.
export async function processPhrase(phrase) {
  const errors = [];
  let textEn = phrase.original_lang === 'en' ? phrase.original_text : null;
  let translationEs = phrase.original_lang === 'es' ? phrase.original_text : null;

  try {
    if (phrase.original_lang === 'es') textEn = await translate(phrase.original_text, 'es', 'en');
    else translationEs = await translate(phrase.original_text, 'en', 'es');
  } catch (err) {
    errors.push(err.message);
  }

  let analysis = null;
  if (textEn) {
    try {
      analysis = await analyzeEnglish(textEn);
    } catch (err) {
      console.error(err);
      errors.push('No se pudo cargar el analizador gramatical (¿sin conexión?).');
    }
  }

  return {
    text_en: textEn,
    translation_es: translationEs,
    analysis_json: analysis ? JSON.stringify(analysis) : null,
    analysis_engine: analysis ? 'local' : null,
    status: errors.length ? 'error' : 'done',
    error: errors.length ? errors.join(' ') : null,
  };
}

// Procesa en orden todas las frases pendientes. Si ya está en marcha, repasa la cola al acabar.
let running = false;
let rerun = false;

export async function processPending(db, onChange) {
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  try {
    do {
      rerun = false;
      for (const phrase of db.pendingPhrases()) {
        const fields = await processPhrase(phrase);
        await db.updatePhrase(phrase.id, fields);
        onChange();
      }
    } while (rerun);
  } finally {
    running = false;
  }
}
