import { useState } from 'react';
import { MassQuestionVisual } from './MassQuestionVisual';

const chapters: Record<string, string> = {
  'kg-3': 'Каждая гиря весит 1 кг. У Бука три гири. Сколько граммов они весят вместе?',
  'mixed-2-350': 'Две гири по 1 кг и пакет 350 г. Какова их общая масса в граммах?',
  'g-7000': 'Груз весит 7 000 г. Сколько это килограммов?',
  'mixed-4050': 'Груз весит 4 050 г. Сколько здесь килограммов и сколько граммов?',
  'compare-5': 'Сравни 5 кг и 4 900 г. Сначала вырази 5 кг в граммах.',
  'to-kilo': 'К 750 г нужно добавить крупу. Сколько граммов добавить до 1 кг?',
  'order-mass': 'Расположи четыре массы по возрастанию.',
  weighing: 'Все яблоки весят 1 кг. Можно ли узнать их число, не зная массу каждого?',
};

/** One contextual scene. Opening a reference never marks the task as assisted;
 *  requesting its hint uses the existing lesson hint/progress mechanism. */
export function MassStory({
  taskId,
  correct,
  hint,
  hintOpen = false,
  onHint,
}: {
  taskId?: string;
  correct?: boolean | null;
  hint?: string;
  hintOpen?: boolean;
  onHint?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [reference, setReference] = useState(false);
  const [fullTable, setFullTable] = useState(false);
  const [model, setModel] = useState(false);
  if (!open) {
    return (
      <div className="mass-story-collapsed">
        {taskId && <MassQuestionVisual taskId={taskId} />}
        <button type="button" className="mass-story-return" onClick={() => setOpen(true)}>
          Показать Бука и справку
        </button>
      </div>
    );
  }
  return (
    <section className="mass-story" aria-label="Бук помогает с единицами массы">
      <div className="mass-story-bar">
        <span>БУК · ЕДИНИЦЫ МАССЫ</span>
        <button type="button" onClick={() => setOpen(false)}>
          Скрыть Бука
        </button>
      </div>
      <div className="mass-story-frame">
        <img
          src={`${import.meta.env.BASE_URL}illustrations/buk/${correct === true ? 'happy' : 'face'}.webp`}
          alt="Бук — сова-помощник из проекта «Слово»"
          width="104"
          height="178"
        />
        <div className="mass-story-bubble" key={`${taskId ?? 'intro'}-${String(correct)}`}>
          <strong>
            {correct === true
              ? 'Бук радуется!'
              : correct === false
                ? 'Бук подсказывает'
                : 'Бук спрашивает'}
          </strong>
          <p>
            {correct === true
              ? 'Верно! Ниже показано, как получить ответ.'
              : correct === false
                ? `Не страшно ошибиться. ${hint ?? 'Вспомни: 1 кг = 1 000 г.'}`
                : taskId
                  ? (chapters[taskId] ?? 'Посмотри на предметы и подумай о массе.')
                  : 'Одна большая гиря весит 1 кг. Сколько гирек по 100 г весят столько же?'}
          </p>
        </div>
      </div>
      {taskId && <MassQuestionVisual taskId={taskId} />}
      <div className="mass-story-tools">
        <button
          type="button"
          aria-expanded={reference}
          onClick={() => setReference((value) => !value)}
        >
          {reference ? 'Скрыть справку' : 'Бук: справка о массе'}
        </button>
        {onHint && correct == null && (
          <button type="button" aria-expanded={hintOpen} onClick={onHint} disabled={hintOpen}>
            {hintOpen ? 'Подсказка открыта' : 'Бук: подсказка к вопросу'}
          </button>
        )}
      </div>
      {hintOpen && hint && correct == null && (
        <p className="mass-story-hint" role="status">
          {hint}
        </p>
      )}
      {reference && (
        <div className="mass-story-reference" aria-label="Справка по единицам массы">
          <strong>1 кг = 1 000 г</strong>
          <p>Одна гиря в 1 кг весит столько же, сколько десять гирек по 100 г.</p>
          <button
            type="button"
            className="mass-story-action"
            aria-expanded={model}
            onClick={() => setModel((value) => !value)}
          >
            {model ? 'Скрыть десять гирек' : 'Показать десять гирек по 100 г'}
          </button>
          {model && (
            <div
              className="mass-story-weights"
              aria-label="Десять гирек по 100 граммов вместе весят один килограмм"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="mass-story-weight" aria-hidden="true">
                  100 г
                </span>
              ))}
              <strong>10 × 100 г = 1 000 г = 1 кг</strong>
            </div>
          )}
          <button
            type="button"
            className="mass-story-action"
            aria-expanded={fullTable}
            onClick={() => setFullTable((value) => !value)}
          >
            {fullTable ? 'Свернуть таблицу' : 'Вся таблица единиц массы'}
          </button>
          {fullTable && (
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
          )}
        </div>
      )}
    </section>
  );
}
