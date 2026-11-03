import { useState } from 'react';
import { MassQuestionVisual } from './MassQuestionVisual';
import { Modal } from './shared';
import { MassWeightGuide } from './MassWeights';

/** Task-specific props stay visible even if Buk is hidden. A reference is not a hint. */
export function MassStory({
  taskId,
  showWeightGuide = false,
  correct,
  hint,
  hintOpen = false,
  onHint,
}: {
  taskId?: string;
  showWeightGuide?: boolean;
  correct?: boolean | null;
  hint?: string;
  hintOpen?: boolean;
  onHint?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [reference, setReference] = useState(false);
  const [fullTable, setFullTable] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  if (!open) {
    return (
      <div className="mass-story-collapsed">
        {taskId && <MassQuestionVisual taskId={taskId} />}
        <button type="button" className="mass-story-return" onClick={() => setOpen(true)}>
          Показать Бука
        </button>
      </div>
    );
  }
  return (
    <section className="mass-story" aria-label="Бук помогает с единицами массы">
      <div className="mass-story-frame">
        <img
          src={`${import.meta.env.BASE_URL}illustrations/buk/premium.webp`}
          alt="Бук — сова-помощник"
          width="208"
          height="360"
          className={correct === true ? 'buk-celebrates' : ''}
        />
        <div className="mass-story-bubble">
          <strong>Бук</strong>
          {correct != null && <p>{correct ? 'Верно!' : 'Посмотри разбор ответа ниже.'}</p>}
          <div className="mass-story-tools">
            <button
              type="button"
              aria-expanded={reference}
              onClick={() => setReference((value) => !value)}
            >
              {reference ? 'Скрыть таблицу' : 'Таблица единиц'}
            </button>
            {showWeightGuide && (
              <button type="button" onClick={() => setWeightsOpen(true)}>
                Гири и вес
              </button>
            )}
            {onHint && correct == null && (
              <button type="button" aria-expanded={hintOpen} onClick={onHint} disabled={hintOpen}>
                {hintOpen ? 'Подсказка открыта' : 'Подсказка'}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)}>
              Скрыть Бука
            </button>
          </div>
        </div>
      </div>
      {taskId && <MassQuestionVisual taskId={taskId} />}
      {hintOpen && hint && correct == null && (
        <p className="mass-story-hint" role="status">
          {hint}
        </p>
      )}
      {reference && (
        <div className="mass-story-reference" aria-label="Справка по единицам массы">
          <strong>1 кг = 1 000 г</strong>
          <button type="button" className="mass-story-action" onClick={() => setFullTable(true)}>
            Все единицы массы
          </button>
        </div>
      )}
      {weightsOpen && (
        <Modal
          title="Какая гиря сколько весит"
          onClose={() => setWeightsOpen(false)}
          className="mass-weight-dialog"
        >
          <MassWeightGuide />
        </Modal>
      )}
      {fullTable && (
        <Modal
          title="Таблица единиц массы"
          onClose={() => setFullTable(false)}
          className="mass-table-dialog"
        >
          <p>Сравни величины в одной единице измерения.</p>
          <table className="mass-units-table" aria-label="Единицы массы">
            <tbody>
              <tr>
                <th scope="row">Тонна</th>
                <td>1 т = 1 000 кг = 10 ц</td>
              </tr>
              <tr>
                <th scope="row">Центнер</th>
                <td>1 ц = 100 кг</td>
              </tr>
              <tr>
                <th scope="row">Килограмм</th>
                <td>1 кг = 1 000 г</td>
              </tr>
            </tbody>
          </table>
        </Modal>
      )}
    </section>
  );
}
