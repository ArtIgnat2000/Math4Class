import type { ReactNode } from 'react';

const root = `${import.meta.env.BASE_URL}illustrations/props/`;
type PropKind =
  'centner' | 'tonne' | 'marked' | 'cargo' | 'kilogram' | 'five-grams' | 'eighty-grams';
const images: Record<PropKind, string> = {
  centner: 'centner-crate.webp',
  tonne: 'tonne-container.webp',
  marked: 'parcel.webp',
  cargo: 'comparison-cargo.svg',
  kilogram: 'weight.webp',
  'five-grams': 'comparison-5g.svg',
  'eighty-grams': 'comparison-80g.svg',
};

function MassProp({ kind, caption }: { kind: PropKind; caption: string }) {
  return (
    <span className={`comparison-prop comparison-prop-${kind}`}>
      <img src={`${root}${images[kind]}`} alt="" draggable={false} />
      <span>{caption}</span>
    </span>
  );
}

function Side({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="comparison-side" role="group" aria-label={label}>
      <div className="comparison-objects">{children}</div>
      <strong>{label}</strong>
    </div>
  );
}

// Every label is stated in the task. Arbitrary masses use a marked cargo load,
// not the canonical one-centner crate or one-tonne container.
const scenes: Record<string, { label: string; picture: ReactNode }> = {
  centner: {
    label: 'Два груза по 1 ц и отдельный груз с отметкой 190 кг',
    picture: (
      <>
        <Side label="2 ц">
          <MassProp kind="centner" caption="1 ц" />
          <MassProp kind="centner" caption="1 ц" />
        </Side>
        <Side label="190 кг">
          <MassProp kind="marked" caption="190 кг" />
        </Side>
      </>
    ),
  },
  tonne: {
    label: 'Груз 1 т и груз 50 кг слева; справа отдельный груз 1 500 кг',
    picture: (
      <>
        <Side label="1 т 50 кг">
          <MassProp kind="tonne" caption="1 т" />
          <MassProp kind="marked" caption="50 кг" />
        </Side>
        <Side label="1 500 кг">
          <MassProp kind="cargo" caption="1 500 кг" />
        </Side>
      </>
    ),
  },
  grams: {
    label: 'Три гири по 1 кг и отдельная гирька 5 г слева; справа отдельный груз 3 050 г',
    picture: (
      <>
        <Side label="3 кг 5 г">
          {Array.from({ length: 3 }, (_, i) => (
            <MassProp kind="kilogram" caption="1 кг" key={i} />
          ))}
          <MassProp kind="five-grams" caption="5 г" />
        </Side>
        <Side label="3 050 г">
          <MassProp kind="marked" caption="3 050 г" />
        </Side>
      </>
    ),
  },
  'equal-kg': {
    label: 'Четыре груза по 1 ц и груз 8 кг слева; справа отдельный груз 408 кг',
    picture: (
      <>
        <Side label="4 ц 8 кг">
          {Array.from({ length: 4 }, (_, i) => (
            <MassProp kind="centner" caption="1 ц" key={i} />
          ))}
          <MassProp kind="marked" caption="8 кг" />
        </Side>
        <Side label="408 кг">
          <MassProp kind="marked" caption="408 кг" />
        </Side>
      </>
    ),
  },
  'mixed-tons': {
    label: 'Два отдельных груза по 1 т и отдельный груз 35 кг',
    picture: (
      <Side label="2 т 35 кг">
        {Array.from({ length: 2 }, (_, i) => (
          <MassProp kind="tonne" caption="1 т" key={i} />
        ))}
        <MassProp kind="marked" caption="35 кг" />
      </Side>
    ),
  },
  'mixed-g': {
    label: 'Шесть отдельных гирь по 1 кг и отдельная гирька 80 г',
    picture: (
      <Side label="6 кг 80 г">
        {Array.from({ length: 6 }, (_, i) => (
          <MassProp kind="kilogram" caption="1 кг" key={i} />
        ))}
        <MassProp kind="eighty-grams" caption="80 г" />
      </Side>
    ),
  },
  'same-tonnes': {
    label: 'Три груза по 1 т слева и тридцать грузов по 1 ц справа',
    picture: (
      <>
        <Side label="3 т">
          {Array.from({ length: 3 }, (_, i) => (
            <MassProp kind="tonne" caption="1 т" key={i} />
          ))}
        </Side>
        <Side label="30 ц">
          <span className="comparison-stack">
            <MassProp kind="centner" caption="1 ц" />
            <b>× 30</b>
          </span>
        </Side>
      </>
    ),
  },
};

export function MassComparisonVisual({ taskId }: { taskId: string }) {
  const scene = scenes[taskId];
  if (!scene) return null;
  return (
    <figure className="mass-comparison-visual" role="img" aria-label={scene.label}>
      {scene.picture}
    </figure>
  );
}

export function ComparisonChoicePicture({ value }: { value: string }) {
  const kind: PropKind = value === '1 т' ? 'tonne' : value === '8 ц' ? 'centner' : 'cargo';
  return (
    <span className="comparison-choice-picture" aria-hidden="true">
      <img src={`${root}${images[kind]}`} alt="" draggable={false} />
      {value === '8 ц' && <span>× 8</span>}
    </span>
  );
}
