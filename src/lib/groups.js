// Árbol de grupos a partir de la lista plana de db.listGroups().

// Lista en orden de árbol: cada grupo seguido de sus subgrupos, con `depth` (0 = principal).
export function flattenTree(groups) {
  const children = {};
  for (const g of groups) (children[g.parent_id ?? 'root'] ??= []).push(g);
  const out = [];
  const visit = (parent, depth) => {
    for (const g of children[parent] ?? []) {
      out.push({ ...g, depth });
      visit(g.id, depth + 1);
    }
  };
  visit('root', 0);
  // Huérfanos (su grupo padre ya no existe): al nivel principal.
  const seen = new Set(out.map((g) => g.id));
  for (const g of groups) if (!seen.has(g.id)) out.push({ ...g, depth: 0 });
  return out;
}

export const groupLabel = (g) => `${g.emoji ? g.emoji + ' ' : ''}${g.name}`;

// <option>s con sangría para los subgrupos.
export const groupOptions = (groups) =>
  flattenTree(groups).map((g) => ({ value: String(g.id), label: `${'   '.repeat(g.depth)}${groupLabel(g)}` }));
