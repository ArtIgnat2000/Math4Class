import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';

/** Interface instructions, not a hint about the answer or an assessed action. */
export function CardGuide({
  kind,
  children,
}: {
  kind: 'Объяснение' | 'Тренажёр' | 'Проверка';
  children: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="card-guide">
      <div className="card-guide-bar">
        <span className="card-guide-kind">{kind}</span>
        <button
          type="button"
          className="card-guide-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          <CircleHelp size={19} aria-hidden="true" /> Справка
        </button>
      </div>
      <div id={id} className="card-guide-content" hidden={!open}>
        <p>{children}</p>
      </div>
    </div>
  );
}
