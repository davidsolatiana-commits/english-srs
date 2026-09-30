// SQLite en el navegador (sql.js) persistido en IndexedDB.
// La base de datos entera vive en memoria; tras cada escritura se guarda
// una copia del archivo .sqlite en IndexedDB.

import { INITIAL_EASE } from './sm2.js';
import { addDays } from './dates.js';
import { MASTERY, REVIEW_STEPS } from './grammar.js';

const SQL_JS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
const IDB_NAME = 'english-srs';
const IDB_STORE = 'files';
const DB_KEY = 'main.sqlite';

export const CATEGORIES = ['verbo', 'sustantivo', 'adjetivo', 'phrasal verb', 'expresión', 'otro'];
export const CEFR_LEVELS = ['A2', 'B1', 'B2'];

// Cada entrada lleva la base de datos de la versión i a la i+1 (PRAGMA user_version).
const MIGRATIONS = [
  `
  CREATE TABLE words (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    word_en          TEXT    NOT NULL,
    translation_es   TEXT    NOT NULL,
    example_sentence TEXT,
    category         TEXT CHECK (category IN ('verbo','sustantivo','adjetivo','phrasal verb','expresión','otro')),
    cefr_level       TEXT CHECK (cefr_level IN ('A2','B1','B2')),
    source           TEXT,
    date_added       TEXT    NOT NULL,
    ease_factor      REAL    NOT NULL DEFAULT ${INITIAL_EASE},
    interval_days    INTEGER NOT NULL DEFAULT 0,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    next_review_date TEXT    NOT NULL,
    last_review_date TEXT
  );
  CREATE INDEX idx_words_next_review ON words (next_review_date);
  `,
  // v2: fecha del primer repaso. NULL = palabra nueva (nunca practicada);
  // sirve para limitar cuántas nuevas entran cada día.
  `
  ALTER TABLE words ADD COLUMN first_review_date TEXT;
  UPDATE words SET first_review_date = last_review_date WHERE last_review_date IS NOT NULL;
  `,
  // v3: frases libres. Se guardan al instante (status 'pending') y después se completan
  // con la traducción y el análisis gramatical (analysis_json).
  `
  CREATE TABLE phrases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    original_text   TEXT NOT NULL,
    original_lang   TEXT NOT NULL CHECK (original_lang IN ('en','es')),
    text_en         TEXT,
    translation_es  TEXT,
    analysis_json   TEXT,
    analysis_engine TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','error')),
    error           TEXT,
    created_at      TEXT NOT NULL
  );
  `,
  // v4: cuaderno de escritura libre. prompt_id = tema elegido (src/lib/writingPrompts.js);
  // word_ids = JSON con las palabras propuestas para usar en el texto.
  `
  CREATE TABLE notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL DEFAULT '',
    prompt_id  TEXT,
    word_ids   TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  // v5: progreso en el temario de gramática (src/lib/grammar.js). Las unidades dominadas se
  // repasan de forma espaciada: next_review_date; reviews = repasos superados seguidos.
  `
  CREATE TABLE grammar_progress (
    unit_id          TEXT PRIMARY KEY,
    status           TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo','en_proceso','dominado')),
    best_ok          INTEGER,
    best_total       INTEGER,
    attempts         INTEGER NOT NULL DEFAULT 0,
    reviews          INTEGER NOT NULL DEFAULT 0,
    last_practiced   TEXT,
    next_review_date TEXT
  );
  `,
  // v6: palabras en pausa. No salen en ninguna práctica (ni cuentan como pendientes)
  // hasta que se reanudan; su programación SM-2 se conserva tal cual.
  `
  ALTER TABLE words ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0;
  `,
];

// Filtro de estudio { levels, categories, sources }: cada lista vacía = sin filtrar por ella;
// '' dentro de una lista = palabras sin ese dato. Las pausadas siempre quedan fuera.
function studyWhere(filter = {}) {
  const parts = ['suspended = 0'];
  const params = {};
  const add = (column, values, prefix) => {
    if (!values?.length) return;
    const or = [];
    const named = values.filter((v) => v !== '');
    if (named.length) {
      named.forEach((v, i) => (params[`:${prefix}${i}`] = v));
      or.push(`${column} IN (${named.map((_, i) => `:${prefix}${i}`).join(', ')})`);
    }
    if (values.includes('')) or.push(`${column} IS NULL OR ${column} = ''`);
    parts.push(`(${or.join(' OR ')})`);
  };
  add('cefr_level', filter.levels, 'lv');
  add('category', filter.categories, 'ct');
  add('source', filter.sources, 'sr');
  return { where: parts.join(' AND '), params };
}

const NOTE_FIELDS = ['title', 'body', 'word_ids'];

const PHRASE_FIELDS = ['text_en', 'translation_es', 'analysis_json', 'analysis_engine', 'status', 'error'];

// ---------- IndexedDB ----------

let idbPromise;
function idb() {
  idbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return idbPromise;
}

async function idbGet(key) {
  const conn = await idb();
  return new Promise((resolve, reject) => {
    const req = conn.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const conn = await idb();
  return new Promise((resolve, reject) => {
    const tx = conn.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Apertura y migraciones ----------

function migrate(db) {
  const version = db.exec('PRAGMA user_version')[0].values[0][0];
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    db.exec(MIGRATIONS[v]);
    db.exec(`PRAGMA user_version = ${v + 1}`);
    db.exec('COMMIT');
  }
  return version < MIGRATIONS.length;
}

export async function openDatabase() {
  if (typeof window.initSqlJs !== 'function') {
    throw new Error('No se pudo cargar SQLite (sql.js). ¿Hay conexión a internet?');
  }
  const SQL = await window.initSqlJs({ locateFile: (file) => SQL_JS_CDN + file });
  const saved = await idbGet(DB_KEY);
  const db = saved ? new SQL.Database(saved) : new SQL.Database();

  const store = createStore(SQL, db);
  if (migrate(db)) await store.flush();

  // Pide al navegador que no borre los datos si se queda sin espacio.
  navigator.storage?.persist?.().catch(() => {});
  return store;
}

// ---------- Copias de seguridad ----------

const SQLITE_HEADER = 'SQLite format 3\0';

// Abre un archivo .sqlite exportado por esta app, comprobando que lo es,
// y lo actualiza al esquema actual si es de una versión anterior.
function openBackup(SQL, bytes) {
  const header = String.fromCharCode(...bytes.subarray(0, SQLITE_HEADER.length));
  if (header !== SQLITE_HEADER) {
    throw new Error('El archivo no es una base de datos SQLite.');
  }
  const backup = new SQL.Database(bytes);
  try {
    const version = backup.exec('PRAGMA user_version')[0].values[0][0];
    const hasWords = backup.exec(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'words'`).length > 0;
    if (!hasWords) throw new Error('El archivo no es una copia de esta app (no tiene tabla de palabras).');
    if (version > MIGRATIONS.length) throw new Error('La copia es de una versión más nueva de la app.');
    migrate(backup);
    return backup;
  } catch (err) {
    backup.close();
    throw err;
  }
}

