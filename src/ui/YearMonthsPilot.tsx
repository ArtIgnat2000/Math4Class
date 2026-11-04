import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CalendarIntro, CalendarVisual } from './CalendarVisual';

const groups = [
  { name: 'Зима', art: 'winter.webp', months: ['Декабрь', 'Январь', 'Февраль'] },
  { name: 'Весна', art: 'spring.webp', months: ['Март', 'Апрель', 'Май'] },
  { name: 'Лето', art: 'summer.webp', months: ['Июнь', 'Июль', 'Август'] },
  { name: 'Осень', art: 'autumn.webp', months: ['Сентябрь', 'Октябрь', 'Ноябрь'] },
] as const;

/** A self-paced explanation, not an additional unapproved quiz. */
export function YearMonthsPilot({ onPractice }: { onPractice: () => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(0);
  const group = groups[selected];
  return (
    <div className="year-month-pilot">
      <p className="pilot-step" aria-live="polite">
        Открытие {step + 1} из 3
      </p>
      {step === 0 && (
        <section aria-label="Круг года">
          <h3>Куда год возвращается?</h3>
          <CalendarIntro />
        </section>
      )}
      {step === 1 && (
        <section aria-label="Месяцы времён года">
          <h3>В каждом времени года — три месяца</h3>
          <p>Нажми на время года и рассмотри его месяцы.</p>
          <div className="pilot-seasons" role="group" aria-label="Выбрать время года">
            {groups.map((item, index) => (
              <button
                type="button"
                key={item.name}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <img src={`${import.meta.env.BASE_URL}illustrations/calendar/${item.art}`} alt="" />
                <strong>{item.name}</strong>
              </button>
            ))}
          </div>
          <div className="pilot-months" aria-live="polite">
            <strong>{group.name}</strong>
            <span>{group.months.join(' → ')}</span>
          </div>
        </section>
      )}
      {step === 2 && (
        <section aria-label="Двенадцать месяцев года">
          <h3>Круг замкнулся: снова начинается год</h3>
          <CalendarVisual topicId="calendar-months" taskId="month-count" />
          <p className="pilot-rule">
            <strong>1 год = 12 месяцев.</strong> Справку о временах года можно открыть снова в любой
            момент.
          </p>
        </section>
      )}
      <div className="pilot-actions">
        {step > 0 && (
          <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} /> Назад
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="button primary" onClick={() => setStep(step + 1)}>
            Дальше <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" className="button primary" onClick={onPractice}>
            Проверить себя <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
