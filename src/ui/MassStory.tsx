import { useState } from 'react';

const chapters: Record<string, string> = {
  'kg-3': 'Слон собирает три больших гири. Сколько граммов они весят вместе?',
  'mixed-2-350': 'Две большие гири привели подругу весом 350 г. Как записать их общий вес?',
  'g-7000': 'Слон нашёл 7 000 г груза. Сколько это больших гирь по килограмму?',
  'mixed-4050': 'Маленькая Гирька помогает разделить 4 050 г на килограммы и граммы.',
  'compare-5': 'Кто тяжелее: 5 кг или 4 900 г? Приведи массы к одной единице.',
  'to-kilo': 'Сколько граммов нужно добавить к 750 г, чтобы получить килограмм?',
  'order-mass': 'Расставь находки Слона от самой лёгкой до самой тяжёлой.',
  weighing: 'Яблоки бывают разными. Можно ли узнать их количество по одной только массе?',
};

/** A single opt-in pilot scene, never part of answer checking or saved progress. */
export function MassStory({ taskId, correct }: { taskId?: string; correct?: boolean | null }) {
  const [open, setOpen] = useState(true);
  const [model, setModel] = useState(false);
  if (!open) {
    return (
      <button type="button" className="mass-story-return" onClick={() => setOpen(true)}>
        ▶ Вернуться к истории Слона
      </button>
    );
  }
  return (
    <section className="mass-story" aria-label="История Слона и гирек">
      <div className="mass-story-bar">
        <span>ЭПИЗОД 1 · СЛОН И ГИРЬКИ</span>
        <button type="button" onClick={() => setOpen(false)}>
          Пропустить сцену
        </button>
      </div>
      <div className="mass-story-frame">
        <img
          src={`${import.meta.env.BASE_URL}illustrations/mass-characters.webp`}
          alt="Слон, маленькая оранжевая гирька, большая зелёная гиря и весы"
        />
        <div className="mass-story-bubble" key={`${taskId ?? 'intro'}-${String(correct)}`}>
          <strong>
            {correct === true
              ? 'Слон радуется!'
              : correct === false
                ? 'Гирьки подсказывают'
                : 'Слон спрашивает'}
          </strong>
          <p>
            {correct === true
              ? 'Ура! Проверим вместе, почему так получилось.'
              : correct === false
                ? 'Не страшно ошибиться. Вспомни: 1 кг — это 1 000 г.'
                : taskId
                  ? (chapters[taskId] ?? 'Помоги Слону разобраться с массой.')
                  : 'Как большой килограмм превращается в маленькие граммы?'}
          </p>
        </div>
      </div>
      <div className="mass-story-model">
        <div className="mass-story-rule">
          <span>Большая Гиря</span>
          <strong>1 кг = 1 000 г</strong>
        </div>
        <button
          type="button"
          className="mass-story-action"
          aria-expanded={model}
          onClick={() => setModel((value) => !value)}
        >
          {model ? 'Спрятать гирьки' : 'Показать: сколько гирек по 100 г?'}
        </button>
        {model && (
          <div
            className="mass-story-weights"
            aria-label="Десять гирек по 100 граммов составляют один килограмм"
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
