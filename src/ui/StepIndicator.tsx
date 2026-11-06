/** Shared visual progress for theory steps and practice questions. */
export function StepIndicator({
  count,
  current,
  label,
}: {
  count: number;
  current: number;
  label: string;
}) {
  return (
    <div className="pilot-steps" role="img" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          aria-hidden="true"
          className={index < current ? 'is-done' : index === current ? 'is-current' : ''}
        />
      ))}
    </div>
  );
}
