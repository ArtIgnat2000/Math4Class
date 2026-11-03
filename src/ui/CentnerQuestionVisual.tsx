import type { ReactNode } from 'react';

const root = import.meta.env.BASE_URL;
const crate = `${root}illustrations/props/centner-crate.webp`;
const container = `${root}illustrations/props/tonne-container.webp`;
const parcel = `${root}illustrations/props/parcel.webp`;

// A crate/container is a *symbol* for a marked load, not its empty object's mass.
function Load({ kind, label }: { kind: 'centner' | 'tonne' | 'kg'; label: string }) {
  return (
    <span className={`centner-load centner-load-${kind}`}>
      <img src={kind === 'centner' ? crate : kind === 'tonne' ? container : parcel} alt="" />
      <span>{label}</span>
    </span>
  );
}
function Group({ children }: { children: ReactNode }) {
  return <span className="centner-load-group">{children}</span>;
}
const loads = (count: number, kind: 'centner' | 'tonne', label: string) =>
  Array.from({ length: count }, (_, i) => <Load key={i} kind={kind} label={label} />);

const scenes: Record<string, { description: string; picture: ReactNode }> = {
  'centners-6': {
    description: 'Шесть отдельных грузов, каждый массой один центнер',
    picture: <Group>{loads(6, 'centner', '1 ц')}</Group>,
  },
  'tonnes-3': {
    description: 'Три отдельных груза, каждый массой одна тонна',
    picture: <Group>{loads(3, 'tonne', '1 т')}</Group>,
  },
  'tonnes-to-centners': {
    description: 'Четыре груза по одной тонне. Количество центнеров не указано',
    picture: <Group>{loads(4, 'tonne', '1 т')}</Group>,
  },
  'mixed-tonnes': {
    description: 'Два груза по одной тонне и четыре груза по одному центнеру',
    picture: (
      <>
        <Group>{loads(2, 'tonne', '1 т')}</Group>
        <span className="centner-separator">+</span>
        <Group>{loads(4, 'centner', '1 ц')}</Group>
      </>
    ),
  },
  'kg-2300': {
    description: 'Один груз с известной массой 2 300 килограммов; тонны и центнеры нужно найти',
    picture: <Load kind="kg" label="2 300 кг" />,
  },
  equal: {
    description:
      'Слева груз массой одна тонна, справа груз массой десять центнеров, между ними знак вопроса',
    picture: (
      <>
        <Load kind="tonne" label="1 т" />
        <span className="centner-separator">?</span>
        <Load kind="centner" label="10 ц" />
      </>
    ),
  },
  'kg-to-centners': {
    description: 'Груз массой 900 килограммов; количество центнеров нужно найти',
    picture: <Load kind="kg" label="900 кг" />,
  },
  order: {
    description: 'Четыре неупорядоченные карточки масс: 80 кг, 1 ц, 9 ц, 1 т',
    picture: (
      <div className="mass-question-cards">
        {['80 кг', '1 ц', '9 ц', '1 т'].map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    ),
  },
};

export function CentnerQuestionVisual({ taskId }: { taskId: string }) {
  const scene = scenes[taskId];
  if (!scene) return null;
  return (
    <figure
      className="mass-question-visual centner-question-visual"
      role="img"
      aria-label={scene.description}
    >
      <div className="centner-question-items" aria-hidden="true">
        {scene.picture}
      </div>
    </figure>
  );
}
