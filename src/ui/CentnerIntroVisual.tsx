import { useState } from 'react';

const crate = `${import.meta.env.BASE_URL}illustrations/props/centner-crate.webp`;

/** One cargo crate represents one centner. Never depict a person as weighing 100 kg. */
export function CentnerIntroVisual() {
  const [view, setView] = useState<'centner' | 'tonne'>('centner');
  return (
    <div className="mass-intro centner-intro">
      <div className="mass-intro-switch" aria-label="Выбрать единицу массы">
        <button type="button" aria-pressed={view === 'centner'} onClick={() => setView('centner')}>
          Что такое центнер?
        </button>
        <button type="button" aria-pressed={view === 'tonne'} onClick={() => setView('tonne')}>
          А тонна?
        </button>
      </div>
      <div className="mass-intro-panel">
        {view === 'centner' ? (
          <div
            className="centner-example"
            role="img"
            aria-label="Один груз массой один центнер весит сто килограммов"
          >
            <img src={crate} alt="" />
            <strong>1 ц = 100 кг</strong>
          </div>
        ) : (
          <div
            className="centner-example"
            role="img"
            aria-label="Одна тонна равна десяти центнерам, то есть тысяче килограммов"
          >
            <div className="centner-ten" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <img key={i} src={crate} alt="" />
              ))}
            </div>
            <strong>10 ц = 1 т = 1 000 кг</strong>
          </div>
        )}
      </div>
    </div>
  );
}
