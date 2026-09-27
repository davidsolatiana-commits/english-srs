import { useSyncExternalStore } from 'react';
import { html } from '../lib/html.js';
import { cambridgeUrl, speak, speechStatus, subscribeSpeech } from '../lib/speech.js';

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
