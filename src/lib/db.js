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

export const CATEGORIES = ['verbo', 'sustantivo', 'adjetivo', 'adverbio', 'preposición', 'phrasal verb', 'expresión', 'otro'];
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

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
  // v7: imagen de la palabra (data URL JPEG reducida, o URL externa) con su autoría, traducción
  // del ejemplo principal (example_sentence) y ejemplos extra (escritos por ti o buscados).
  `
  ALTER TABLE words ADD COLUMN example_es TEXT;
  ALTER TABLE words ADD COLUMN image TEXT;
  ALTER TABLE words ADD COLUMN image_credit TEXT;
  CREATE TABLE word_examples (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id    INTEGER NOT NULL,
    text_en    TEXT NOT NULL,
    text_es    TEXT,
    source     TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','auto')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_word_examples_word ON word_examples (word_id);
  `,
  // v8: grupos y subgrupos (parent_id) de palabras; una palabra puede estar en varios.
  // words se reconstruye sin las restricciones CHECK de categoría y nivel (para admitir A1, C1 y
  // nuevas categorías) y con import_order: posición en una lista importada (NULL = añadida a mano;
  // las añadidas a mano se aprenden antes que las de las listas).
  `
  CREATE TABLE words_new (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    word_en          TEXT    NOT NULL,
    translation_es   TEXT    NOT NULL,
    example_sentence TEXT,
    category         TEXT,
    cefr_level       TEXT,
    source           TEXT,
    date_added       TEXT    NOT NULL,
    ease_factor      REAL    NOT NULL DEFAULT ${INITIAL_EASE},
    interval_days    INTEGER NOT NULL DEFAULT 0,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    next_review_date TEXT    NOT NULL,
    last_review_date TEXT,
    first_review_date TEXT,
    suspended        INTEGER NOT NULL DEFAULT 0,
    example_es       TEXT,
    image            TEXT,
    image_credit     TEXT,
    import_order     INTEGER
  );
  INSERT INTO words_new (id, word_en, translation_es, example_sentence, category, cefr_level, source, date_added,
                         ease_factor, interval_days, repetitions, next_review_date, last_review_date,
                         first_review_date, suspended, example_es, image, image_credit)
    SELECT id, word_en, translation_es, example_sentence, category, cefr_level, source, date_added,
           ease_factor, interval_days, repetitions, next_review_date, last_review_date,
           first_review_date, suspended, example_es, image, image_credit
      FROM words;
  DROP TABLE words;
  ALTER TABLE words_new RENAME TO words;
  CREATE INDEX idx_words_next_review ON words (next_review_date);
  CREATE TABLE vocab_groups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    parent_id  INTEGER,
    emoji      TEXT,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE word_groups (
    word_id  INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    PRIMARY KEY (word_id, group_id)
  );
  CREATE INDEX idx_word_groups_group ON word_groups (group_id);
  `,
];

// Ids de un grupo y todos sus subgrupos (subconsulta SQL). `list` = ids separados por comas.
const groupTreeSql = (list) => `
  WITH RECURSIVE tree(id) AS (
    SELECT id FROM vocab_groups WHERE id IN (${list})
    UNION SELECT g.id FROM vocab_groups g JOIN tree ON g.parent_id = tree.id
  ) SELECT id FROM tree`;

const intList = (ids) => ids.map(Number).filter(Number.isInteger).join(',');

// Campos de una palabra que se pueden cambiar después de añadirla.
const WORD_FIELDS = ['example_sentence', 'example_es', 'image', 'image_credit'];

