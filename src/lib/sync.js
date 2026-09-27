// Sincronización con Google Drive: la base de datos completa (.sqlite) se guarda en la carpeta
// oculta de la app en tu Drive (appDataFolder). La app no ve ningún otro archivo de tu Drive.
//
// Modelo: "el último gana", con aviso de conflicto. Al sincronizar:
//   - solo ha cambiado la nube      → se descarga y sustituye los datos de este dispositivo
//   - solo ha cambiado este dispositivo → se sube
//   - han cambiado los dos          → se pregunta qué versión conservar
// Tras cada cambio local se sube sola al cabo de unos segundos (si la sesión de Google sigue
// abierta; dura una hora). Si no, el botón ☁ del encabezado queda pendiente: un toque y listo.

const CLIENT_ID = '304220146109-pqlgs95a65nh8nu3gch4jtd6spae3hij.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'english-srs.sqlite';
const STATE_KEY = 'english-srs:sync';
const TOKEN_KEY = 'english-srs:sync-token';
const UPLOAD_DELAY_MS = 4000;
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

// Solo en la web publicada (es el único origen autorizado en Google Cloud).
export const syncAvailable = location.hostname.endsWith('github.io');

class NeedsGesture extends Error {}

// ---------- Estado (este dispositivo) ----------

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch {
    // sin localStorage no se puede sincronizar de forma fiable
  }
  return next;
}

// ---------- Estado visible (para la interfaz) ----------

// phase: off | pending | syncing | ok | conflict | error
let status = { phase: 'off' };
const listeners = new Set();

function setStatus(patch) {
  status = { ...status, ...patch, lastSync: readState().lastSync ?? null };
  listeners.forEach((l) => l());
}

export const getSyncStatus = () => status;
export function subscribeSync(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const isConnected = () => !!readState().connected;

// ---------- Sesión de Google (Google Identity Services) ----------

let gisPromise;
function loadGis() {
  gisPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => {
      gisPromise = null;
      reject(new Error('No se pudo cargar el acceso de Google (¿sin conexión?).'));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

let token = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
  } catch {
    return null;
  }
})();

const tokenValid = () => token && token.exp > Date.now() + 60_000;

function saveToken(t) {
  token = t;
  try {
    t ? sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // se pedirá de nuevo al recargar
  }
}

// interactive: solo tras un toque del usuario (Google abre una ventana y el navegador
// bloquea las ventanas que no vienen de un toque).
async function getToken(interactive) {
  if (tokenValid()) return token.value;
  if (!interactive) throw new NeedsGesture('Toca ☁ para sincronizar.');
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(new Error(resp.error_description || resp.error));
        saveToken({ value: resp.access_token, exp: Date.now() + Number(resp.expires_in) * 1000 });
        resolve(token.value);
      },
      error_callback: (err) =>
        reject(new Error(err?.type === 'popup_closed' ? 'Has cerrado la ventana de Google.' : 'No se pudo abrir la ventana de Google.')),
    });
    client.requestAccessToken({ prompt: readState().connected ? '' : 'consent' });
  });
}

// ---------- Google Drive ----------

