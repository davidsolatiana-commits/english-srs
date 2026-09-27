// Fechas como 'YYYY-MM-DD' en hora local (así se comparan bien como texto en SQLite).

export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parse(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

export function addDays(iso, days) {
  const { y, m, d } = parse(iso);
  return todayISO(new Date(y, m - 1, d + days));
}

export function diffDays(fromIso, toIso) {
  const a = parse(fromIso);
  const b = parse(toIso);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

// "hoy", "mañana", "en 5 días", "atrasada 2 días"
export function relativeDay(iso, today = todayISO()) {
  const n = diffDays(today, iso);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n > 1) return `en ${n} días`;
  return n === -1 ? 'atrasada 1 día' : `atrasada ${-n} días`;
}

// Duración de un intervalo para los botones de valoración.
export function formatInterval(days) {
  if (days === 1) return '1 día';
  if (days < 30) return `${days} días`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '≈1 mes' : `≈${months} meses`;
  }
  const years = Math.round((days / 365) * 10) / 10;
  return years === 1 ? '≈1 año' : `≈${years} años`;
}
