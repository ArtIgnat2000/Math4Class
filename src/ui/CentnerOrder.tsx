// These are marked loads in the story, not claims about the empty objects.
const base = `${import.meta.env.BASE_URL}illustrations/props/`;

export function CentnerOrderPicture({ label }: { label: string }) {
  const source =
    label === '80 кг'
      ? `${base}parcel.webp`
      : label === '1 ц' || label === '9 ц'
        ? `${base}centner-crate.webp`
        : `${base}tonne-container.webp`;
  return (
    <span
      className={`centner-order-picture ${label === '9 ц' ? 'centner-order-nine' : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: label === '9 ц' ? 9 : 1 }, (_, index) => (
        <img key={index} src={source} alt="" draggable={false} />
      ))}
    </span>
  );
}

export function CentnerOrderGuide() {
  return (
    <>
      <table className="mass-weights-guide centner-order-guide" aria-label="Грузы и их масса">
        <thead>
          <tr>
            <th scope="col">Груз</th>
            <th scope="col">Масса</th>
          </tr>
        </thead>
        <tbody>
          {['1 т', '9 ц', '1 ц', '80 кг'].map((label) => (
            <tr key={label}>
              <td>
                <CentnerOrderPicture label={label} />
              </td>
              <th scope="row">{label}</th>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
