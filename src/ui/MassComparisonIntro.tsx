const root = `${import.meta.env.BASE_URL}illustrations/props/`;

/** Three reusable anchors, without showing the answer to any comparison task. */
export function MassComparisonIntro() {
  return (
    <div className="comparison-intro" aria-label="Как сравнивать массы">
      <p>Сначала вырази обе массы в одной единице. Потом сравни числа.</p>
      <div className="comparison-intro-anchors">
        <div>
          <img src={`${root}weight.webp`} alt="Гиря один килограмм" />
          <strong>1 кг</strong>
          <span>1 000 г</span>
        </div>
        <div>
          <img src={`${root}centner-crate.webp`} alt="Груз один центнер" />
          <strong>1 ц</strong>
          <span>100 кг</span>
        </div>
        <div>
          <img src={`${root}tonne-container.webp`} alt="Груз одна тонна" />
          <strong>1 т</strong>
          <span>1 000 кг</span>
        </div>
      </div>
      <p>Один и тот же вес можно записать по-разному.</p>
    </div>
  );
}
