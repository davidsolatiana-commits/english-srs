import { useState, useSyncExternalStore } from 'react';
import { html } from '../lib/html.js';
import { cambridgeUrl, speak, speechStatus, subscribeSpeech } from '../lib/speech.js';
import { isMastered } from '../lib/sm2.js';
import { todayISO } from '../lib/dates.js';

// ✓ discreto para marcar/desmarcar una palabra como dominada, en cualquier pantalla.
// Marcada: deja de entrar como nueva y solo vuelve dentro de 1-2 meses para comprobarlo.
// onToggle(mastered) avisa después de guardar (p. ej. para pasar a la siguiente tarjeta).
export function MasteredToggle({ db, word, onToggle, label = false }) {
  // Estado actual en la base de datos (las pantallas guardan copias de la palabra de al empezar).
  const [on, setOn] = useState(() => isMastered((word?.id && db.getWord(word.id)) || word));
  const [busy, setBusy] = useState(false);
  if (!word?.id) return null;

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (on) await db.unmarkKnown([word.id], todayISO());
      else await db.markKnown([word.id], todayISO());
      setOn(!on);
      onToggle?.(!on);
    } finally {
      setBusy(false);
    }
  }

  return html`
    <button
      type="button"
      className=${'mastered-toggle' + (on ? ' on' : '') + (label ? ' with-label' : '')}
      onClick=${toggle}
      disabled=${busy}
      aria-pressed=${on}
      title=${on ? 'Dominada · tócala para quitar la marca' : 'Marcar como dominada (ya me la sé)'}
      aria-label=${on ? `Quitar ${word.word_en} de dominadas` : `Marcar ${word.word_en} como dominada`}
    >
      ✓${label ? html`<span>${on ? 'Dominada' : 'Ya la sé'}</span>` : ''}
    </button>
  `;
}

// tabIndex=-1 donde no deben interrumpir el Tab entre campos (formulario de añadir).
export function SpeakButton({ text, className = '', tabIndex }) {
  const status = useSyncExternalStore(subscribeSpeech, speechStatus);
  if (status === 'unsupported' || !text) return null;
  const unavailable = status === 'no-english';
  return html`
    <button
      type="button"
      className=${'icon-btn speak ' + className + (unavailable ? ' unavailable' : '')}
      title=${unavailable
        ? 'No hay voz en inglés en este navegador (pulsa para ver cómo arreglarlo)'
        : 'Escuchar (púlsalo otra vez para oírlo más lento)'}
      aria-label=${`Escuchar: ${text}`}
      tabIndex=${tabIndex}
      onClick=${(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊
    </button>
  `;
}

export function DictLink({ word, label = 'Cambridge ↗', tabIndex }) {
  if (!word) return null;
  return html`
    <a
      className="dict-link"
      href=${cambridgeUrl(word)}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver definición, audio y nivel CEFR en Cambridge Dictionary"
      tabIndex=${tabIndex}
      onClick=${(e) => e.stopPropagation()}
    >
      ${label}
    </a>
  `;
}
