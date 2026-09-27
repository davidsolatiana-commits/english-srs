// Análisis gramatical local (sin IA, gratis, funciona sin conexión una vez cargado).
//
// - compromise (NLP en el navegador) da la función de cada palabra, los tiempos
//   verbales, los phrasal verbs y los comparativos.
// - Reglas propias sobre la frase detectan las estructuras del temario A2–B2
//   (condicionales, pasiva, inversión, causativa…), que compromise no distingue bien.
//
// Es aproximado: acierta en frases normales y puede fallar en las muy complejas.

import { DETECTIONS } from './grammarDetections.js';
import { UNITS, UNIT_BY_ID } from './grammar.js';

let nlpPromise;
function loadNlp() {
  nlpPromise ??= import('compromise').then((m) => m.default);
  return nlpPromise;
}

// ---------- Vocabulario auxiliar para las reglas ----------

const IRREGULAR_PP = [
  'been', 'done', 'gone', 'seen', 'known', 'taken', 'given', 'made', 'written', 'eaten', 'driven', 'spoken',
  'broken', 'chosen', 'forgotten', 'gotten', 'got', 'begun', 'drunk', 'sung', 'swum', 'run', 'come', 'become',
  'bought', 'brought', 'thought', 'taught', 'caught', 'found', 'told', 'sold', 'said', 'paid', 'had', 'heard',
  'held', 'kept', 'left', 'lost', 'meant', 'met', 'read', 'sent', 'spent', 'stood', 'understood', 'won', 'built',
  'cut', 'put', 'hit', 'hurt', 'let', 'set', 'shut', 'cost', 'felt', 'fallen', 'flown', 'grown', 'hidden',
  'ridden', 'risen', 'shaken', 'stolen', 'thrown', 'woken', 'worn', 'born', 'beaten', 'bitten', 'blown', 'drawn',
  'forgiven', 'frozen', 'shown', 'slept', 'sat', 'fought', 'led', 'fed', 'lent', 'lit', 'dealt', 'dreamt',
  'learnt', 'burnt', 'spelt', 'withdrawn', 'sworn', 'torn', 'hung', 'struck', 'stuck', 'sunk', 'shot', 'spread',
  'split', 'quit', 'bet', 'bent', 'bound', 'bred', 'dug', 'fled', 'flung', 'forbidden', 'ground', 'laid', 'lain',
  'overcome', 'proven', 'sought', 'shone', 'slid', 'spun', 'swept', 'swung', 'wept', 'wound', 'wrung', 'arisen',
];
// Palabras en -ed que no son participios.
const NOT_PP_ED = 'red|bed|need|seed|speed|weed|deed|greed|indeed|exceed|proceed|succeed|feed|breed|bleed|hundred|sacred|naked|wicked|kindred|shed';
// Participio pasado (regular o irregular).
const PP = `(?:(?!(?:${NOT_PP_ED})\\b)[a-z]+ed|${IRREGULAR_PP.join('|')})`;
// Participios que tras "be" suelen ser adjetivos ("I'm tired"), no pasiva.
const ADJ_PP =
  'tired|bored|interested|excited|worried|married|scared|surprised|pleased|disappointed|confused|embarrassed|' +
  'annoyed|amazed|relaxed|satisfied|frightened|shocked|stressed|exhausted|located|supposed|used|convinced|' +
  'delighted|determined|involved|prepared|qualified|concerned|dressed|done|gone|lost|engaged|' +
  'fed|advanced|experienced|talented|related|based|allowed|obsessed|impressed|terrified|thrilled|upset|hurt';
// Palabras en -ing que tras "be" suelen ser adjetivos o sustantivos, no tiempo continuo.
const NOT_CONTINUOUS_ING =
  'interesting|boring|amazing|exciting|surprising|tiring|annoying|confusing|embarrassing|frightening|' +
  'disappointing|relaxing|fascinating|shocking|charming|willing|missing|something|nothing|anything|everything|' +
  'morning|evening|ceiling|king|ring|wedding|during|thing|amusing|challenging|convincing|depressing|' +
  'encouraging|entertaining|exhausting|inspiring|promising|refreshing|satisfying|terrifying|worrying';

