// Repetición espaciada SM-2 (simplificado, 4 botones).
//
// Calidad de respuesta q (escala clásica 0-5):
//   Otra vez = 1 · Difícil = 3 · Bien = 4 · Fácil = 5
//
// - Fallo (q < 3): repetitions = 0, interval = 1 día, ease baja 0.2.
// - Acierto: ease se ajusta con la fórmula clásica
//     EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
//   (Fácil +0.10, Bien ±0, Difícil -0.14), nunca por debajo de 1.3.
//   Intervalo: 1.ª vez 1 día, 2.ª vez 6 días, después interval * EF.
//   Difícil crece poco (×1.2) y Fácil crece más (×EF×1.3).

import { addDays } from './dates.js';

export const GRADES = [
  { id: 'again', q: 1, label: 'Otra vez', key: '1' },
  { id: 'hard', q: 3, label: 'Difícil', key: '2' },
  { id: 'good', q: 4, label: 'Bien', key: '3' },
  { id: 'easy', q: 5, label: 'Fácil', key: '4' },
];

export const INITIAL_EASE = 2.5;

// "Dominada": ya se repasa cada 3 semanas o más (por SM-2 o porque la marcaste tú).
export const MASTERED_DAYS = 21;
export const isMastered = (w) => Boolean(w?.first_review_date) && w.interval_days >= MASTERED_DAYS;
const MIN_EASE = 1.3;

export function schedule(card, q, today) {
  let ease = card.ease_factor;
  let interval = card.interval_days;
  let reps = card.repetitions;

  if (q < 3) {
    reps = 0;
    interval = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    ease = Math.max(MIN_EASE, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    if (reps === 0) {
      interval = q === 5 ? 4 : 1;
    } else if (reps === 1) {
      interval = q === 3 ? 3 : q === 5 ? 8 : 6;
    } else if (q === 3) {
      interval = Math.max(interval + 1, Math.round(interval * 1.2));
    } else if (q === 4) {
      interval = Math.max(interval + 1, Math.round(interval * ease));
    } else {
      interval = Math.max(interval + 1, Math.round(interval * ease * 1.3));
    }
    reps += 1;
  }

  return {
    ease_factor: Math.round(ease * 100) / 100,
    interval_days: interval,
    repetitions: reps,
    next_review_date: addDays(today, interval),
    last_review_date: today,
  };
}