// ---------- Consultas ----------

function createStore(SQL, initialDb) {
  // `let`: al restaurar una copia se sustituye la base de datos entera.
  let db = initialDb;
  let pendingWrite = Promise.resolve();
  // Avisos tras cada escritura (la sincronización con Google Drive los usa).
  const writeListeners = new Set();

  function all(sql, params = {}) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  function grammarRow(unitId) {
    return (
      all('SELECT * FROM grammar_progress WHERE unit_id = :id', { ':id': unitId })[0] ?? {
        unit_id: unitId,
        status: 'nuevo',
        best_ok: null,
        best_total: null,
        attempts: 0,
        reviews: 0,
        last_practiced: null,
        next_review_date: null,
      }
    );
  }

  function scheduleFirstReview(row, today) {
    Object.assign(row, { status: 'dominado', reviews: 0, next_review_date: addDays(today, REVIEW_STEPS[0]) });
  }

  async function saveGrammarRow(row) {
    db.run(
      `INSERT OR REPLACE INTO grammar_progress
         (unit_id, status, best_ok, best_total, attempts, reviews, last_practiced, next_review_date)
       VALUES (:unit_id, :status, :best_ok, :best_total, :attempts, :reviews, :last_practiced, :next_review_date)`,
      Object.fromEntries(Object.entries(row).map(([k, v]) => [`:${k}`, v])),
    );
    await flush();
  }

  // Palabras nuevas que aún caben hoy según el límite diario.
  function newQuota(today, newPerDay) {
    const started = all('SELECT COUNT(*) AS n FROM words WHERE first_review_date = :today', { ':today': today })[0].n;
    return Math.max(0, newPerDay - started);
  }

  function countNew(today, filter) {
    const f = studyWhere(filter);
    return all(
      `SELECT COUNT(*) AS n FROM words WHERE first_review_date IS NULL AND next_review_date <= :today AND ${f.where}`,
      { ':today': today, ...f.params },
    )[0].n;
  }

  // Guarda una instantánea del archivo; las escrituras a IndexedDB van en cola y en orden.
  function flush() {
    const data = db.export();
    pendingWrite = pendingWrite.then(() => idbPut(DB_KEY, data));
    writeListeners.forEach((l) => l());
    return pendingWrite;
  }

  return {
    flush,

    onWrite(listener) {
      writeListeners.add(listener);
      return () => writeListeners.delete(listener);
    },

    hasData() {
      return all(
        `SELECT (SELECT COUNT(*) FROM words) + (SELECT COUNT(*) FROM phrases) + (SELECT COUNT(*) FROM notes)
              + (SELECT COUNT(*) FROM grammar_progress) AS n`,
      )[0].n > 0;
    },

    exportFile() {
      return db.export();
    },

    // Valida la copia sin tocar los datos actuales. Devuelve cuántas palabras tiene
    // y apply() para sustituir la base de datos, o discard() para descartarla.
    readBackup(bytes) {
      const backup = openBackup(SQL, bytes);
      return {
        wordCount: backup.exec('SELECT COUNT(*) FROM words')[0].values[0][0],
        phraseCount: backup.exec('SELECT COUNT(*) FROM phrases')[0].values[0][0],
        noteCount: backup.exec('SELECT COUNT(*) FROM notes')[0].values[0][0],
        async apply() {
          db.close();
          db = backup;
          await flush();
        },
        discard() {
          backup.close();
        },
      };
    },

    countWords() {
      return all('SELECT COUNT(*) AS n FROM words')[0].n;
    },

    async addWord(word, today) {
      db.run(
        `INSERT INTO words (word_en, translation_es, example_sentence, category, cefr_level, source,
                            date_added, next_review_date)
         VALUES (:word_en, :translation_es, :example_sentence, :category, :cefr_level, :source,
                 :today, :today)`,
        {
          ':word_en': word.word_en,
          ':translation_es': word.translation_es,
          ':example_sentence': word.example_sentence || null,
          ':category': word.category || null,
          ':cefr_level': word.cefr_level || null,
          ':source': word.source || null,
          ':today': today,
        },
      );
      await flush();
    },

    async deleteWord(id) {
      db.run('DELETE FROM words WHERE id = :id', { ':id': id });
      await flush();
    },

    async saveReview(id, s) {
      db.run(
        `UPDATE words
            SET ease_factor = :ease, interval_days = :interval, repetitions = :reps,
                next_review_date = :next, last_review_date = :last,
                first_review_date = COALESCE(first_review_date, :last)
          WHERE id = :id`,
        {
          ':ease': s.ease_factor,
          ':interval': s.interval_days,
          ':reps': s.repetitions,
          ':next': s.next_review_date,
          ':last': s.last_review_date,
          ':id': id,
        },
      );
      await flush();
    },

    listWords() {
      return all('SELECT * FROM words ORDER BY date_added DESC, id DESC');
    },

    async setSuspended(ids, suspended) {
      const wanted = ids.map(Number).filter(Number.isInteger);
      if (wanted.length === 0) return;
      db.run(`UPDATE words SET suspended = :s WHERE id IN (${wanted.join(',')})`, { ':s': suspended ? 1 : 0 });
      await flush();
    },

    // Cuántas palabras entran en el filtro de estudio (sin contar las pausadas).
    countStudy(filter) {
      const f = studyWhere(filter);
      return all(`SELECT COUNT(*) AS n FROM words WHERE ${f.where}`, f.params)[0].n;
    },

    // Sesión de hoy: primero todos los repasos pendientes (los más atrasados antes,
    // mezclados entre sí) y después las nuevas, por orden de llegada, hasta el límite diario.
    practiceQueue(today, newPerDay, filter) {
      const f = studyWhere(filter);
      const reviews = all(
        `SELECT * FROM words
          WHERE first_review_date IS NOT NULL AND next_review_date <= :today AND ${f.where}
          ORDER BY next_review_date, RANDOM()`,
        { ':today': today, ...f.params },
      );
      const fresh = all(
        `SELECT * FROM words WHERE first_review_date IS NULL AND next_review_date <= :today AND ${f.where}
          ORDER BY date_added, id LIMIT :quota`,
        { ':today': today, ':quota': newQuota(today, newPerDay), ...f.params },
      );
      return { words: [...reviews, ...fresh], newWaiting: countNew(today, filter) - fresh.length };
    },

    // Lo mismo que practiceQueue(...).words.length, sin cargar las palabras.
    countDue(today, newPerDay, filter) {
      const f = studyWhere(filter);
      const reviews = all(
        `SELECT COUNT(*) AS n FROM words
          WHERE first_review_date IS NOT NULL AND next_review_date <= :today AND ${f.where}`,
        { ':today': today, ...f.params },
      )[0].n;
      return reviews + Math.min(countNew(today, filter), newQuota(today, newPerDay));
    },

    // Práctica libre: cualquier palabra del filtro, esté o no pendiente. `limit` 0 = todas.
    //   random → al azar · hard → menor factor de facilidad (las que más fallas) · recent → últimas añadidas
    freePracticeWords(order, limit, filter) {
      const orderBy = {
        random: 'RANDOM()',
        hard: 'ease_factor ASC, repetitions ASC, RANDOM()',
        recent: 'date_added DESC, id DESC',
      }[order] ?? 'RANDOM()';
      const f = studyWhere(filter);
      return all(`SELECT * FROM words WHERE ${f.where} ORDER BY ${orderBy} LIMIT :limit`, {
        ':limit': limit > 0 ? limit : -1,
        ...f.params,
      });
    },

    wordsByIds(ids) {
      const wanted = ids.map(Number).filter(Number.isInteger);
      if (wanted.length === 0) return [];
      return all(`SELECT * FROM words WHERE id IN (${wanted.join(',')})`);
    },

    // Traducciones de otras palabras para la opción múltiple (mejor si son de la misma categoría).
    distractors(word, n) {
      const rows = all(
        `SELECT translation_es FROM words
          WHERE id <> :id AND lower(translation_es) <> lower(:t)
          ORDER BY (category IS :cat) DESC, RANDOM() LIMIT 20`,
        { ':id': word.id, ':t': word.translation_es, ':cat': word.category },
      );
      const seen = new Set();
      const picked = [];
      for (const { translation_es: t } of rows) {
        const key = t.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push(t);
        if (picked.length === n) break;
      }
      return picked;
    },

    // Próximo día con repasos y cuántas palabras tocan ese día.
    nextReview(today, filter) {
      const f = studyWhere(filter);
      return (
        all(
          `SELECT next_review_date AS date, COUNT(*) AS n FROM words
            WHERE next_review_date > :today AND ${f.where}
            GROUP BY next_review_date ORDER BY next_review_date LIMIT 1`,
          { ':today': today, ...f.params },
        )[0] ?? null
      );
    },

    // ---------- Gramática ----------

    // { unit_id: fila } con el progreso de cada unidad (las no empezadas no aparecen).
    grammarProgress() {
      return Object.fromEntries(all('SELECT * FROM grammar_progress').map((r) => [r.unit_id, r]));
    },

    // Resultado de hacer los ejercicios de una unidad.
    async saveGrammarAttempt(unitId, ok, total, today) {
      const row = grammarRow(unitId);
      const mastered = total > 0 && ok / total >= MASTERY;
      if (!row.best_total || ok / total > row.best_ok / row.best_total) {
        row.best_ok = ok;
        row.best_total = total;
      }
      row.attempts += 1;
      row.last_practiced = today;
      if (mastered && row.status !== 'dominado') scheduleFirstReview(row, today);
      if (!mastered) Object.assign(row, { status: 'en_proceso', reviews: 0, next_review_date: null });
      await saveGrammarRow(row);
    },

    // Casilla "Marcar como dominada".
    async setGrammarMastered(unitId, mastered, today) {
      const row = grammarRow(unitId);
      if (mastered && row.status !== 'dominado') scheduleFirstReview(row, today);
      if (!mastered) Object.assign(row, { status: 'en_proceso', reviews: 0, next_review_date: null });
      await saveGrammarRow(row);
    },

    // Unidades con repaso pendiente hoy (dominadas, o falladas en un repaso anterior).
    grammarDue(today) {
      return all(
        `SELECT * FROM grammar_progress WHERE next_review_date IS NOT NULL AND next_review_date <= :today
          ORDER BY next_review_date`,
        { ':today': today },
      );
    },

    // Repaso espaciado: si se supera, el siguiente es más tarde; si no, vuelve mañana.
    async recordGrammarReview(unitId, passed, today) {
      const row = grammarRow(unitId);
      row.last_practiced = today;
      if (passed) {
        row.status = 'dominado';
        row.reviews += 1;
        row.next_review_date = addDays(today, REVIEW_STEPS[Math.min(row.reviews, REVIEW_STEPS.length - 1)]);
      } else {
        Object.assign(row, { status: 'en_proceso', reviews: 0, next_review_date: addDays(today, 1) });
      }
      await saveGrammarRow(row);
    },

    // ---------- Cuaderno ----------

    async createNote({ promptId = null, wordIds = [] } = {}) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO notes (prompt_id, word_ids, created_at, updated_at) VALUES (:prompt, :words, :now, :now)`,
        { ':prompt': promptId, ':words': JSON.stringify(wordIds), ':now': now },
      );
      const id = all('SELECT last_insert_rowid() AS id')[0].id;
      await flush();
      return id;
    },

    async updateNote(id, fields) {
      const keys = Object.keys(fields).filter((k) => NOTE_FIELDS.includes(k));
      if (keys.length === 0) return;
      const params = { ':id': id, ':now': new Date().toISOString() };
      for (const k of keys) params[`:${k}`] = fields[k];
      db.run(
        `UPDATE notes SET ${keys.map((k) => `${k} = :${k}`).join(', ')}, updated_at = :now WHERE id = :id`,
        params,
      );
      await flush();
    },

    async deleteNote(id) {
      db.run('DELETE FROM notes WHERE id = :id', { ':id': id });
      await flush();
    },

    getNote(id) {
      return all('SELECT * FROM notes WHERE id = :id', { ':id': id })[0] ?? null;
    },

    listNotes() {
      return all('SELECT * FROM notes ORDER BY updated_at DESC, id DESC');
    },

    countNotes() {
      return all('SELECT COUNT(*) AS n FROM notes')[0].n;
    },

    // ---------- Frases ----------

    async addPhrase(text, lang) {
      db.run(
        `INSERT INTO phrases (original_text, original_lang, created_at) VALUES (:text, :lang, :now)`,
        { ':text': text, ':lang': lang, ':now': new Date().toISOString() },
      );
      await flush();
    },

    async updatePhrase(id, fields) {
      const keys = Object.keys(fields).filter((k) => PHRASE_FIELDS.includes(k));
      if (keys.length === 0) return;
      const params = { ':id': id };
      for (const k of keys) params[`:${k}`] = fields[k];
      db.run(`UPDATE phrases SET ${keys.map((k) => `${k} = :${k}`).join(', ')} WHERE id = :id`, params);
      await flush();
    },

    async deletePhrase(id) {
      db.run('DELETE FROM phrases WHERE id = :id', { ':id': id });
      await flush();
    },

    // Las que fallaron (p. ej. sin conexión) vuelven a la cola.
    async retryFailedPhrases() {
      db.run(`UPDATE phrases SET status = 'pending', error = NULL WHERE status = 'error'`);
      await flush();
    },

    listPhrases() {
      return all('SELECT * FROM phrases ORDER BY created_at DESC, id DESC');
    },

    pendingPhrases() {
      return all(`SELECT * FROM phrases WHERE status = 'pending' ORDER BY id`);
    },

    countPhrases() {
      return all('SELECT COUNT(*) AS n FROM phrases')[0].n;
    },

    sources() {
      return all(
        `SELECT DISTINCT source FROM words WHERE source IS NOT NULL AND source <> '' ORDER BY source`,
      ).map((r) => r.source);
    },
  };
}
