import { StepIndicator } from './StepIndicator';
import { CardGuide } from './CardGuide';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Puzzle } from 'lucide-react';
import { ROMAN_SIGNS, romanValue, toRoman, type RomanSign } from '../engine/roman';
import { RomanRecord, RomanSignCard, RomanTile } from './RomanModel';
import { RomanClockGame } from './RomanClockGame';
import { RomanBuildGame } from './RomanBuildGame';
import { RomanTheoryBoard } from './RomanTheoryBoard';

const STEP_TITLES = ['Три знака', 'Собери запись', 'Меньший слева'];

/**
 * An author's explanation of roman numerals I–XX, built by the lesson standard:
 * three interactive steps, two game mechanics, a separate checked action.
 * Month names are deliberately absent: the approved exercises ask for the month
 * behind a numeral, so showing that pair here would leak the answer (NO-LEAK-01).
 */
export function RomanNumeralsPilot({
  onPractice,
  practiceLabel = 'Проверить себя',
}: {
  onPractice: () => void;
  practiceLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [openSign, setOpenSign] = useState<RomanSign | null>(null);
  const [board, setBoard] = useState<RomanSign[]>(['X']);
  const [base, setBase] = useState<'V' | 'X'>('V');
  const [left, setLeft] = useState(true);
  const [decade, setDecade] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [game, setGame] = useState<'clock' | 'build' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const referenceId = useId();
  const statusId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, game]);

  const pair = left ? `I${base}` : `${base}I`;
  const pairRecord = decade ? `X${pair}` : pair;
  const pairValue = romanValue(pairRecord);
  const sign = openSign ? ROMAN_SIGNS.find((item) => item.sign === openSign) : null;

  if (game === 'clock') return <RomanClockGame onExit={() => setGame(null)} />;
  if (game === 'build') return <RomanBuildGame onExit={() => setGame(null)} />;

  return (
    <div className="roman-pilot">
      <h3 ref={headingRef} tabIndex={-1} className="sr-only">
        {STEP_TITLES[step]}
      </h3>
      <CardGuide
        kind="Теория"
        leading={
          <div className="pilot-topline">
            <StepIndicator
              count={STEP_TITLES.length}
              current={step}
              label={`Шаг ${step + 1} из ${STEP_TITLES.length}`}
            />
          </div>
        }
        reference={
          <button
            type="button"
            className="pilot-reference-toggle"
            aria-label="Правила знаков"
            title="Правила знаков"
            aria-expanded={referenceOpen}
            aria-controls={referenceId}
            onClick={() => setReferenceOpen((open) => !open)}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
        }
      >
        {
          [
            'Нажми знак и посмотри, сколько палочек он заменяет.',
            'Перетаскивай, добавляй и переставляй знаки. Смотри, как меняется число.',
            'Перемещай I влево или вправо и посмотри, как меняется значение.',
          ][step]
        }
      </CardGuide>

      <div
        id={referenceId}
        className="pilot-season-reference roman-reference"
        aria-label="Правила знаков"
        hidden={!referenceOpen}
      >
        <div className="roman-reference-row">
          {ROMAN_SIGNS.map((item) => (
            <span key={item.sign}>
              <RomanTile sign={item.sign} size="sm" /> {item.value}
            </span>
          ))}
        </div>
        <p>Справа — прибавляем: VI — 6.</p>
        <p>Слева — вычитаем: IV — 4.</p>
      </div>

      {step === 0 && (
        <section aria-label="Три знака римских чисел">
          <p className="pilot-instruction sr-only">
            Нажми знак, чтобы увидеть, сколько палочек он заменяет.
          </p>
          <div className="roman-sign-cards">
            {ROMAN_SIGNS.map((item) => (
              <RomanSignCard
                key={item.sign}
                sign={item.sign}
                value={item.value}
                open={openSign === item.sign}
                onSelect={() => setOpenSign(openSign === item.sign ? null : item.sign)}
              />
            ))}
          </div>
          <p className="roman-status" role="status" id={statusId}>
            {sign
              ? `${sign.sign} заменяет ${sign.value} ${sign.value === 1 ? 'палочку' : 'палочек'}.`
              : 'Нажми знак.'}
          </p>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Запись числа знаками">
          <p className="pilot-instruction sr-only">
            Добавляй, убирай и переставляй знаки. Следи, как меняется число.
          </p>
          <RomanTheoryBoard board={board} onChange={setBoard} />
        </section>
      )}

      {step === 2 && (
        <section aria-label="Меньший знак слева вычитается">
          <p className="pilot-instruction sr-only">
            Переставь I слева или справа от большего знака и сравни числа.
          </p>
          <div className="roman-pair-compare">
            <div className={`roman-pair-card ${left ? 'is-active' : ''}`}>
              <RomanRecord record={`I${base}`} />
              <strong>{romanValue(`I${base}`)}</strong>
            </div>
            <div className={`roman-pair-card ${!left ? 'is-active' : ''}`}>
              <RomanRecord record={`${base}I`} />
              <strong>{romanValue(`${base}I`)}</strong>
            </div>
          </div>
          <div className="pilot-formula" aria-live="polite">
            <span>
              {decade ? '10 + ' : ''}
              {left ? `${base === 'V' ? 5 : 10} − 1` : `${base === 'V' ? 5 : 10} + 1`}
            </span>
            <strong className="pilot-formula-result">
              {pairRecord} = {pairValue}
            </strong>
          </div>
          <div
            className="pilot-model-controls model-tools"
            role="group"
            aria-label="Инструменты модели"
          >
            <button
              type="button"
              className={`button ${left ? 'tool-add' : 'tool-remove'}`}
              aria-pressed={left}
              onClick={() => setLeft(true)}
            >
              I слева
            </button>
            <button
              type="button"
              className={`button ${!left ? 'tool-add' : 'tool-remove'}`}
              aria-pressed={!left}
              onClick={() => setLeft(false)}
            >
              I справа
            </button>
            <button
              type="button"
              className="button tool-outline"
              aria-label={`${base === 'V' ? 'V → X' : 'X → V'}: показать с ${base === 'V' ? 'X' : 'V'}`}
              onClick={() => setBase(base === 'V' ? 'X' : 'V')}
            >
              {base === 'V' ? 'V' : 'X'} → {base === 'V' ? 'X' : 'V'}
            </button>
            <button
              type="button"
              className={`button ${decade ? 'tool-add' : 'tool-outline'}`}
              aria-pressed={decade}
              aria-label="+ X: добавить десяток впереди"
              onClick={() => setDecade((value) => !value)}
            >
              + X
            </button>
          </div>
          <p className="roman-status" role="status">
            {left ? 'I слева вычитает один.' : 'I справа прибавляет один.'}
          </p>
        </section>
      )}

      <div className="model-tools roman-game-entries" role="group" aria-label="Игры">
        <button
          type="button"
          className="button tool-outline"
          aria-label="Игра «Римские часы»"
          onClick={() => setGame('clock')}
        >
          <Clock size={18} aria-hidden="true" /> Часы
        </button>
        <button
          type="button"
          className="button tool-outline"
          aria-label="Игра «Собери число»"
          onClick={() => setGame('build')}
        >
          <Puzzle size={18} aria-hidden="true" /> Собери число
        </button>
      </div>

      <div className="pilot-actions">
        {step > 0 && (
          <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} aria-hidden="true" /> Назад
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="button primary" onClick={() => setStep(step + 1)}>
            Дальше <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button primary" onClick={onPractice}>
            {practiceLabel} <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export const ROMAN_STEP_TITLES = STEP_TITLES;
export const romanRecordOf = toRoman;
