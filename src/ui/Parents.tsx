import { useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  ChevronRight,
  Database,
  FileJson,
  Heart,
  Info,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { BUILTIN_PACKS } from '../content';
import { CurriculumInfo } from './Curriculum';
import { describeValidationError, GRADES, parsePack, type ContentPack } from '../engine/content';
import { appDataSchema, createProfile, type AppData } from '../engine/model';
import { dayKey, plural } from '../engine/dates';
import { downloadJson } from '../state/storage';
import { Avatar, InfoNote, Modal, PageHeading } from './shared';
import { version } from '../../package.json';
interface Confirmation {
  title: string;
  text: string;
  label: string;
  danger?: boolean;
  onConfirm: () => void;
}
export function ConfirmDialog({
  confirmation,
  onClose,
}: {
  confirmation: Confirmation;
  onClose: () => void;
}) {
  return (
    <Modal
      title={confirmation.title}
      eyebrow="ДАВАЙТЕ УТОЧНИМ"
      onClose={onClose}
      className="confirm-dialog"
    >
      <p className="confirm-text">{confirmation.text}</p>
      <div className="confirm-actions">
        <button data-autofocus className="button secondary" onClick={onClose}>
          Отмена
        </button>
        <button
          className={`button ${confirmation.danger ? 'danger' : 'primary'}`}
          onClick={() => {
            confirmation.onConfirm();
            onClose();
          }}
        >
          {confirmation.label}
          <ArrowRight size={17} />
        </button>
      </div>
    </Modal>
  );
}
export function Parents({ onProfiles }: { onProfiles: () => void }) {
  const { data, profile, update, updateProfile, replaceData } = useApp();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [formatOpen, setFormatOpen] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const contentInput = useRef<HTMLInputElement>(null);
  const notify = (text: string, error = false) => setNotice({ text, error });
  const exportBackup = () => {
    downloadJson(data, `chislo-progress-${dayKey()}.json`);
    notify('Резервная копия подготовлена. Сохраните её в надёжном месте.');
  };
  const readFile = async (file: File | undefined, kind: 'progress' | 'content') => {
    if (!file) return;
    const max = kind === 'content' ? 1_000_000 : 5_000_000;
    if (file.size > max) {
      notify(`Файл слишком большой. Максимум ${kind === 'content' ? '1' : '5'} МБ.`, true);
      return;
    }
    try {
      const json: unknown = JSON.parse(await file.text());
      if (kind === 'progress') {
        const imported = appDataSchema.parse(json);
        setConfirmation({
          title: 'Восстановить прогресс из файла?',
          text: `В копии ${imported.profiles.length} ${plural(imported.profiles.length, ['профиль', 'профиля', 'профилей'])}: ${imported.profiles.map((p) => p.name).join(', ')}. Все текущие профили, настройки и материалы будут заменены. Перед заменой автоматически подготовим файл с нынешними данными.`,
          label: 'Восстановить',
          onConfirm: () => {
            downloadJson(data, `chislo-before-restore-${dayKey()}.json`);
            replaceData(imported);
            notify('Копия восстановлена. Проверяйте статус локального сохранения вверху экрана.');
          },
        });
      } else {
        const pack = parsePack(json);
        const customPacks = [...data.customPacks.filter((p) => p.grade !== pack.grade), pack];
        const next: AppData = { ...data, customPacks };
        if (new Blob([JSON.stringify(next)]).size > 2_000_000) {
          notify(
            'Всё вместе занимает больше 2 МБ. Сократите пакет, чтобы осталось место для резервной копии.',
            true,
          );
          return;
        }
        setConfirmation({
          title: `Добавить материалы для ${pack.grade} класса?`,
          text: `«${pack.title}»: ${pack.topics.length} ${plural(pack.topics.length, ['тема', 'темы', 'тем'])}, ${pack.topics.reduce((sum, t) => sum + t.tasks.length, 0)} заданий. Пакет заменит текущий набор этого класса. Прогресс тем с прежними ID сохранится. Уже начатый урок останется в прежней версии.`,
          label: 'Добавить пакет',
          onConfirm: () => {
            update((d) => ({
              ...d,
              customPacks: [...d.customPacks.filter((p) => p.grade !== pack.grade), pack],
            }));
            notify(`Материалы для ${pack.grade} класса добавлены.`);
          },
        });
      }
    } catch (error) {
      notify(describeValidationError(error), true);
    }
  };
  const totalTasks = profile.totals.tasks;
  return (
    <div className="page parents-page">
      <PageHeading
        eyebrow="С ЗАБОТОЙ О МАЛЕНЬКОМ ИССЛЕДОВАТЕЛЕ"
        title="Родителям"
        description="Понятные настройки, бережный подход и полный контроль над данными."
      />
      <div className="parent-intro">
        <span className="parent-intro-icon">
          <Heart size={27} strokeWidth={1.5} />
        </span>
        <div>
          <h2>Сначала понять. Потом закрепить.</h2>
          <p>
            Короткие занятия без таймера и плохих оценок. Подсказка — способ разобраться, а не
            штраф. Все темы открыты, и класс можно изменить в любой момент.
          </p>
        </div>
      </div>
      {notice && (
        <div
          role={notice.error ? 'alert' : 'status'}
          className={`notice ${notice.error ? 'error' : 'success'}`}
        >
          {notice.error ? <Info size={19} /> : <Check size={19} />}
          <span>{notice.text}</span>
          <button aria-label="Скрыть сообщение" onClick={() => setNotice(null)}>
            <X size={17} />
          </button>
        </div>
      )}
      <div className="parents-columns">
        <section className="panel parent-profile">
          <div className="section-heading">
            <h2>
              <Users size={19} />
              Маленький исследователь
            </h2>
            <button className="text-button" onClick={onProfiles}>
              Профили
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="parent-child">
            <Avatar color={profile.avatar} size={60} />
            <div>
              <strong>{profile.name}</strong>
              <span>
                {profile.grade} класс · {profile.totals.lessons}{' '}
                {plural(profile.totals.lessons, ['занятие', 'занятия', 'занятий'])}
              </span>
            </div>
          </div>
          <div className="parent-summary">
            <span>
              <strong>{totalTasks}</strong>заданий завершено
            </span>
            <span>
              <strong>
                {totalTasks ? `${Math.round((profile.totals.correct / totalTasks) * 100)}%` : '—'}
              </strong>
              верных с первого раза
            </span>
          </div>
          <button className="text-button" onClick={onProfiles}>
            Изменить имя или добавить ребёнка
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel parent-settings">
          <div className="section-heading">
            <h2>
              <SlidersHorizontal size={19} />
              Спокойный ритм
            </h2>
          </div>
          <div className="setting-row">
            <div>
              <strong>Маленькая цель на день</strong>
              <p>Число заданий в завершённых занятиях</p>
            </div>
            <div className="goal-options" role="group" aria-label="Заданий в день">
              {([5, 10, 15] as const).map((goal) => (
                <button
                  key={goal}
                  aria-pressed={profile.goal === goal}
                  className={profile.goal === goal ? 'active' : ''}
                  onClick={() => updateProfile((p) => ({ ...p, goal }))}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Меньше анимации</strong>
              <p>Ещё спокойнее, без лишнего движения</p>
            </div>
            <button
              role="switch"
              aria-checked={data.settings.reducedMotion}
              aria-label="Меньше анимации"
              className={`switch ${data.settings.reducedMotion ? 'on' : ''}`}
              onClick={() =>
                update((d) => ({
                  ...d,
                  settings: { ...d.settings, reducedMotion: !d.settings.reducedMotion },
                }))
              }
            >
              <span />
            </button>
          </div>
          <p className="small-note">
            Системное предпочтение «уменьшить движение» учитывается автоматически.
          </p>
        </section>
      </div>
      <section className="panel content-panel">
        <div className="section-heading">
          <div>
            <h2>
              <BookOpen size={20} />
              Учебные материалы
            </h2>
            <p>Содержание отдельно от движка. Добавляйте темы, не меняя приложение.</p>
          </div>
          <button className="text-button" onClick={() => setFormatOpen(true)}>
            <Braces size={16} />
            Формат JSON
          </button>
        </div>
        <div className="pack-grid">
          {GRADES.map((grade) => {
            const custom = data.customPacks.find((p) => p.grade === grade);
            const pack: ContentPack = custom ?? BUILTIN_PACKS[grade];
            return (
              <div key={grade} className="pack-card">
                <strong>
                  {grade}
                  <span>класс</span>
                </strong>
                <div>
                  <span>
                    {pack.topics.length} {plural(pack.topics.length, ['тема', 'темы', 'тем'])}
                  </span>
                  <small className={custom ? 'custom-pack-label' : ''}>
                    {custom
                      ? 'Ваши материалы'
                      : (pack.curriculum?.series ??
                        (pack.isDemo ? 'Демонабор' : 'Встроенный набор'))}
                  </small>
                </div>
                {custom && (
                  <button
                    className="icon-button"
                    aria-label={`Вернуть встроенный набор для ${grade} класса`}
                    title="Вернуть встроенный набор"
                    onClick={() =>
                      setConfirmation({
                        title: `Вернуть встроенный набор ${grade} класса?`,
                        text: 'Загруженный пакет будет убран с этого устройства. Прогресс не удаляется. Сохраните резервную копию, если хотите оставить свои материалы.',
                        label: 'Вернуть',
                        onConfirm: () =>
                          update((d) => ({
                            ...d,
                            customPacks: d.customPacks.filter((p) => p.grade !== grade),
                          })),
                      })
                    }
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <CurriculumInfo pack={BUILTIN_PACKS[4]} />
        <div className="content-panel-actions">
          <button className="button secondary" onClick={() => contentInput.current?.click()}>
            <Upload size={17} />
            Загрузить пакет тем
          </button>
          <a
            className="text-button"
            href={`${import.meta.env.BASE_URL}content/example-grade-4.json`}
            download="chislo-example-grade-4.json"
          >
            <ArrowDownToLine size={16} />
            Скачать пример
          </a>
          <span>JSON · до 1 МБ · проверка перед загрузкой</span>
        </div>
        <input
          ref={contentInput}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Файл учебных материалов"
          onChange={(e) => {
            void readFile(e.target.files?.[0], 'content');
            e.target.value = '';
          }}
        />
        <InfoNote>
          Встроенные темы — <strong>примеры для проверки механики</strong>, а не полная школьная
          программа. Основной содержательный пакет готовится отдельно. Для автора есть инструкция в
          репозитории: <code>docs/CONTENT.md</code>.
        </InfoNote>
      </section>
      <section className="panel data-panel">
        <div className="section-heading">
          <div>
            <h2>
              <Database size={20} />
              Данные в ваших руках
            </h2>
            <p>Профили, прогресс и загруженные материалы хранятся только в этом браузере.</p>
          </div>
          <ShieldCheck size={24} className="muted-icon" />
        </div>
        <div className="data-actions">
          <button className="data-action" onClick={exportBackup}>
            <span className="tone-sage">
              <ArrowDownToLine size={23} />
            </span>
            <strong>Сохранить копию</strong>
            <small>Все профили и материалы в JSON-файле</small>
            <ChevronRight size={17} />
          </button>
          <button className="data-action" onClick={() => backupInput.current?.click()}>
            <span className="tone-blue">
              <Upload size={23} />
            </span>
            <strong>Восстановить из файла</strong>
            <small>Перенести данные на другое устройство</small>
            <ChevronRight size={17} />
          </button>
        </div>
        <input
          ref={backupInput}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Файл резервной копии"
          onChange={(e) => {
            void readFile(e.target.files?.[0], 'progress');
            e.target.value = '';
          }}
        />
        <p className="privacy-explanation">
          <Info size={16} />
          Очистка данных браузера или приватный режим могут удалить прогресс. Регулярно сохраняйте
          копию. Синхронизации между устройствами пока нет.
        </p>
        <div className="reset-row">
          <span>Начать путь заново для профиля «{profile.name}»</span>
          <button
            className="text-button danger-text"
            onClick={() =>
              setConfirmation({
                title: 'Начать с чистого листа?',
                text: `Прогресс, награды и незавершённое занятие профиля «${profile.name}» будут сброшены. Остальные профили и учебные материалы не изменятся. Перед сбросом подготовим резервную копию.`,
                label: 'Сбросить прогресс',
                danger: true,
                onConfirm: () => {
                  exportBackup();
                  updateProfile((p) => ({
                    ...createProfile(p.name, p.grade, p.avatar),
                    id: p.id,
                    goal: p.goal,
                  }));
                },
              })
            }
          >
            Сбросить прогресс
          </button>
        </div>
      </section>
      <div className="parent-bottom">
        <span>
          <MonitorSmartphone size={18} />
          Работает на компьютере, планшете и телефоне
        </span>
        <span>Число · v{version} · без рекламы и аналитики</span>
      </div>
      {formatOpen && (
        <Modal
          title="Темы, которые легко добавлять"
          eyebrow="ДЛЯ АВТОРА МАТЕРИАЛОВ"
          onClose={() => setFormatOpen(false)}
          className="format-dialog"
        >
          <p className="modal-intro">
            Один JSON-пакет — один класс. В нём темы, короткие объяснения и задания. Стабильные ID
            связывают материалы с прогрессом.
          </p>
          <div className="format-types">
            <span>
              <FileJson size={20} />
              Числовой ответ
            </span>
            <span>
              <Check size={20} />
              Выбор варианта
            </span>
            <span>
              <Braces size={20} />
              Сравнение
            </span>
            <span>
              <RotateCcw size={20} />
              Порядок элементов
            </span>
            <span>
              <Braces size={20} />
              Деление с остатком
            </span>
          </div>
          <pre>{`{\n  "version": 1,\n  "grade": 4,\n  "isDemo": false,\n  "title": "Математика · 4 класс",\n  "topics": [ /* темы с заданиями */ ]\n}`}</pre>
          <p className="small-note">
            Скачайте рабочий пример: в нём все обязательные поля и несколько типов заданий. Полная
            инструкция и правила проверки находятся в <code>docs/CONTENT.md</code>.
          </p>
          <a
            className="button primary full-width"
            href={`${import.meta.env.BASE_URL}content/example-grade-4.json`}
            download="chislo-example-grade-4.json"
          >
            <ArrowDownToLine size={17} />
            Скачать рабочий JSON-пример
          </a>
        </Modal>
      )}
      {confirmation && (
        <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
      )}
    </div>
  );
}
