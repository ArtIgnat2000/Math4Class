import { useRef, useState, type PointerEvent } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

type Item = { id: string; label: string };

/** Pointer capture supports both touch and mouse; arrow buttons remain a keyboard fallback. */
export function OrderAnswer({
  items,
  order,
  onChange,
  disabled,
}: {
  items: Item[];
  order: string[];
  onChange: (order: string[]) => void;
  disabled: boolean;
}) {
  const drag = useRef<{ id: string; pointerId: number; startY: number; target: string } | null>(
    null,
  );
  const [active, setActive] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
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
    drag.current = { id, pointerId: event.pointerId, startY: event.clientY, target: id };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const over = (event: PointerEvent<HTMLLIElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientY - current.startY) < 6 && !active) return;
    setActive(current.id);
    const element = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-order-id]');
    if (element?.dataset.orderId && order.includes(element.dataset.orderId)) {
      current.target = element.dataset.orderId;
      setTarget(current.target);
    }
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
  };
  return (
    <div className="order-answer">
      <p>Перетащи карточки в нужном порядке. С клавиатуры используй стрелки.</p>
      <ol aria-label="Порядок величин">
        {order.map((id, i) => {
          const item = items.find((entry) => entry.id === id)!;
          return (
            <li
              key={id}
              data-order-id={id}
              className={`${active === id ? 'order-dragging' : ''} ${active && target === id && active !== id ? 'order-drop-target' : ''}`}
              onPointerDown={(event) => start(event, id)}
              onPointerMove={over}
              onPointerUp={finish}
              onPointerCancel={finish}
            >
              <span className="order-position">{i + 1}</span>
              <GripVertical className="order-grip" size={19} aria-hidden="true" />
              <strong>{item.label}</strong>
              <div>
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Поднять ${item.label}`}
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  disabled={disabled || i === order.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Опустить ${item.label}`}
                >
                  <ArrowDown size={18} />
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
