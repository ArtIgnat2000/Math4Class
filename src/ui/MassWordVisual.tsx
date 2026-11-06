import type { ReactNode } from 'react';

const base = `${import.meta.env.BASE_URL}illustrations/props/`;
const props = {
  notebook: 'notebooks.webp',
  wagon: 'flour-wagon.webp',
  bread: 'bread.webp',
  sack: 'flour-sack.webp',
  paper: 'waste-paper.webp',
  apples: 'apple-crate.webp',
  pears: 'pear-crate.webp',
  centner: 'centner-crate.webp',
  tonne: 'tonne-container.webp',
} as const;
type PropName = keyof typeof props;

function ObjectCard({
  kind,
  label,
  quantity,
}: {
  kind: PropName;
  label: string;
  quantity?: string;
}) {
  return (
    <span className="word-mass-object">
      <img src={`${base}${props[kind]}`} alt="" draggable={false} />
      {quantity && <b className="word-mass-count">{quantity}</b>}
      <span>{label}</span>
    </span>
  );
}
function Scene({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="word-mass-scene" role="img" aria-label={label}>
      {children}
    </figure>
  );
}

/** A short visual model of the given facts; no calculated answer is pictured. */
export function MassWordVisual({ taskId }: { taskId: string }) {
  switch (taskId) {
    case 'paper-centner':
    case 'paper-tonne':
      return (
        <Scene
          label={`1 кг макулатуры даёт 30 тетрадей; сколько тетрадей получится из ${taskId === 'paper-centner' ? '1 ц' : '1 т'}?`}
        >
          <ObjectCard kind="paper" label="1 кг макулатуры" />
          <span className="word-mass-arrow" aria-hidden="true">
            →
          </span>
          <ObjectCard kind="notebook" label="30 тетрадей" quantity="× 10" />
          <span className="word-mass-divider" aria-hidden="true" />
          <ObjectCard
            kind={taskId === 'paper-centner' ? 'centner' : 'tonne'}
            label={taskId === 'paper-centner' ? '1 ц макулатуры' : '1 т макулатуры'}
          />
          <span className="word-mass-arrow" aria-hidden="true">
            →
          </span>
          <span className="word-mass-unknown" aria-label="Неизвестное количество тетрадей">
            ?
          </span>
        </Scene>
      );
    case 'wagons-total':
    case 'wagons-difference':
      return (
        <Scene label="Восемь вагонов по 52 тонны и восемь вагонов по 47 тонн муки">
          <ObjectCard kind="wagon" label="по 52 т" quantity="× 8" />
          <span className="word-mass-divider" aria-hidden="true" />
          <ObjectCard kind="wagon" label="по 47 т" quantity="× 8" />
        </Scene>
      );
    case 'bread':
      return (
        <Scene label="За смену выпекают 8 тонн одного хлеба и 4 тонны другого; три смены в сутки, пять суток">
          <ObjectCard kind="bread" label="8 т за смену" />
          <ObjectCard kind="bread" label="4 т за смену" />
          <span className="word-mass-fact">3 смены в сутки · 5 суток</span>
        </Scene>
      );
    case 'bags':
      return (
        <Scene label="Один мешок муки 25 килограммов; сколько таких мешков составляют один центнер?">
          <ObjectCard kind="sack" label="мешок 25 кг" />
          <span className="word-mass-arrow" aria-hidden="true">
            × ? →
          </span>
          <ObjectCard kind="centner" label="всего 1 ц" />
        </Scene>
      );
    case 'remaining':
      return (
        <Scene label="Было 2 тонны крупы, вывезли 7 центнеров, остаток неизвестен">
          <ObjectCard kind="tonne" label="было 2 т" quantity="× 2" />
          <span className="word-mass-arrow" aria-hidden="true">
            −
          </span>
          <ObjectCard kind="centner" label="вывезли 7 ц" quantity="× 7" />
          <span className="word-mass-arrow" aria-hidden="true">
            → ?
          </span>
        </Scene>
      );
    case 'expression':
      return (
        <Scene label="Шесть ящиков яблок по 18 килограммов и четыре ящика груш по 12 килограммов">
          <ObjectCard kind="apples" label="по 18 кг яблок" quantity="× 6" />
          <span className="word-mass-divider" aria-hidden="true" />
          <ObjectCard kind="pears" label="по 12 кг груш" quantity="× 4" />
        </Scene>
      );
    default:
      return null;
  }
}

export function MassWordIntro() {
  return (
    <div className="word-mass-intro">
      <Scene label="Мешок муки, вагон с грузом и тетради — предметы задач на массу">
        <ObjectCard kind="sack" label="Мешки" />
        <ObjectCard kind="wagon" label="Вагоны" />
        <ObjectCard kind="notebook" label="Тетради" />
      </Scene>
    </div>
  );
}
