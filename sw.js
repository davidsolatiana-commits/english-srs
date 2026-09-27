// Service worker: permite instalar la app y abrirla sin conexión.
//
// - Archivos propios: primero la red (así las actualizaciones llegan solas) y, sin
//   conexión, la copia guardada.
// - Librerías de CDN (React, SQLite, compromise…): sus URLs llevan versión fija, así
//   que se sirven desde la copia guardada en cuanto se han descargado una vez.
// - Traductor y diccionario (MyMemory, Cambridge): siempre por red, nunca se guardan.

const APP_CACHE = 'english-srs-app-v1';
const CDN_CACHE = 'english-srs-cdn-v1';
const CDN_HOSTS = ['esm.sh', 'cdn.jsdelivr.net'];

// Todo lo necesario para arrancar sin conexión. Si añades archivos a src/, añádelos aquí
// (aunque falte alguno, se guarda igualmente la primera vez que se usa con conexión).
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './src/styles.css',
  './src/main.js',
  './src/components/AddWord.js',
  './src/components/App.js',
  './src/components/Backup.js',
  './src/components/Grammar.js',
  './src/components/GrammarQuiz.js',
  './src/components/InstallButton.js',
  './src/components/Notebook.js',
  './src/components/Phrases.js',
  './src/components/Practice.js',
  './src/components/PracticeCards.js',
  './src/components/WordList.js',
  './src/components/UnitLink.js',
  './src/components/WordTools.js',
  './src/components/WritingPractice.js',
  './src/lib/analyzer.js',
  './src/lib/answers.js',
  './src/lib/dates.js',
  './src/lib/db.js',
  './src/lib/grammar.js',
  './src/lib/grammarCheck.js',
  './src/lib/grammarContent.js',
  './src/lib/grammarDetections.js',
  './src/lib/grammarExtra.js',
  './src/lib/html.js',
  './src/lib/modes.js',
  './src/lib/phrases.js',
  './src/lib/settings.js',
  './src/lib/sm2.js',
  './src/lib/speech.js',
  './src/lib/textReview.js',
  './src/lib/translate.js',
  './src/lib/writingPrompts.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![APP_CACHE, CDN_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // Abrir la app sin conexión desde cualquier ruta: devolver la página principal.
    if (request.mode === 'navigate') return cache.match('./index.html');
    throw new Error('Sin conexión y sin copia guardada: ' + request.url);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CDN_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
  // El resto (traductor, diccionario…) va directo a la red.
});