// ---------- Utilidades de texto ----------

// Minúsculas, apóstrofos rectos y contracciones desplegadas: "I'd've" no, pero sí
// "can't" → "can not", "I'm" → "i am", "she'd left" → "she had left", "I'd go" → "i would go".
function expand(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am')
    .replace(/'re\b/g, ' are')
    .replace(/'ve\b/g, ' have')
    .replace(/'ll\b/g, ' will')
    .replace(new RegExp(`'d(?=\\s+(?:not\\s+|never\\s+|already\\s+|just\\s+)?(?:better\\b|${PP}\\b))`, 'g'), ' had')
    .replace(/'d\b/g, ' would')
    .replace(/'s(?=\s+been\b)/g, ' has')
    .replace(/\b(he|she|it|that|what|who|there|here|where|how)'s\b/g, '$1 is')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function snippet(text, max = 60) {
  const clean = text.trim().replace(/[.,;:!?]+$/, '').replace(/\bi\b/g, 'I');
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

// ---------- Estructuras del temario ----------

// Añade una estructura (id del temario, o etiqueta libre si no está en el temario).
function add(found, key, evidence, extra = {}) {
  if (!evidence || found.has(key)) return;
  found.set(key, { evidence: snippet(evidence), ...extra });
}

function detectStructures(raw, found) {
  const t = expand(raw);
  const endsWithQuestion = /\?\s*$/.test(t);
  const find = (re) => t.match(re)?.[0] ?? null;

  // Condicionales. "asked if" / "don't know if" no son condicionales (if = whether).
  const ifIsWhether = /\b(ask|asks|asked|wonder|wonders|wondered|know|knew|sure|check|see)\s+if\b/.test(t);
  const hasIf = /\b(if|unless)\b/.test(t) && !ifIsWhether && !/\bif only\b/.test(t);
  let perfectConditional = false;
  if (hasIf) {
    const ifClause = find(/\b(?:if|unless)\b[^,.;!?]*/);
    const ifHadPP = new RegExp(`\\b(?:if|unless)\\b[^.?!]*?\\bhad\\s+(?:not\\s+)?${PP}\\b`).test(t);
    const modalHavePP = find(new RegExp(`\\b(?:would|could|might)\\s+(?:not\\s+)?have\\s+${PP}\\b`));
    const modalBase = find(/\b(?:would|could|might)\s+(?:not\s+)?(?!have\b|not\b)[a-z]+/);
    if (ifHadPP && modalHavePP) {
      add(found, 'third-conditional', `${ifClause} … ${modalHavePP}`);
      perfectConditional = true;
    } else if ((ifHadPP && modalBase) || (!ifHadPP && modalHavePP)) {
      add(found, 'mixed-conditionals', `${ifClause} … ${modalHavePP || modalBase}`);
      perfectConditional = true;
    } else if (modalBase) {
      add(found, 'second-conditional', `${ifClause} … ${modalBase}`);
    } else if (
      /\b(will|can|may|might|should|must|shall)\b/.test(t) ||
      /^(?:if|unless)\b[^,]+,\s*(?!(?:i|you|he|she|it|we|they|the|there|this|that)\b)[a-z]+/.test(t)
    ) {
      add(found, 'first-conditional', ifClause);
    } else {
      add(found, 'zero-conditional', ifClause, { label: 'Zero conditional (condicional cero)' });
    }
  }

  add(found, 'wish', find(/\b(?:wish|wishes|wished)\b[^,.;!?]*|\bif only\b[^,.;!?]*/));

  // used to (hábito pasado) ≠ be/get used to (estar acostumbrado).
  const beUsedTo = find(/\b(?:be|am|is|are|was|were|been|being|get|gets|got|getting|become|became)\s+(?:not\s+)?used to\b[^,.;!?]*/);
  if (beUsedTo) add(found, 'be-used-to', beUsedTo, { label: 'be/get used to (estar acostumbrado)' });
  else add(found, 'used-to', find(/\b(?:used to|did not use to)\s+[a-z]+/));

  // Tiempos perfectos.
  add(found, 'present-perfect-continuous', find(/\b(?:have|has)\s+(?:not\s+|never\s+|just\s+|already\s+)?been\s+[a-z]+ing\b/));
  add(found, 'past-perfect-continuous', find(/\bhad\s+(?:not\s+|never\s+|just\s+|already\s+)?been\s+[a-z]+ing\b/), {
    label: 'Past perfect continuous',
  });
  if (!perfectConditional) {
    add(found, 'past-perfect', find(new RegExp(`\\bhad\\s+(?:not\\s+|never\\s+|already\\s+|just\\s+|ever\\s+)?(?!better\\b)${PP}\\b`)));
  }
  const presentPerfect =
    find(
      new RegExp(
        `(?<!\\b(?:would|could|might|must|should|may|will|can|not)\\s)\\b(?:have|has)\\s+` +
          `(?:not\\s+|never\\s+|ever\\s+|just\\s+|already\\s+|recently\\s+)?(?!been\\s+[a-z]+ing\\b)(?!got\\b)${PP}\\b`,
      ),
    ) ?? find(new RegExp(`^(?:have|has)\\s+[a-z]+\\s+(?:ever\\s+|never\\s+|already\\s+|just\\s+)?${PP}\\b`));
  add(found, 'present-perfect', presentPerfect);

  // Modales.
  const deduction = perfectConditional
    ? null
    : find(new RegExp(`\\b(?:must|might|may|could|can|should)\\s+(?:not\\s+)?have\\s+${PP}\\b`));
  add(found, 'past-deduction-modals', deduction);
  const withoutDeduction = deduction ? t.replace(deduction, '') : t;
  if (!deduction) {
    add(found, 'probability-modals', find(/\b(?:might|may)\s+(?:not\s+)?(?!have\b|i\b)[a-z]+|\bcould\s+(?:not\s+)?be\b/));
  }
  add(
    found,
    'basic-modals',
    withoutDeduction.match(/\b(?:can|must|should|have to|has to|had to|ought to)\s+(?:not\s+)?[a-z]+|^may i\b/)?.[0],
  );

  // Futuros.
  const goingTo = find(
    /\b(?:am|is|are|was|were)\s+(?:not\s+)?going\s+to\s+(?!(?:the|a|an|my|your|his|her|its|our|their|this|that|these|those|school|work|bed|church|hospital|university|college|town|london|paris|spain)\b)[a-z]+/,
  );
  add(found, 'going-to', goingTo);
  add(found, 'future-perfect', find(new RegExp(`\\bwill\\s+(?:not\\s+)?have\\s+${PP}\\b`)), { label: 'Future perfect' });
  if (!found.has('first-conditional')) add(found, 'will', find(/\bwill\s+(?:not\s+)?(?!have\s)[a-z]+/));

  // Continuos.
  const continuous = (be) =>
    find(new RegExp(`\\b(?:${be})\\s+(?:not\\s+)?(?!being\\b)(?!(?:${NOT_CONTINUOUS_ING})\\b)[a-z]{2,}ing\\b`));
  const presentContinuous = continuous('am|is|are');
  if (!(goingTo && presentContinuous?.includes('going'))) add(found, 'present-continuous', presentContinuous);
  const pastContinuous = continuous('was|were');
  if (!(goingTo && pastContinuous?.includes('going'))) add(found, 'past-continuous', pastContinuous);

  // Pasiva: básica con am/is/are/was/were; avanzada con be/been/being (modales, perfectos, continuos).
  const passive = t.match(
    new RegExp(`\\b(am|is|are|was|were|be|been|being)\\s+(?:not\\s+)?(?:[a-z]+ly\\s+)?(?!(?:${ADJ_PP})\\b)${PP}\\b`),
  );
  if (passive) add(found, /^(be|been|being)$/.test(passive[1]) ? 'passive-advanced' : 'passive-basic', passive[0]);

  add(found, 'causative', find(
    new RegExp(`\\b(?:have|has|had|having|get|gets|got|getting)\\s+(?:my|your|his|her|its|our|their|the|a|an|it|them)\\s+(?:[a-z]+\\s+){0,2}?${PP}\\b`),
  ));

  add(found, 'there-is-are', find(/\bthere\s+(?:is|are|was|were|will be|has been|have been|had been|used to be)\b|\bthere's\b/));
  if (endsWithQuestion) add(found, 'question-words', find(/^(?:what|where|when|who|whom|whose|which|why|how)\b/));
  add(found, 'countable-uncountable', find(/(?<!\bvery\s)\b(?:how\s+)?(?:much|many)\b(?:\s+[a-z]+)?/));
  add(found, 'quantifiers', find(/\b(?:a few|a little|several|plenty of|a lot of|lots of|a great deal of|a number of|hardly any|a couple of)\b/));

  add(
    found,
    'gerund-infinitive',
    find(
      /\b(?:enjoy|enjoys|enjoyed|avoid|avoids|avoided|mind|minds|finish|finishes|finished|keep|keeps|kept|consider|considers|considered|suggest|suggests|suggested|stop|stops|stopped|miss|misses|missed|practise|practice|practised|practiced|imagine|imagined|risk|risked|admit|admitted|deny|denied|can not stand|look forward to|looking forward to|looked forward to)\s+(?!(?:something|nothing|anything|everything|morning|evening|thing)\b)[a-z]+ing\b/,
    ) ??
      find(
        /\b(?:want|wants|wanted|need|needs|needed|decide|decides|decided|hope|hopes|hoped|plan|plans|planned|would like|agree|agrees|agreed|refuse|refuses|refused|promise|promises|promised|learn|learns|learned|learnt|manage|manages|managed|try|tries|tried|expect|expects|expected|afford|seem|seems|seemed|offer|offers|offered|choose|chose|forget|forgot|remember|remembered|intend|intended|pretend|pretended|arrange|arranged|fail|failed)\s+(?:not\s+)?to\s+[a-z]+/,
      ),
  );

  // Oraciones de relativo.
  const nonDefining = find(/,\s*(?:who|which|whose|whom|where)\b[^,.;!?]*/);
  add(found, 'relative-non-defining', nonDefining);
  if (!nonDefining && !endsWithQuestion) {
    add(
      found,
      'relative-defining',
      find(
        /\b(?!(?:know|knows|knew|wonder|wondered|ask|asked|tell|told|see|saw|sure|understand|understood|remember|forget|forgot|decide|decided|explain|explained|is|was|are|were)\b)[a-z]+\s+(?:who|which|whose|whom)\b[^,.;!?]*/,
      ),
    );
  }

  // Estilo indirecto.
  const reportedAdvanced =
    find(/\b(?:asked|wanted to know|wondered)\s+(?:(?:me|him|her|us|them|you)\s+)?(?:if|whether|what|where|when|why|how|who)\b[^,.;!?]*/) ??
    find(/\b(?:told|asked|ordered|advised|warned|reminded|begged|encouraged|persuaded|invited)\s+(?:me|him|her|us|them|you|[a-z]+)\s+(?:not\s+)?to\s+[a-z]+/) ??
    find(/\b(?:admitted|denied|suggested|explained|claimed|complained|insisted|threatened|recommended|mentioned|announced)\s+(?:that|to|[a-z]+ing)\b[^,.;!?]*/);
  add(found, 'reported-speech-advanced', reportedAdvanced);
  if (!reportedAdvanced) {
    add(found, 'reported-speech-basic', find(/\b(?:said|says|told\s+(?:me|him|her|us|them|you|[a-z]+))\s+(?:that\s+)?(?:he|she|they|i|we|you|it|there)\b[^,.;!?]*/));
  }

  // Estructuras enfáticas de B2 (al principio de la frase).
  add(
    found,
    'inversion',
    find(
      /^(?:never|rarely|seldom|hardly|scarcely|barely|no sooner|not only|not until|little|only then|only when|only after|only by|under no circumstances|at no time|in no way|on no account|nowhere)\b[^.?!]*?\b(?:have|has|had|do|does|did|am|is|are|was|were|can|could|will|would|should|must)\s+(?:i|you|he|she|it|we|they|the|anyone|nobody)\b/,
    ),
  );
  add(
    found,
    'cleft-sentences',
    find(
      /^it\s+(?:is|was)\s+(?!(?:important|essential|necessary|vital|possible|impossible|likely|unlikely|clear|true|obvious|strange|surprising|a pity|a shame|nice|good|great|hard|easy|difficult|time)\b)[^.?!]+?\s+(?:that|who)\b/,
    ) ??
      find(/^(?:what|all)\s+(?:i|you|we|they|he|she)\s+[a-z]+[^.?!]*?\s+(?:is|was)\b/),
  );
  add(
    found,
    'subjunctive',
    find(/\b(?:suggest|suggests|suggested|recommend|recommends|recommended|insist|insists|insisted|demand|demands|demanded|propose|proposes|proposed|request|requests|requested|require|required)\s+that\b[^,.;!?]*/) ??
      find(/\b(?:important|essential|vital|necessary|crucial|imperative)\s+that\b[^,.;!?]*/),
  );
  add(
    found,
    'participle-clauses',
    find(
      new RegExp(
        `^(?:having\\s+${PP}|(?!(?:during|nothing|something|anything|everything|morning|evening|according)\\b)[a-z]+ing\\b[^,.;!?]{0,40},|${PP}\\s+(?:by|in|with|from|at)\\b[^,.;!?]{0,40},)`,
      ),
    ),
  );
  add(
    found,
    'advanced-connectors',
    find(/\b(?:despite|in spite of|although|even though|though|however|whereas|nevertheless|nonetheless|moreover|furthermore|on the other hand|therefore|consequently)\b/),
  );
}

// ---------- Funciones de las palabras y tiempos verbales ----------

const POS = [
  ['QuestionWord', 'interrogativo'],
  ['Pronoun', 'pronombre'],
  ['Negative', 'negación'],
  ['Determiner', 'determinante'],
  ['Preposition', 'preposición'],
  ['Conjunction', 'conjunción'],
  ['Modal', 'modal'],
  ['Auxiliary', 'auxiliar'],
  ['PhrasalVerb', 'phrasal verb'],
  ['Verb', 'verbo'],
  ['Adjective', 'adjetivo'],
  ['Adverb', 'adverbio'],
  ['Value', 'número'],
  ['Noun', 'sustantivo'],
  ['Expression', 'interjección'],
];

function posLabel(tags = []) {
  const set = new Set(tags);
  return POS.find(([tag]) => set.has(tag))?.[1] ?? 'otro';
}

const FORM_LABEL = {
  'simple-present': 'Presente simple',
  'simple-past': 'Pasado simple',
  'simple-future': 'Futuro con will',
  'present-progressive': 'Presente continuo',
  'past-progressive': 'Pasado continuo',
  'future-progressive': 'Futuro continuo',
  'present-perfect': 'Presente perfecto',
  'past-perfect': 'Pasado perfecto',
  'future-perfect': 'Futuro perfecto',
  'present-perfect-progressive': 'Presente perfecto continuo',
  'past-perfect-progressive': 'Pasado perfecto continuo',
  'future-perfect-progressive': 'Futuro perfecto continuo',
  'passive-past': 'Pasiva (pasado)',
  'passive-present': 'Pasiva (presente)',
  'passive-future': 'Pasiva (futuro)',
  'auxiliary-future': 'Futuro con going to',
  'auxiliary-past': 'Used to (hábito pasado)',
  'gerund-phrase': 'Verbo + gerundio',
};

function describeVerb(v) {
  const form = v.verb?.grammar?.form;
  const aux = (v.verb?.auxiliary || '').trim().toLowerCase();
  const text = v.text.replace(/[.,!?;:]+$/, '').trim();
  let label = FORM_LABEL[form];
  if (form === 'modal-infinitive') label = aux === 'would' ? 'Condicional simple' : `Modal (${aux}) + infinitivo`;
  if (form === 'modal-past' || (!form && /\bhave$/.test(aux))) {
    label = aux === 'would have' ? 'Condicional perfecto' : `Modal perfecto (${aux})`;
  }
  if (!label && /\bbe$/.test(aux)) label = `Pasiva con modal (${aux.replace(/\s*be$/, '')})`;
  return label && text ? { text, label, form, infinitive: v.verb?.infinitive } : null;
}

function sentenceType(text) {
  const question = /\?\s*$/.test(text);
  const negative = /\b(not|never|no|nobody|nothing|none|neither|nor)\b|n['’]t\b/i.test(text);
  if (question) return negative ? 'Pregunta negativa' : 'Pregunta';
  if (/!\s*$/.test(text)) return 'Exclamativa';
  return negative ? 'Negativa' : 'Afirmativa';
}

// Lo más avanzado primero: es lo que más interesa ver de un vistazo.
const LEVEL_ORDER = { C1: 0, B2: 1, B1: 2, A2: 3, A1: 4 };
const UNIT_ORDER = Object.fromEntries(UNITS.map((u, i) => [u.id, i]));

export async function analyzeEnglish(text) {
  const nlp = await loadNlp();
  const doc = nlp(text);

  const tokens = doc
    .terms()
    .json()
    .map((t) => {
      const term = t.terms?.[0] ?? {};
      return { text: term.text || t.text, pos: posLabel(term.tags) };
    })
    .filter((t) => t.text);
  // compromise a veces toma el participio de "had known" por sustantivo: tras have/be es verbo.
  const ppRe = new RegExp(`^${PP}$`, 'i');
  const AUX_BEFORE_PP = /^(have|has|had|having|'ve|'d|be|been|being|am|is|are|was|were|not|never|already|just|ever)$/i;
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i].pos === 'verbo' || !ppRe.test(tokens[i].text)) continue;
    let j = i - 1;
    while (j > 0 && /^(not|never|already|just|ever)$/i.test(tokens[j].text)) j--;
    const prev = tokens[j].text.replace(/^.*'/, "'");
    if (AUX_BEFORE_PP.test(tokens[j].text) || AUX_BEFORE_PP.test(prev)) tokens[i].pos = 'verbo';
  }

  const verbs = [];
  const seen = new Set();
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const v of doc.verbs().json()) {
    const d = describeVerb(v);
    if (!d || seen.has(d.text.toLowerCase())) continue;
    // compromise marca "to move" como presente simple: es un infinitivo, no un tiempo.
    if (d.form === 'simple-present' && new RegExp(`\\bto\\s+${escape(d.text)}\\b`, 'i').test(text)) continue;
    // A veces separa "had" de "had known": es el auxiliar de un tiempo perfecto, no un pasado simple.
    if (/^(have|has|had)$/i.test(d.text) && new RegExp(`\\b${d.text}\\s+(?:not\\s+)?${PP}\\b`, 'i').test(text)) continue;
    seen.add(d.text.toLowerCase());
    verbs.push(d);
  }

  const found = new Map();
  for (const sentence of splitSentences(text)) detectStructures(sentence, found);

  // Presente/pasado simple y verbo to be salen de los tiempos que detecta compromise.
  for (const v of verbs) {
    if (v.form === 'simple-present') add(found, v.infinitive === 'be' ? 'verb-to-be' : 'present-simple', v.text);
    if (v.form === 'simple-past') add(found, 'past-simple', v.text);
  }
  const phrasal = doc.match('#PhrasalVerb+').out('array');
  if (phrasal.length) add(found, 'phrasal-verbs', phrasal.join(', '));
  const compared = doc.match('(#Comparative|#Superlative)').out('array');
  if (compared.length) add(found, 'comparatives', compared.join(', '));

  // Cada estructura se enlaza con su unidad del temario, de la que toma el nivel.
  const structures = [...found.entries()]
    .map(([key, info]) => {
      const detection = DETECTIONS[key];
      const unit = UNIT_BY_ID[detection?.unit];
      return {
        topicId: key,
        unitId: unit?.id ?? null,
        name: detection?.name ?? info.label ?? key,
        level: unit?.lv ?? null,
        evidence: info.evidence,
      };
    })
    .sort(
      (a, b) =>
        (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9) ||
        (UNIT_ORDER[a.unitId] ?? 99) - (UNIT_ORDER[b.unitId] ?? 99),
    );

  return {
    type: sentenceType(text),
    tokens,
    verbs: verbs.map(({ text: vt, label }) => ({ text: vt, label })),
    structures,
  };
}
