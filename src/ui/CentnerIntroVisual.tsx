import { useState } from 'react';

const root = import.meta.env.BASE_URL;
const kilogram = `${root}illustrations/props/weight.webp`;
const crate = `${root}illustrations/props/centner-crate.webp`;
const container = `${root}illustrations/props/tonne-container.webp`;

/** Each object is a symbolic load of the marked mass, not its empty weight. */
export function CentnerIntroVisual() {
  const [view, setView] = useState<'centner' | 'tonne'>('centner');
  return (
    <div className="mass-intro centner-intro">
      <div className="mass-intro-switch" aria-label="Выбрать единицу массы">
        <button type="button" aria-pressed={view === 'centner'} onClick={() => setView('centner')}>
          Центнер
        </button>
        <button type="button" aria-pressed={view === 'tonne'} onClick={() => setView('tonne')}>
          Тонна
        </button>
      </div>
      <div className="mass-intro-panel">
        {view === 'centner' ? (
          <div
            className="centner-example"
            role="img"
            aria-label="Килограмм — гиря. Центнер — груз в сто раз тяжелее: 1 центнер равен 100 килограммам"
          >
            <div className="centner-comparison">
              <span className="centner-symbol centner-kilogram">
                <img src={kilogram} alt="" />
                <b>1 кг</b>
              </span>
              <span className="centner-multiplier" aria-hidden="true">
                × 100 <span>→</span>
              </span>
              <span className="centner-symbol centner-crate">
                <img src={crate} alt="" />
                <b>1 ц</b>
              </span>
            </div>
            <strong>1 ц = 100 кг</strong>
          </div>
        ) : (
          <div
            className="centner-example"
            role="img"
            aria-label="Центнер — ящик. Тонна — груз в десять раз тяжелее: 1 тонна равна 10 центнерам и 1 000 килограммам"
          >
            <div className="centner-comparison">
              <span className="centner-symbol centner-crate">
                <img src={crate} alt="" />
                <b>1 ц</b>
              </span>
              <span className="centner-multiplier" aria-hidden="true">
                × 10 <span>→</span>
              </span>
              <span className="centner-symbol centner-container">
                <img src={container} alt="" />
                <b>1 т</b>
              </span>
            </div>
            <strong>1 т = 10 ц = 1 000 кг</strong>
          </div>
        )}
      </div>
    </div>
  );
}
