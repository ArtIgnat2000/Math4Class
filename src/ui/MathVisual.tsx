import type { CSSProperties } from 'react';

// Concrete models are shown only when the expression fits on screen without scaling
// or changing its meaning. Larger and compound expressions keep their textual form.
export function parseVisualExpression(expression: string) {
  const match = expression.trim().match(/^(\d{1,2})\s*([+−×·*-])\s*(\d{1,2})$/);
  if (!match) return null;
  const left = Number(match[1]);
  const right = Number(match[3]);
  const operator = match[2];
  if (operator === '+' && left + right <= 20 && left > 0 && right > 0)
    return { left, right, kind: 'add' as const };
  if ((operator === '−' || operator === '-') && left <= 20 && right > 0 && right <= left)
    return { left, right, kind: 'subtract' as const };
  if (['×', '·', '*'].includes(operator) && left > 0 && right > 0 && left * right <= 20)
    return { left, right, kind: 'multiply' as const };
  return null;
}

const delay = (index: number): CSSProperties => ({ animationDelay: `${index * 90}ms` });

export function MathVisual({ expression }: { expression: string }) {
  const model = parseVisualExpression(expression);
  if (!model) return null;
  const { left, right, kind } = model;
  return (
    <figure
      className="math-visual"
      role="img"
      aria-label={
        kind === 'add'
          ? `${left} оранжевых кубиков и ${right} зелёных кубиков`
          : kind === 'subtract'
            ? `${left} кубиков, из них ${right} зачёркнуты`
            : `${left} рядов по ${right} кубиков в каждом`
      }
    >
      <div className="math-visual-scene" aria-hidden="true">
        {kind === 'multiply' ? (
          Array.from({ length: left }, (_, row) => (
            <div className="math-visual-group" key={row}>
              {Array.from({ length: right }, (_, i) => (
                <span className="math-cube" style={delay(row * right + i)} key={i} />
              ))}
            </div>
          ))
        ) : (
          <>
            <div className="math-visual-group">
              {Array.from({ length: left }, (_, i) => (
                <span
                  className={`math-cube ${kind === 'subtract' && i >= left - right ? 'removed' : ''}`}
                  key={i}
                  style={delay(i)}
                />
              ))}
            </div>
            {kind === 'add' && (
              <>
                <span className="math-visual-plus">+</span>
                <div className="math-visual-group green">
                  {Array.from({ length: right }, (_, i) => (
                    <span className="math-cube" style={delay(left + i)} key={i} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <figcaption>
        {kind === 'add'
          ? 'Соедини две группы'
          : kind === 'subtract'
            ? 'Убери зачёркнутые кубики'
            : `${left} ${left === 1 ? 'ряд' : 'рядов'} по ${right}`}
      </figcaption>
    </figure>
  );
}
