import { useState } from 'react';

const root = import.meta.env.BASE_URL;

function Weight({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span className={`mass-object mass-object-weight ${small ? 'small' : ''}`}>
      <img src={`${root}illustrations/props/weight.webp`} alt="" />
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
          1 кг — это сколько?
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
        <div className="mass-intro-panel" key="equivalence">
          <div
            className="mass-intro-equation"
            role="img"
            aria-label="Одна гиря 1 килограмм равна десяти маленьким гирям по 100 граммов"
          >
            <Weight label="1 кг" />
            <span className="mass-intro-sign">=</span>
            <div className="mass-intro-ten">
              {Array.from({ length: 10 }, (_, i) => (
                <Weight key={i} label="100 г" small />
              ))}
              <span className="mass-intro-ten-label">10 гирек по 100 г</span>
            </div>
          </div>
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
