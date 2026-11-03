import { useRef, useState, type PointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, GripVertical } from 'lucide-react';
import { MassWeight, type MassWeightValue } from './MassWeights';

type Item = { id: string; label: string };

// Composite labels are sums of fixed-denomination weights, not new weights.
function MassWeights({ label }: { label: string }) {
  const values: MassWeightValue[] =
    label === '1 кг'
      ? ['1 кг']
      : label === '900 г'
        ? ['500 г', '200 г', '200 г']
        : label === '1 кг 50 г'
          ? ['1 кг', '50 г']
          : label === '1 500 г'
            ? ['1 кг', '500 г']
            : [];
  return (
    <span className="order-mass-weights" aria-hidden="true">
      {values.map((value, index) => (
        <MassWeight value={value} key={`${value}-${index}`} />
      ))}
    </span>
  );
}

/** Pointer capture supports both touch and mouse; arrow buttons remain a keyboard fallback. */
export function OrderAnswer({
  items,
  order,
  onChange,
  disabled,
  illustrated = false,
}: {
  items: Item[];
  order: string[];
  onChange: (order: string[]) => void;
  disabled: boolean;
  illustrated?: boolean;
}) {
  const drag = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    target: string;
  } | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [announcement, setAnnouncement] = useState('');
  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const moved = next[index];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
    setAnnouncement(
      `${items.find((item) => item.id === moved)?.label ?? ''}: позиция ${index + direction + 1}`,
    );
  };
  const start = (event: PointerEvent<HTMLLIElement>, id: string) => {
    if (disabled || (event.target as HTMLElement).closest('button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      target: id,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const over = (event: PointerEvent<HTMLLIElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6 && !active)
      return;
    setActive(current.id);
    setOffset({ x: event.clientX - current.startX, y: event.clientY - current.startY });
    // Hit-test the untransformed rows, not the moving card under the finger.
    const rows = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[data-order-id]') ?? [],
    );
    const hovered = rows.find((row) => {
      if (row.dataset.orderId === current.id) return false;
      const { left, right, top, bottom } = row.getBoundingClientRect();
      return (
        event.clientX >= left &&
        event.clientX <= right &&
        event.clientY >= top &&
        event.clientY <= bottom
      );
    });
    current.target = hovered?.dataset.orderId ?? current.id;
    setTarget(current.target);
  };
  const finish = (event: PointerEvent<HTMLLIElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.type !== 'pointercancel' && active && current.target !== current.id && !disabled) {
      const next = [...order];
      const from = next.indexOf(current.id);
      const destination = next.indexOf(current.target);
      next.splice(from, 1);
      next.splice(destination, 0, current.id);
      const index = destination;
      onChange(next);
      setAnnouncement(
        `${items.find((item) => item.id === current.id)?.label ?? ''}: позиция ${index + 1}`,
      );
    }
    drag.current = null;
    setActive(null);
    setTarget(null);
    setOffset({ x: 0, y: 0 });
  };
  return (
    <div className={`order-answer ${illustrated ? 'illustrated-order' : ''}`}>
      <p>Перетащи карточки в нужном порядке.</p>
      <ol aria-label="Порядок величин">
        {order.map((id, i) => {
          const item = items.find((entry) => entry.id === id)!;
          return (
            <li
              key={id}
              data-order-id={id}
              style={
                active === id
                  ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.025)` }
                  : undefined
              }
              className={`${active === id ? 'order-dragging' : ''} ${active && target === id && active !== id ? 'order-drop-target' : ''}`}
              onPointerDown={(event) => start(event, id)}
              onPointerMove={over}
              onPointerUp={finish}
              onPointerCancel={finish}
            >
              <span className="order-position">{i + 1}</span>
              <GripVertical className="order-grip" size={19} aria-hidden="true" />
              {illustrated && <MassWeights label={item.label} />}
              <strong>{item.label}</strong>
              <div>
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`${illustrated ? 'Сдвинуть влево' : 'Поднять'} ${item.label}`}
                >
                  {illustrated ? <ArrowLeft size={18} /> : <ArrowUp size={18} />}
                </button>
                <button
                  type="button"
                  disabled={disabled || i === order.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`${illustrated ? 'Сдвинуть вправо' : 'Опустить'} ${item.label}`}
                >
                  {illustrated ? <ArrowRight size={18} /> : <ArrowDown size={18} />}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
