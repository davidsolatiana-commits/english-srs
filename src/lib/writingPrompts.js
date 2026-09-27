// Temas para el cuaderno: del diario (A2/B1) a tareas con formato del B2 First Writing.
// words = objetivo de palabras [mínimo, máximo]. Los id son estables (se guardan en notes.prompt_id).

export const WRITING_PROMPTS = [
  {
    id: 'day',
    type: 'Diario',
    level: 'A2',
    title: 'Mi día',
    task: 'Write about your day: what did you do, who did you see and how did you feel?',
    tips: 'Past simple (I went, I saw). Conectores de orden: first, then, after that, finally.',
    words: [60, 100],
  },
  {
    id: 'weekend',
    type: 'Diario',
    level: 'A2',
    title: 'Planes del fin de semana',
    task: 'What are you going to do this weekend? Who with? Why?',
    tips: 'Futuro con going to (planes), present continuous (citas ya organizadas) y will (decisiones).',
    words: [60, 100],
  },
  {
    id: 'describe',
    type: 'Descripción',
    level: 'B1',
    title: 'Una persona importante',
    task: 'Describe a person who is important to you: what they look like, their personality and why they matter to you.',
    tips: 'Adjetivos variados y relative clauses: "She is someone who always…".',
    words: [80, 130],
  },
  {
    id: 'future',
    type: 'Diario',
    level: 'B1',
    title: 'Dentro de 10 años',
    task: 'Where do you see yourself in ten years? Think about work, home and free time.',
    tips: 'will / might / may para predicciones; "I hope to…", "I would like to…".',
    words: [80, 130],
  },
  {
    id: 'email-visit',
    type: 'Email informal',
    level: 'B1',
    title: 'Un amigo viene a tu ciudad',
    task: 'A friend from England is coming to visit your town. Write an email recommending places to go and things to do.',
    tips: 'Saludo y despedida informales. should / could / you must…, first conditional: "If you like…, you will…".',
    words: [100, 150],
  },
  {
    id: 'email-apology',
    type: 'Email informal',
    level: 'B1',
    title: 'Pedir perdón',
    task: "You missed a friend's birthday party. Write an email to apologise, explain what happened and suggest meeting up.",
    tips: '"I\'m really sorry for missing…", past continuous + past simple, "Why don\'t we…?".',
    words: [100, 150],
  },
  {
    id: 'story-door',
    type: 'Historia',
    level: 'B1',
    title: 'Una puerta abierta',
    task: "Write a story that begins with this sentence: 'As soon as I opened the door, I knew something was wrong.'",
    tips: 'Past simple, past continuous y past perfect ("someone had been there"). Conectores de tiempo.',
    words: [120, 180],
  },
  {
    id: 'regrets',
    type: 'Reflexión',
    level: 'B2',
    title: 'Lo que cambiaría',
    task: 'Write about something you would do differently if you could go back in time.',
    tips: 'Third conditional ("If I had…, I would have…"), wish + past perfect, should have + participio.',
    words: [120, 180],
  },
  {
    id: 'essay-online',
    type: 'Essay (B2 First)',
    level: 'B2',
    title: 'Estudiar online',
    task:
      'Some people say that studying online is better than studying in a classroom. Do you agree? ' +
      'Write about: 1. cost  2. motivation  3. your own idea.',
    tips: 'Introducción + 2–3 párrafos + conclusión. Conectores: however, moreover, on the other hand, in conclusion.',
    words: [140, 190],
  },
  {
    id: 'essay-tourism',
    type: 'Essay (B2 First)',
    level: 'B2',
    title: 'El turismo',
    task:
      'Tourism does more harm than good to the places people visit. Do you agree? ' +
      'Write about: 1. the environment  2. local jobs  3. your own idea.',
    tips: 'Da tu opinión con matices: "Although…, I believe…". Usa la pasiva: "Many jobs are created…".',
    words: [140, 190],
  },
  {
    id: 'essay-phones',
    type: 'Essay (B2 First)',
    level: 'B2',
    title: 'Los jóvenes y el móvil',
    task:
      'Young people spend too much time on their phones. Do you agree? ' +
      'Write about: 1. social life  2. studies  3. your own idea.',
    tips: 'Ejemplos concretos ("For instance…"), contraste (whereas, despite) y una conclusión clara.',
    words: [140, 190],
  },
  {
    id: 'review-film',
    type: 'Review (B2 First)',
    level: 'B2',
    title: 'Reseña de una película o serie',
    task:
      'Write a review of a film or series you have watched recently for an English-language website. ' +
      'Describe it, say what you liked or disliked, and whether you would recommend it.',
    tips: 'Presente para el argumento, pasiva ("It was directed by…"), adjetivos fuertes (gripping, dull…).',
    words: [140, 190],
  },
  {
    id: 'article-place',
    type: 'Article (B2 First)',
    level: 'B2',
    title: 'Un lugar que todos deberían visitar',
    task: "Write an article for a travel magazine called 'A place everyone should visit'. Describe the place and explain why it is special.",
    tips: 'Empieza con una pregunta al lector. Prueba la inversión: "Not only is it beautiful, but…".',
    words: [140, 190],
  },
  {
    id: 'article-skill',
    type: 'Article (B2 First)',
    level: 'B2',
    title: 'La habilidad más útil',
    task: "Write an article called 'The most useful skill I've ever learned'. Explain what it is, how you learned it and how it has helped you.",
    tips: 'Present perfect, used to, y cleft sentences: "What I love most about it is…".',
    words: [140, 190],
  },
];

// Unidades del temario de gramática (src/lib/grammar.js) que conviene repasar para cada tema.
const PROMPT_UNITS = {
  day: ['u9'],
  weekend: ['u12', 'u7'],
  describe: ['u20', 'u11'],
  future: ['u12', 'u29'],
  'email-visit': ['u17', 'u18'],
  'email-apology': ['u14', 'u21'],
  'story-door': ['u14', 'u23'],
  regrets: ['u24', 'u28'],
  'essay-online': ['u37', 'u18'],
  'essay-tourism': ['u37', 'u19'],
  'essay-phones': ['u37', 'u35'],
  'review-film': ['u19', 'u11'],
  'article-place': ['u30', 'u32'],
  'article-skill': ['u15', 'u27', 'u31'],
};
for (const p of WRITING_PROMPTS) p.units = PROMPT_UNITS[p.id] ?? [];

export const PROMPT_BY_ID = Object.fromEntries(WRITING_PROMPTS.map((p) => [p.id, p]));
