// Enlace de una estructura detectada (Frases, Cuaderno) a su unidad del temario de gramática.

import { html } from '../lib/html.js';
import { UNIT_BY_ID, unitNumber } from '../lib/grammar.js';
import { unitOfDetection } from '../lib/grammarDetections.js';

export function UnitLink({ structure, unitId, onOpenUnit, label }) {
  // Análisis guardados antes de enlazar con el temario solo tienen topicId.
  const id = unitId ?? structure?.unitId ?? unitOfDetection(structure?.topicId);
  const unit = UNIT_BY_ID[id];
  if (!unit || !onOpenUnit) return null;
  return html`
    <button
      className="unit-link"
      title=${`Unidad ${unitNumber(unit.id)}: ${unit.t}`}
      onClick=${(e) => {
        e.stopPropagation();
        onOpenUnit(unit.id);
      }}
    >
      ${label ?? `Ver la unidad →`}
    </button>
  `;
}