// Filtro de estudio { levels, categories, sources }: cada lista vacía = sin filtrar por ella;
// '' dentro de una lista = palabras sin ese dato. Las pausadas siempre quedan fuera.
function studyWhere(filter = {}) {
  // Sin traducción todavía (lista importada a medio traducir): no se puede practicar.
  const parts = ['suspended = 0', "translation_es <> ''"];
  const groups = intList(filter.groups ?? []);
  if (groups) parts.push(`id IN (SELECT word_id FROM word_groups WHERE group_id IN (${groupTreeSql(groups)}))`);
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
      const id = all('SELECT last_insert_rowid() AS id')[0].id;
      await flush();
      return id;
    },

    findWord(wordEn) {
      return all('SELECT * FROM words WHERE lower(word_en) = lower(:w)', { ':w': wordEn.trim() })[0] ?? null;
    },

    getWord(id) {
      return all('SELECT * FROM words WHERE id = :id', { ':id': id })[0] ?? null;
    },

    async updateWord(id, fields) {
      const keys = Object.keys(fields).filter((k) => WORD_FIELDS.includes(k));
      if (keys.length === 0) return;
      const params = { ':id': id };
      for (const k of keys) params[`:${k}`] = fields[k] === '' ? null : fields[k];
      db.run(`UPDATE words SET ${keys.map((k) => `${k} = :${k}`).join(', ')} WHERE id = :id`, params);
      await flush();
    },

    async deleteWord(id) {
      db.run('DELETE FROM words WHERE id = :id', { ':id': id });
      db.run('DELETE FROM word_examples WHERE word_id = :id', { ':id': id });
      db.run('DELETE FROM word_groups WHERE word_id = :id', { ':id': id });
      await flush();
    },

    // ---------- Grupos ----------

    // Todos los grupos con cuántas palabras tienen (contando subgrupos) y su progreso:
    // nuevas (sin empezar), aprendiendo y dominadas (repaso a 21 días o más).
    listGroups() {
      const groups = all('SELECT * FROM vocab_groups ORDER BY position, name COLLATE NOCASE');
      for (const g of groups) {
        Object.assign(
          g,
          all(
            `SELECT COUNT(*) AS total,
                    SUM(first_review_date IS NULL) AS fresh,
                    SUM(first_review_date IS NOT NULL AND interval_days >= 21) AS mastered,
                    SUM(suspended) AS paused,
                    SUM(translation_es = '') AS untranslated
               FROM words
              WHERE id IN (SELECT word_id FROM word_groups WHERE group_id IN (${groupTreeSql(g.id)}))`,
          )[0],
        );
        for (const k of ['fresh', 'mastered', 'paused', 'untranslated']) g[k] ??= 0;
      }
      return groups;
    },

    groupIds() {
      return all('SELECT id FROM vocab_groups').map((r) => r.id);
    },

    async createGroup(name, parentId = null, emoji = null) {
      const position = all('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM vocab_groups')[0].p;
      db.run(
        `INSERT INTO vocab_groups (name, parent_id, emoji, position, created_at) VALUES (:n, :p, :e, :pos, :now)`,
        { ':n': name, ':p': parentId, ':e': emoji || null, ':pos': position, ':now': new Date().toISOString() },
      );
      const id = all('SELECT last_insert_rowid() AS id')[0].id;
      await flush();
      return id;
    },

    async updateGroup(id, { name, emoji, parentId }) {
      // No se puede mover un grupo dentro de sí mismo o de uno de sus subgrupos.
      if (parentId != null) {
        const inside = all(`${groupTreeSql(id)}`).some((r) => r.id === Number(parentId));
        if (inside) throw new Error('No puedes mover un grupo dentro de sí mismo.');
      }
      const sets = [];
      const params = { ':id': id };
      if (name !== undefined) (sets.push('name = :n'), (params[':n'] = name));
      if (emoji !== undefined) (sets.push('emoji = :e'), (params[':e'] = emoji || null));
      if (parentId !== undefined) (sets.push('parent_id = :p'), (params[':p'] = parentId));
      if (!sets.length) return;
      db.run(`UPDATE vocab_groups SET ${sets.join(', ')} WHERE id = :id`, params);
      await flush();
    },

    // Borra el grupo y sus subgrupos. Las palabras se conservan, salvo con withWords: entonces se
    // borran también las que llegaron con una lista importada (nunca las añadidas a mano) y no
    // están en ningún otro grupo.
    async deleteGroup(id, { withWords = false } = {}) {
      const ids = all(groupTreeSql(id)).map((r) => r.id).join(',');
      db.run('BEGIN');
      if (withWords) {
        db.run(
          `DELETE FROM words WHERE import_order IS NOT NULL
             AND id IN (SELECT word_id FROM word_groups WHERE group_id IN (${ids}))
             AND id NOT IN (SELECT word_id FROM word_groups WHERE group_id NOT IN (${ids}))`,
        );
        db.run('DELETE FROM word_examples WHERE word_id NOT IN (SELECT id FROM words)');
      }
      db.run(`DELETE FROM word_groups WHERE group_id IN (${ids})`);
      db.run(`DELETE FROM vocab_groups WHERE id IN (${ids})`);
      db.run('COMMIT');
      await flush();
    },

    async addToGroup(wordIds, groupId) {
      const ids = intList(wordIds);
      if (!ids) return;
      db.run(
        `INSERT OR IGNORE INTO word_groups (word_id, group_id) SELECT id, :g FROM words WHERE id IN (${ids})`,
        { ':g': groupId },
      );
      await flush();
    },

    async removeFromGroup(wordIds, groupId) {
      const ids = intList(wordIds);
      if (!ids) return;
      // También de sus subgrupos: "quitar de Oxford 3000" la saca de todo ese grupo.
      db.run(`DELETE FROM word_groups WHERE group_id IN (${groupTreeSql(Number(groupId))}) AND word_id IN (${ids})`);
      await flush();
    },

    // { word_id: [group_id, …] } (solo pertenencia directa).
    wordGroupMap() {
      const map = {};
      for (const r of all('SELECT word_id, group_id FROM word_groups')) (map[r.word_id] ??= []).push(r.group_id);
      return map;
    },

    // Ids de las palabras de un grupo (con sus subgrupos), en el orden de la lista importada.
    groupWordIds(groupId) {
      return all(
        `SELECT id FROM words WHERE id IN (SELECT word_id FROM word_groups WHERE group_id IN (${groupTreeSql(groupId)}))
          ORDER BY (import_order IS NOT NULL), import_order, date_added, id`,
      ).map((r) => r.id);
    },

    // ---------- Importar listas ----------

    // entries: [{ word_en, translation_es?, cefr_level?, category? }] en el orden de la lista.
    // Las que ya existen (mismo inglés) no se duplican: se añaden al grupo y se completan sus datos
    // vacíos. Las nuevas entran como palabras nuevas, a continuación de las listas ya importadas.
    // subgroupOf(entry) → id de subgrupo (opcional). Devuelve { added, existing }.
    async importWords(entries, { groupId, source, today, subgroupOf }) {
      const existing = new Map(all('SELECT id, lower(word_en) AS k FROM words').map((r) => [r.k, r.id]));
      let order = all('SELECT COALESCE(MAX(import_order), 0) AS m FROM words')[0].m;
      let added = 0;
      let already = 0;
      db.run('BEGIN');
      try {
        for (const e of entries) {
          const key = e.word_en.trim().toLowerCase();
          let id = existing.get(key);
          if (id) {
            already++;
            db.run(
              `UPDATE words SET cefr_level = COALESCE(cefr_level, :lv), category = COALESCE(category, :cat),
                                translation_es = CASE WHEN translation_es = '' THEN :t ELSE translation_es END
                WHERE id = :id`,
              { ':lv': e.cefr_level || null, ':cat': e.category || null, ':t': e.translation_es || '', ':id': id },
            );
          } else {
            db.run(
              `INSERT INTO words (word_en, translation_es, category, cefr_level, source, date_added, next_review_date, import_order)
               VALUES (:w, :t, :cat, :lv, :src, :today, :today, :ord)`,
              {
                ':w': e.word_en.trim(),
                ':t': e.translation_es || '',
                ':cat': e.category || null,
                ':lv': e.cefr_level || null,
                ':src': source || null,
                ':today': today,
                ':ord': ++order,
              },
            );
            id = all('SELECT last_insert_rowid() AS id')[0].id;
            existing.set(key, id);
            added++;
          }
          db.run('INSERT OR IGNORE INTO word_groups (word_id, group_id) VALUES (:w, :g)', { ':w': id, ':g': groupId });
          const sub = subgroupOf?.(e);
          if (sub) db.run('INSERT OR IGNORE INTO word_groups (word_id, group_id) VALUES (:w, :g)', { ':w': id, ':g': sub });
        }
        db.run('COMMIT');
      } catch (err) {
        db.run('ROLLBACK');
        throw err;
      }
      await flush();
      return { added, existing: already };
    },

    // Palabras aún sin traducir (de listas importadas), en orden de lista. Con groupId, solo las de ese grupo.
    untranslatedWords(groupId = null) {
      const inGroup = groupId
        ? `AND id IN (SELECT word_id FROM word_groups WHERE group_id IN (${groupTreeSql(groupId)}))`
        : '';
      return all(
        `SELECT id, word_en, category FROM words WHERE translation_es = '' ${inGroup}
          ORDER BY (import_order IS NOT NULL), import_order, id`,
      );
    },

    // translations: [{ id, translation_es }] en una sola escritura.
    async setTranslations(translations) {
      if (!translations.length) return;
      db.run('BEGIN');
      for (const t of translations) {
        db.run('UPDATE words SET translation_es = :t WHERE id = :id', { ':t': t.translation_es, ':id': t.id });
      }
      db.run('COMMIT');
      await flush();
    },

    // ---------- Ejemplos extra de cada palabra ----------

    listExamples(wordId) {
      return all('SELECT * FROM word_examples WHERE word_id = :id ORDER BY id', { ':id': wordId });
    },

    // { word_id: n } para el listado.
    exampleCounts() {
      return Object.fromEntries(
        all('SELECT word_id, COUNT(*) AS n FROM word_examples GROUP BY word_id').map((r) => [r.word_id, r.n]),
      );
    },

    async addExample(wordId, { en, es = null, source = 'manual' }) {
      db.run(
        `INSERT INTO word_examples (word_id, text_en, text_es, source, created_at)
         VALUES (:w, :en, :es, :src, :now)`,
        { ':w': wordId, ':en': en, ':es': es || null, ':src': source, ':now': new Date().toISOString() },
      );
      await flush();
    },

    async deleteExample(id) {
      db.run('DELETE FROM word_examples WHERE id = :id', { ':id': id });
      await flush();
    },

    // Convierte un ejemplo extra en el principal (el que sale en la práctica y en "completar la frase");
    // el principal anterior pasa a la lista de extras.
    async makeMainExample(exampleId) {
      const ex = all('SELECT * FROM word_examples WHERE id = :id', { ':id': exampleId })[0];
      if (!ex) return;
      const word = all('SELECT * FROM words WHERE id = :id', { ':id': ex.word_id })[0];
      db.run('BEGIN');
      if (word?.example_sentence) {
        db.run(
          `INSERT INTO word_examples (word_id, text_en, text_es, source, created_at)
           VALUES (:w, :en, :es, 'manual', :now)`,
          { ':w': ex.word_id, ':en': word.example_sentence, ':es': word.example_es, ':now': new Date().toISOString() },
        );
      }
      db.run('UPDATE words SET example_sentence = :en, example_es = :es WHERE id = :w', {
        ':en': ex.text_en,
        ':es': ex.text_es,
        ':w': ex.word_id,
      });
      db.run('DELETE FROM word_examples WHERE id = :id', { ':id': exampleId });
      db.run('COMMIT');
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

    // "Ya las sé": cuentan como dominadas y vuelven dentro de 30-60 días (repartidas al azar para
    // que no lleguen todas el mismo día). Si fallas en ese repaso, SM-2 las reprograma como siempre.
    async markKnown(ids, today) {
      const wanted = intList(ids);
      if (!wanted) return;
      db.run(
        `UPDATE words
            SET repetitions = MAX(repetitions, 3), interval_days = MAX(interval_days, 30), ease_factor = MAX(ease_factor, 2.6),
                first_review_date = COALESCE(first_review_date, :today), last_review_date = :today,
                next_review_date = date(:today, '+' || (30 + abs(random()) % 31) || ' days')
          WHERE id IN (${wanted})`,
        { ':today': today },
      );
      await flush();
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
        // Primero las añadidas a mano y después las de listas importadas, en el orden de la lista.
        `SELECT * FROM words WHERE first_review_date IS NULL AND next_review_date <= :today AND ${f.where}
          ORDER BY (import_order IS NOT NULL), import_order, date_added, id LIMIT :quota`,
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
