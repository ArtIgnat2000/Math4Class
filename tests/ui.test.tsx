import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../src/state/AppContext';
import { ProfilesDialog } from '../src/ui/Profiles';
import { Catalog, Learning } from '../src/ui/Learning';
import { Parents } from '../src/ui/Parents';
import { appDataSchema, createAppData } from '../src/engine/model';
import { STORAGE_KEY } from '../src/state/storage';
import { BUILTIN_PACKS } from '../src/content';
import { Lesson } from '../src/ui/Lesson';
import { createSession, submitAnswer } from '../src/engine/lesson';

describe('child-facing UI', () => {
  it('boots with zero real progress and keeps all four grades available', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Learning today="2026-11-02" onOpen={vi.fn()} onNavigate={vi.fn()} onResume={vi.fn()} />
      </AppProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Твой день открытий' })).toBeInTheDocument();
    expect(
      screen.getByText('0', { exact: false, selector: '.goal-ring strong' }),
    ).toHaveTextContent('0/5');
    await user.click(screen.getByRole('button', { name: '1 класс' }));
    expect(screen.getByText(/Пока нет заданий, сверенных с учебником/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 класс' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('uses a neutral home heading without changing a saved profile', () => {
    const data = createAppData();
    data.profiles[0].name = 'маме 35';
    data.profiles[0].totals = {
      tasks: 3,
      correct: 2,
      lessons: 1,
      xp: 10,
      recovered: 0,
      perfect: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render(
      <AppProvider>
        <Learning today="2026-11-02" onOpen={vi.fn()} onNavigate={vi.fn()} onResume={vi.fn()} />
      </AppProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Твой день открытий' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: /маме 35/i })).not.toBeInTheDocument();
    expect(appDataSchema.parse(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).profiles[0]).toEqual(
      data.profiles[0],
    );
  });
  it('filters content and provides a useful empty state', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Catalog onOpen={vi.fn()} />
      </AppProvider>,
    );
    await user.type(screen.getByRole('searchbox', { name: 'Поиск тем' }), 'уравнения');
    expect(
      screen.getByText('Уравнения: сложение и вычитание', { exact: true }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'not-found');
    expect(screen.getByRole('heading', { name: 'Такой темы пока нет' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать все темы' }));
    expect(
      screen.getByText('Уравнения: сложение и вычитание', { exact: true }),
    ).toBeInTheDocument();
  });
  it('does not submit the profile form when choosing a grade', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <AppProvider>
        <ProfilesDialog onClose={close} />
      </AppProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Добавить ученика' }));
    await user.type(screen.getByLabelText('Как тебя зовут?'), 'Маша');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '1 класс' }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Начать свой путь' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Начать свой путь' }));
    expect(close).toHaveBeenCalledOnce();
    const data = appDataSchema.parse(JSON.parse(localStorage.getItem(STORAGE_KEY)!));
    expect(data.profiles).toHaveLength(2);
    expect(data.profiles[1]).toMatchObject({ name: 'Маша', grade: 1, totals: { tasks: 0 } });
    expect(data.profiles[0].grade).toBe(4);
  });
  it('closes a dialog with Escape', async () => {
    const close = vi.fn();
    render(
      <AppProvider>
        <ProfilesDialog onClose={close} />
      </AppProvider>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });
});
describe('parent data controls', () => {
  it('rejects an invalid content file without replacing data', async () => {
    render(
      <AppProvider>
        <Parents onProfiles={vi.fn()} />
      </AppProvider>,
    );
    const invalid = new File(['{}'], 'bad.json', { type: 'application/json' });
    Object.defineProperty(invalid, 'text', { value: async () => '{}' });
    fireEvent.change(screen.getByLabelText('Файл учебных материалов'), {
      target: { files: [invalid] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Проверьте поле');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('changes the daily goal without touching the profile progress', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Parents onProfiles={vi.fn()} />
      </AppProvider>,
    );
    await user.click(screen.getByRole('button', { name: '10' }));
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(data.profiles[0].goal).toBe(10);
    expect(data.profiles[0].totals.tasks).toBe(0);
  });
});

describe('textbook lessons and compound answers', () => {
  it('filters by textbook section and provenance, resets on grade change and finds page numbers', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppProvider>
        <Catalog onOpen={vi.fn()} />
      </AppProvider>,
    );
    expect(container.querySelectorAll('.topic-card')).toHaveLength(9);
    await user.selectOptions(screen.getByLabelText('Раздел учебника'), 'calendar');
    expect(container.querySelectorAll('.topic-card')).toHaveLength(4);
    await user.selectOptions(screen.getByLabelText('Материалы'), 'intro');
    expect(screen.getByRole('heading', { name: 'Такой темы пока нет' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать все темы' }));
    await user.type(screen.getByRole('searchbox'), 'стр. 47');
    expect(container.querySelectorAll('.topic-card')).toHaveLength(3);
    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByLabelText('Материалы'), 'contents');
    expect(container.querySelectorAll('.topic-card')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '1 класс' }));
    expect(screen.queryByLabelText('Раздел учебника')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.topic-card')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '4 класс' }));
    expect(screen.getByLabelText('Материалы')).toHaveValue('all');
    expect(container.querySelectorAll('.topic-card')).toHaveLength(9);
  });
  it('keeps textbook provenance in Parents, not on the child home', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AppProvider>
        <Learning onOpen={vi.fn()} onNavigate={vi.fn()} onResume={vi.fn()} />
      </AppProvider>,
    );
    expect(screen.queryByRole('heading', { name: '«Школа России»' })).not.toBeInTheDocument();
    expect(screen.queryByText(/М. И. Моро/)).not.toBeInTheDocument();
    rerender(
      <AppProvider>
        <Parents onProfiles={vi.fn()} />
      </AppProvider>,
    );
    await user.click(
      screen.getByRole('button', { name: 'Об источнике встроенных материалов 4 класса' }),
    );
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('22 тем по фотографиям страниц.')).toBeInTheDocument();
    expect(dialog.getByText('7 тем по оглавлению.')).toBeInTheDocument();
    expect(dialog.getByText(/М. А. Бантова/)).toBeInTheDocument();
    expect(dialog.getByText(/16-е издание, стереотипное/)).toBeInTheDocument();
    expect(dialog.getByText(/38 тем/)).toBeInTheDocument();
    expect(dialog.getByText(/265 заданий в банке/)).toBeInTheDocument();
    // Author's exercises are counted apart from the checked textbook ones.
    expect(dialog.getByText(/3 авторских задания приложения/)).toBeInTheDocument();
    expect(dialog.getByText(/6 ноября 2026/)).toBeInTheDocument();
    // The child cards no longer carry author labels, so provenance must stay here.
    expect(dialog.getByText(/авторские материалы приложения/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('requires both integer fields, supports a zero quotient and submits an object with Enter', async () => {
    const user = userEvent.setup();
    const topic = BUILTIN_PACKS[4].topics.find((t) => t.id === 'division-remainder')!;
    const task = topic.tasks.find((t) => t.id === 'divide-5-9')!;
    const submit = vi.fn();
    render(
      <Lesson
        session={createSession({ ...topic, tasks: [task] }, 4)}
        onChange={vi.fn()}
        onSubmit={submit}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    const quotient = screen.getByLabelText('Неполное частное');
    const remainder = screen.getByLabelText('Остаток');
    const check = screen.getByRole('button', { name: 'Проверить' });
    expect(quotient).toHaveFocus();
    expect(check).toBeDisabled();
    await user.type(quotient, '0');
    expect(check).toBeDisabled();
    await user.type(remainder, '5.5');
    expect(check).toBeDisabled();
    await user.clear(remainder);
    await user.type(remainder, '5');
    expect(check).toBeEnabled();
    await user.keyboard('{Enter}');
    expect(submit).toHaveBeenCalledExactlyOnceWith({ quotient: '0', remainder: '5' });
  });
  it('restores a checked two-field answer as disabled inputs and focuses feedback', () => {
    const topic = BUILTIN_PACKS[4].topics.find((t) => t.id === 'division-remainder')!;
    const task = topic.tasks.find((t) => t.id === 'divide-74-8')!;
    const checked = submitAnswer(createSession({ ...topic, tasks: [task] }, 4), {
      quotient: '9',
      remainder: '2',
    });
    render(
      <Lesson
        session={checked}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Неполное частное')).toHaveValue('9');
    expect(screen.getByLabelText('Неполное частное')).toBeDisabled();
    expect(screen.getByLabelText('Остаток')).toHaveValue('2');
    expect(screen.getByLabelText('Остаток')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Верно!');
  });
  it.each([2, 4] as const)(
    'draws a true square divided into %s equal triangles with an accessible description',
    (parts) => {
      const topic = BUILTIN_PACKS[4].topics.find((t) => t.id === 'area-equal-parts')!;
      const task = {
        ...topic.tasks[0],
        diagram: { type: 'square-parts' as const, sideLabel: '8 см', parts },
      };
      render(
        <Lesson
          session={createSession({ ...topic, tasks: [task] }, 4)}
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          onNext={vi.fn()}
          onExit={vi.fn()}
        />,
      );
      const svg = screen.getByRole('img', {
        name: `Квадрат со стороной 8 см разделён на ${parts} равных треугольника.`,
      });
      const rect = svg.querySelector('rect')!;
      expect(rect.getAttribute('width')).toBe(rect.getAttribute('height'));
    },
  );
});

describe('lesson exit is available on every card', () => {
  it('exits before and after checking without submitting or advancing', async () => {
    const user = userEvent.setup();
    const topic = BUILTIN_PACKS[4].topics.find((t) => t.id === 'mass-kg-g')!;
    const session = createSession(topic, 4);
    const exit = vi.fn();
    const submit = vi.fn();
    const next = vi.fn();
    const { rerender } = render(
      <Lesson session={session} onChange={vi.fn()} onSubmit={submit} onNext={next} onExit={exit} />,
    );
    await user.click(screen.getByRole('button', { name: 'Сохранить и выйти' }));
    const checked = submitAnswer(session, '3000');
    rerender(
      <Lesson session={checked} onChange={vi.fn()} onSubmit={submit} onNext={next} onExit={exit} />,
    );
    await user.click(screen.getByRole('button', { name: 'Сохранить и выйти' }));
    expect(exit).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
