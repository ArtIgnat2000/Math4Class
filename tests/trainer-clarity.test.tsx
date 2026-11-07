import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AreaPilot } from '../src/ui/AreaPilot';
import { DecimalPilot } from '../src/ui/DecimalPilot';
import { DividendPilot } from '../src/ui/DividendPilot';
import { EquationPilot } from '../src/ui/EquationPilot';
import { RomanNumeralsPilot } from '../src/ui/RomanNumeralsPilot';
import { YearMonthsPilot } from '../src/ui/YearMonthsPilot';
import { STORAGE_KEY } from '../src/state/storage';

const practice = vi.fn();
const lessons = [
  {
    title: 'площадь',
    render: () => <AreaPilot onPractice={practice} />,
    games: [
      {
        name: /игра «Найди часть»/,
        goal: 'Найди площадь выделенного треугольника.',
        action: /Квадрат разделён на 4 равные части/,
      },
      {
        name: /игра «Собери половину»/,
        goal: 'Собери половину квадрата.',
        action: /Нажми названия двух частей/,
      },
    ],
  },
  {
    title: 'уравнения',
    render: () => <EquationPilot onPractice={practice} />,
    games: [
      { name: /игра «Найди число»/, goal: 'Чему равен x?', action: 'Нажми число.' },
      {
        name: /игра «Собери решение»/,
        goal: 'Собери решение по порядку',
        action: 'Нажми: уравнение, действие, значение x.',
      },
    ],
  },
  ...(['powers', 'place'] as const).map((kind) => ({
    title: kind,
    render: () => <DecimalPilot kind={kind} onPractice={practice} />,
    games: [
      {
        name: /игра «Найди результат»/,
        goal: 'Вычисли и нажми ответ под примером.',
        action: 'Выбери число.',
      },
      {
        name: /игра «Собери число»/,
        goal: 'Собери число из разрядов',
        action: 'Читай разряды слева направо. Нажимай нужные цифры.',
      },
    ],
  })),
  {
    title: 'делимое',
    render: () => <DividendPilot onPractice={practice} />,
    games: [
      {
        name: /игра «Найди делимое»/,
        goal: 'Сколько всего было предметов?',
        action: 'Сосчитай предметы в группах и остаток. Нажми ответ.',
      },
      {
        name: /игра «Собери остаток»/,
        goal: 'Найдём делимое: сколько всего было предметов?',
        action: /«\+ 1» — добавить/,
      },
    ],
  },
  {
    title: 'годы',
    render: () => <YearMonthsPilot onPractice={practice} />,
    games: [
      {
        name: /игра «Собери год»/,
        goal: 'Расставь месяцы по порядку на круге года.',
        action: /Перетащи или нажми/,
      },
      {
        name: /игра «Считаем месяцы»/,
        goal: 'Сколько месяцев вместе?',
        action: 'Нажми число месяцев.',
      },
    ],
  },
  {
    title: 'римские цифры',
    render: () => <RomanNumeralsPilot onPractice={practice} />,
    games: [
      {
        name: /Игра «Римские часы»/,
        goal: 'Найди на круге римскую запись числа в центре.',
        action: /Проведи пальцем по кругу или нажми сектор/,
      },
      {
        name: /Игра «Собери число»/,
        goal: 'Запиши римскими цифрами',
        action: /Перетащи знак в запись или нажми его/,
      },
    ],
  },
];

describe('visible trainer goals across available lessons', () => {
  for (const lesson of lessons)
    it(`${lesson.title}: both games explain the goal and action without opening help`, async () => {
      const user = userEvent.setup();
      render(lesson.render());
      for (const game of lesson.games) {
        await user.click(screen.getByRole('button', { name: game.name }));
        expect(screen.getByRole('button', { name: 'Справка' })).toHaveAttribute(
          'aria-expanded',
          'false',
        );
        expect(screen.getByText(game.goal)).toBeVisible();
        expect(screen.getByText(game.action)).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'К объяснению' }));
      }
      expect(practice).not.toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});
