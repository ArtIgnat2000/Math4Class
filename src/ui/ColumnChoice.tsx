import type { ColumnChoiceLayout } from '../engine/column-choice';

/** A written calculation as it is laid out in the textbook: right-aligned column. */
export function ColumnChoice({ layout }: { layout: ColumnChoiceLayout }) {
  return (
    <span className="column-choice" aria-hidden="true">
      <span className="column-choice-sign">{layout.operator}</span>
      <span className="column-choice-body">
        <span className="column-choice-operand">{layout.top}</span>
        <span className="column-choice-operand">{layout.bottom}</span>
        <span className="column-choice-result">{layout.result}</span>
      </span>
    </span>
  );
}
