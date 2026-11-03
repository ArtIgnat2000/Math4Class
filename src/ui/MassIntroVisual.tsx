import { useState } from 'react';

const root = import.meta.env.BASE_URL;

function Weight({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span className={`mass-object mass-object-weight ${small ? 'small' : ''}`}>
      <img src={`${root}illustrations/props/${small ? 'weight-100g' : 'weight'}.webp`} alt="" />
      <span>{label}</span>
    </span>
  );
}

/** Two short visual explanations; neither copies an answer from the lesson. */
export function MassIntroVisual() {
  const [view, setView] = useState<'equivalence' | 'addition'>('equivalence');
  return (
    <div className="mass-intro">
      <div className="mass-intro-switch" aria-label="Выбрать пример">
        <button
          type="button"
          aria-pressed={view === 'equivalence'}
          onClick={() => setView('equivalence')}
        >
          Что значит «кило»?
        </button>
        <button
          type="button"
          aria-pressed={view === 'addition'}
          onClick={() => setView('addition')}
        >
          Кг вместе с г
        </button>
      </div>
      {view === 'equivalence' ? (
        <div className="mass-intro-panel kilo-panel" key="equivalence">
          <div
            className="kilo-objects"
            role="img"
            aria-label="Маленькая аптечная гирька 1 грамм и большая гиря 1 килограмм. Кило значит тысяча: в килограмме тысяча граммов"
          >
            <span className="kilo-object kilo-gram">
              <img src={`${root}illustrations/props/gram-weight.webp`} alt="" />
              <strong>1 г</strong>
            </span>
            <span className="kilo-transition" aria-hidden="true">
              × 1 000 <span>→</span>
            </span>
            <span className="kilo-object kilo-kilogram">
              <img src={`${root}illustrations/props/weight.webp`} alt="" />
              <strong>1 кг</strong>
            </span>
          </div>
          <p className="kilo-meaning">
            <strong>кило</strong> = 1 000
          </p>
          <strong className="mass-intro-result">1 кг = 1 000 г</strong>
        </div>
      ) : (
        <div className="mass-intro-panel" key="addition">
          <div
            className="mass-intro-equation"
            role="img"
            aria-label="Гиря 1 килограмм и пакет 200 граммов вместе весят 1 200 граммов"
          >
            <Weight label="1 кг" />
            <span className="mass-intro-sign">+</span>
            <span className="mass-object mass-object-parcel">
              <img src={`${root}illustrations/props/parcel.webp`} alt="" />
              <span>200 г</span>
            </span>
          </div>
          <strong className="mass-intro-result">1 000 г + 200 г = 1 200 г</strong>
        </div>
      )}
    </div>
  );
}