async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token.value}` } });
  if (res.status === 401) {
    saveToken(null);
    throw new NeedsGesture('La sesión de Google ha caducado: toca ☁ para sincronizar.');
  }
  if (!res.ok) throw new Error(`Google Drive respondió con un error (${res.status}).`);
  return res;
}

async function findRemote() {
  const q = encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await api(`${DRIVE}?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&pageSize=1`);
  return (await res.json()).files?.[0] ?? null;
}

async function download(id) {
  const res = await api(`${DRIVE}/${id}?alt=media`);
  return new Uint8Array(await res.arrayBuffer());
}

async function upload(bytes, id) {
  const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
  if (id) {
    const res = await api(`${UPLOAD}/${id}?uploadType=media&fields=id,modifiedTime`, { method: 'PATCH', body: blob });
    return res.json();
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })], { type: 'application/json' }));
  form.append('file', blob);
  const res = await api(`${UPLOAD}?uploadType=multipart&fields=id,modifiedTime`, { method: 'POST', body: form });
  return res.json();
}

// ---------- Sincronizar ----------

let db = null;
let applying = false; // al sustituir por la versión de la nube no hay que marcar cambios locales
let writeSeq = 0;
let uploadTimer = null;
let running = false;

// resolve: 'local' | 'remote' para decidir un conflicto.
export async function syncNow({ interactive = false, resolve = null } = {}) {
  if (!db || running || !isConnected()) return;
  running = true;
  setStatus({ phase: 'syncing', message: null });
  try {
    await getToken(interactive);
    const state = readState();
    const remote = await findRemote();
    const seq = writeSeq;

    let action = 'none';
    if (!remote) action = 'upload';
    else if (resolve) action = resolve === 'local' ? 'upload' : 'download';
    else {
      const remoteChanged = remote.modifiedTime !== state.remoteModified;
      if (remoteChanged && state.dirty) {
        setStatus({ phase: 'conflict', message: 'Hay cambios aquí y en la nube.' });
        return;
      }
      action = remoteChanged ? 'download' : state.dirty ? 'upload' : 'none';
    }

    const now = new Date().toISOString();
    if (action === 'upload') {
      const r = await upload(db.exportFile(), remote?.id);
      writeState({ remoteModified: r.modifiedTime, dirty: writeSeq !== seq, lastSync: now });
    } else if (action === 'download') {
      const bytes = await download(remote.id);
      const backup = db.readBackup(bytes);
      applying = true;
      try {
        await backup.apply();
      } finally {
        applying = false;
      }
      writeState({ remoteModified: remote.modifiedTime, dirty: false, lastSync: now });
      location.reload(); // recargar para que todas las pantallas muestren los datos nuevos
      return;
    } else {
      writeState({ lastSync: now });
    }
    setStatus({ phase: readState().dirty ? 'pending' : 'ok', message: null });
  } catch (err) {
    if (err instanceof NeedsGesture) setStatus({ phase: 'pending', message: err.message });
    else {
      console.error(err);
      setStatus({ phase: 'error', message: err.message });
    }
  } finally {
    running = false;
  }
}

function onLocalWrite() {
  if (applying || !isConnected()) return;
  writeSeq += 1;
  writeState({ dirty: true });
  clearTimeout(uploadTimer);
  if (tokenValid()) {
    setStatus({ phase: 'pending', message: 'Cambios sin subir…' });
    uploadTimer = setTimeout(() => syncNow(), UPLOAD_DELAY_MS);
  } else {
    setStatus({ phase: 'pending', message: 'Toca ☁ para subir los cambios.' });
  }
}

// Al arrancar la app.
export function initSync(database) {
  db = database;
  db.onWrite(onLocalWrite);
  if (!syncAvailable || !isConnected()) return setStatus({ phase: 'off' });
  if (readState().dirty) setStatus({ phase: 'pending', message: 'Toca ☁ para sincronizar.' });
  else setStatus({ phase: 'pending', message: 'Toca ☁ para comprobar si hay cambios.' });
  loadGis().catch(() => {}); // precargar: así el toque abre la ventana de Google sin esperas
  if (tokenValid()) syncNow();
  // Al volver a la app (p. ej. tras usar el móvil), traer lo último si la sesión sigue abierta.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && tokenValid() && isConnected()) syncNow();
  });
}

export async function connect() {
  // En un dispositivo con datos, la primera vez cuenta como "cambios locales": si la nube
  // también tiene datos, se preguntará cuál conservar.
  writeState({ connected: true, dirty: db.hasData(), remoteModified: null });
  await syncNow({ interactive: true });
  if (status.phase === 'error' && !tokenValid()) writeState({ connected: false });
}

export function disconnect() {
  const t = token?.value;
  if (t && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(t, () => {});
  saveToken(null);
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // nada que borrar
  }
  setStatus({ phase: 'off', message: null });
}
