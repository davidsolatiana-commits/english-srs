// Corrector de huecos (del artifact «Escalera de gramática"): acepta contracciones y formas
// completas como equivalentes (don't = do not, 's = is/has, 'd = would/had).

export function norm(s) {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function variants(s) {
  const base = norm(s)
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bcannot\b/g, 'can not')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am')
    .replace(/'re\b/g, ' are')
    .replace(/'ve\b/g, ' have')
    .replace(/'ll\b/g, ' will')
    .replace(/\s+/g, ' ')
    .trim();
  let out = [base];
  if (/'s\b/.test(base)) out = [base.replace(/'s\b/g, ' is'), base.replace(/'s\b/g, ' has')];
  if (/'d\b/.test(base)) out = out.flatMap((x) => [x.replace(/'d\b/g, ' would'), x.replace(/'d\b/g, ' had')]);
  return out.map((x) => x.replace(/\s+/g, ' ').trim());
}

export function isRight(input, answers) {
  const given = new Set(variants(input));
  return answers.some((a) => variants(a).some((v) => given.has(v)));
}
