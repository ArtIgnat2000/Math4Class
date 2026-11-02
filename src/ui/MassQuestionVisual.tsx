import type { ReactNode } from 'react';

// Each picture shows only the quantities supplied by its question. Unknown
// quantities stay unknown; the scene is not an alternative answer key.
function Weight({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <span className={`mass-object mass-object-weight ${small ? 'small' : ''}`}>
      <span>{label}</span>
    </span>
  );
}
function Parcel({ label }: { label: string }) {
  return (
    <span className="mass-object mass-object-parcel">
      <span>{label}</span>
    </span>
  );
}
function Group({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="mass-question-group">
      {children}
      {label && <span className="mass-group-label">{label}</span>}
    </div>
  );
}
const weight = (count: number, label: string) =>
  Array.from({ length: count }, (_, i) => <Weight key={i} label={label} />);

const pictures: Record<string, { label: string; picture: ReactNode }> = {
  'kg-3': {
    label: 'Три отдельные гири, на каждой написано 1 кг',
    picture: <Group>{weight(3, '1 кг')}</Group>,
  },
  'mixed-2-350': {
    label: 'Две гири по 1 кг и отдельный пакет крупы 350 г',
    picture: (
      <>
        <Group>{weight(2, '1 кг')}</Group>
        <span className="mass-question-plus">+</span>
        <Group>
          <Parcel label="350 г" />
        </Group>
      </>
    ),
  },
  'g-7000': {
    label: 'Груз с этикеткой 7 000 г; число килограммов не указано',
    picture: (
      <Group>
        <Parcel label="7 000 г" />
      </Group>
    ),
  },
  'mixed-4050': {
    label: 'Один груз с этикеткой 4 050 г; число килограммов и оставшихся граммов не указано',
    picture: (
      <Group>
        <Parcel label="4 050 г" />
      </Group>
    ),
  },
  'compare-5': {
    label:
      'Слева пять гирь по 1 кг, справа груз с этикеткой 4 900 г. Между ними вопросительный знак',
    picture: (
      <>
        <Group label="5 кг">{weight(5, '1 кг')}</Group>
        <span className="mass-question-plus">?</span>
        <Group label="4 900 г">
          <Parcel label="4 900 г" />
        </Group>
      </>
    ),
  },
  'to-kilo': {
    label: 'Пакет крупы 750 г и неизвестная добавка должны вместе составить 1 кг',
    picture: (
      <>
        <Group>
          <Parcel label="750 г" />
        </Group>
        <span className="mass-question-plus">+</span>
        <Group>
          <Weight small label="? г" />
        </Group>
        <span className="mass-question-plus">=</span>
        <Group>
          <Weight label="1 кг" />
        </Group>
      </>
    ),
  },
  'order-mass': {
    label: 'Четыре неупорядоченные карточки масс: 1 кг 50 г, 900 г, 1 500 г, 1 кг',
    picture: (
      <div className="mass-question-cards">
        {['1 кг 50 г', '900 г', '1 500 г', '1 кг'].map((mass) => (
          <span key={mass}>{mass}</span>
        ))}
      </div>
    ),
  },
  weighing: {
    label: 'Корзина с яблоками. Масса всех яблок вместе 1 кг, количество яблок неизвестно',
    picture: (
      <Group>
        <span className="mass-object mass-object-apples">
          <span>Яблоки</span>
          <b>?</b>
        </span>
        <span className="mass-group-label">Все яблоки вместе: 1 кг</span>
      </Group>
    ),
  },
};

export function MassQuestionVisual({ taskId }: { taskId: string }) {
  const scene = pictures[taskId];
  if (!scene) return null;
  return (
    <figure className="mass-question-visual" role="img" aria-label={scene.label}>
      <div className="mass-question-items" aria-hidden="true">
        {scene.picture}
      </div>
    </figure>
  );
}
