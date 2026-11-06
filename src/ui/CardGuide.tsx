import { createContext, useContext, useId, useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

/** The title slot belongs to the current window, not to an outer lesson. */
export const CardTitleContext = createContext<HTMLSpanElement | null>(null);

/** Interface instructions, not a hint about the answer or an assessed action. */
export function CardGuide({
  kind,
  children,
  leading,
  reference,
}: {
  kind: 'Теория' | 'Тренажёр' | 'Практика';
  children: string;
  leading?: ReactNode;
  reference?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fits, setFits] = useState(false);
  const id = useId();
  const titleSlot = useContext(CardTitleContext);

  useLayoutEffect(() => {
    if (!titleSlot?.parentElement) return;
    const heading = titleSlot.parentElement;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const text = titleSlot.previousElementSibling?.textContent ?? '';
      const probe = document.createElement('span');
      const style = getComputedStyle(heading);
      probe.style.cssText = `position:fixed;visibility:hidden;white-space:nowrap;font:${style.font};letter-spacing:${style.letterSpacing};`;
      probe.textContent = `${text} · ${kind}`;
      document.body.appendChild(probe);
      const available =
        heading.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      setFits(available > 0 && width > 0 && width + 4 <= available);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(heading);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [titleSlot, kind]);

  return (
    <div className="card-guide">
      {titleSlot && fits && createPortal(<> · {kind}</>, titleSlot)}
      <div className="card-guide-bar">
        <div className="card-guide-leading">
          {leading}
          {!fits && <span className="card-guide-kind">{kind}</span>}
        </div>
        <div className="card-guide-buttons">
          {reference}
          <button
            type="button"
            className="card-guide-toggle"
            aria-label="Справка"
            title="Справка: как пользоваться карточкой"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((value) => !value)}
          >
            <CircleHelp size={19} aria-hidden="true" /> <span>Справка</span>
          </button>
        </div>
      </div>
      <div id={id} className="card-guide-content" hidden={!open}>
        <p>{children}</p>
      </div>
    </div>
  );
}
