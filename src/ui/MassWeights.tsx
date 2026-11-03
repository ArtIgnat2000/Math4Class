// One visual identity per value within the mass-ordering activity.
// Captions are outside the artwork so a weight is never mislabeled.
export const MASS_WEIGHTS = {
  '1 кг': 'illustrations/props/weight.webp',
  '500 г': 'illustrations/props/order-500g.svg',
  '200 г': 'illustrations/props/order-200g.svg',
  '50 г': 'illustrations/props/order-50g.svg',
} as const;
export type MassWeightValue = keyof typeof MASS_WEIGHTS;

export function MassWeight({ value }: { value: MassWeightValue }) {
  return (
    <span className="order-mass-weight">
      <img src={`${import.meta.env.BASE_URL}${MASS_WEIGHTS[value]}`} alt="" draggable={false} />
      <span>{value}</span>
    </span>
  );
}

export function MassWeightGuide() {
  return (
    <>
      <table className="mass-weights-guide" aria-label="Гири и их масса">
        <thead>
          <tr>
            <th scope="col">Гиря</th>
            <th scope="col">Масса</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(MASS_WEIGHTS) as MassWeightValue[]).map((value) => (
            <tr key={value}>
              <td>
                <img src={`${import.meta.env.BASE_URL}${MASS_WEIGHTS[value]}`} alt="" />
              </td>
              <th scope="row">{value}</th>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
