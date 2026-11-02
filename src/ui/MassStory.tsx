import { useState } from 'react';

const chapters: Record<string, string> = {
  'kg-3':
    'Каждая большая гиря весит 1 кг. У Бука три такие гири. Сколько граммов они весят вместе?',
  'mixed-2-350':
    'У Бука две гири по 1 кг и пакет крупы массой 350 г. Сколько граммов весит всё вместе?',
  'g-7000': 'У Бука есть груз массой 7 000 г. Сколько это килограммов?',
  'mixed-4050':
    'Бук взвесил груз массой 4 050 г. Сколько в этой массе полных килограммов и сколько граммов останется?',
  'compare-5': 'Что тяжелее: 5 кг или 4 900 г? Сначала переведи 5 кг в граммы.',
  'to-kilo': 'В пакете 750 г крупы. Сколько граммов нужно добавить, чтобы стало ровно 1 кг?',
  'order-mass':
    'На карточках записаны четыре массы. Расположи их от самой маленькой до самой большой.',
  weighing:
    'Все яблоки вместе весят 1 кг. Можно ли узнать, сколько их, если масса каждого яблока неизвестна?',
};

/** A single opt-in pilot scene, never part of answer checking or saved progress. */
export function MassStory({
  taskId,
  correct,
  hint,
}: {
  taskId?: string;
  correct?: boolean | null;
  hint?: string;
}) {
  const [open, setOpen] = useState(true);
  const [model, setModel] = useState(false);
  if (!open) {
    return (
      <button type="button" className="mass-story-return" onClick={() => setOpen(true)}>
        ▶ Вернуться к истории Бука
      </button>
    );
  }
  return (
    <section className="mass-story" aria-label="История Бука и гирек">
      <div className="mass-story-bar">
        <span>ЭПИЗОД 1 · БУК И ГИРЬКИ</span>
        <button type="button" onClick={() => setOpen(false)}>
          Пропустить сцену
        </button>
      </div>
      <div className="mass-story-frame">
        <img
          src={`${import.meta.env.BASE_URL}illustrations/buk/${correct === true ? 'happy' : 'face'}.webp`}
          alt="Бук — сова-помощник из проекта «Слово»"
          width="256"
          height="256"
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
                  ? (chapters[taskId] ?? 'Помоги Буку разобраться с массой.')
                  : 'Бук показывает: одна гиря весит 1 кг. Сколько гирек по 100 г весят столько же?'}
          </p>
        </div>
      </div>
      <div className="mass-story-model">
        <div className="mass-story-rule">
          <span>Масса одной большой гири</span>
          <strong>1 кг = 1 000 г</strong>
        </div>
        <button
          type="button"
          className="mass-story-action"
          aria-expanded={model}
          onClick={() => setModel((value) => !value)}
        >
          {model ? 'Спрятать гирьки' : 'Показать 10 гирек по 100 г'}
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
      </div>
    </section>
  );
}
