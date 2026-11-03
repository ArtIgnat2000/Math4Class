import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  CloudOff,
  Download,
  Grid2X2,
  House,
  Info,
  Menu,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sprout,
  Trophy,
  X,
} from 'lucide-react';
import { useApp } from './state/AppContext';
import type { Grade, Topic } from './engine/content';
import type { Answer, Session } from './engine/model';
import { createSession, finishSession, nextTask, submitAnswer } from './engine/lesson';
import { dayKey } from './engine/dates';
import { dueTopics, streak, topicKey } from './engine/progress';
import { Learning, Catalog, Review } from './ui/Learning';
import { Progress, Rewards } from './ui/Progress';
import { Parents, ConfirmDialog } from './ui/Parents';
import { ProfilesDialog } from './ui/Profiles';
import { Lesson, Result, TopicDialog } from './ui/Lesson';
import { Brand, InfoNote, Modal, ProfileButton, StatPills } from './ui/shared';
import { version } from '../package.json';
import { canApplyUpdate } from './pwaUpdates';

type Route =
  'learn' | 'topics' | 'review' | 'progress' | 'rewards' | 'parents' | 'lesson' | 'result';
const NAV = [
  { id: 'learn', label: 'Моё обучение', icon: House },
  { id: 'topics', label: 'Все темы', icon: Grid2X2 },
  { id: 'review', label: 'Повторение', icon: RotateCcw },
  { id: 'progress', label: 'Мой прогресс', icon: ChartNoAxesCombined },
  { id: 'rewards', label: 'Мои награды', icon: Trophy },
] as const;
const routeLabels: Record<Route, string> = {
  learn: 'Моё обучение',
  topics: 'Все темы',
  review: 'Повторение',
  progress: 'Мой прогресс',
  rewards: 'Мои награды',
  parents: 'Родителям',
  lesson: 'Занятие',
  result: 'Маленькая победа',
};
function readRoute(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return Object.hasOwn(routeLabels, raw) ? (raw as Route) : 'learn';
}
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function App() {
  const { profile, pack, updateProfile, storageStatus, acknowledgeStorage } = useApp();
  const [route, setRoute] = useState<Route>(readRoute);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [today, setToday] = useState(dayKey);
  const [online, setOnline] = useState(navigator.onLine);
  const [dialog, setDialog] = useState<'profiles' | 'concept' | 'install' | null>(null);
  const [topicDialog, setTopicDialog] = useState<{
    topic: Topic;
    grade: Grade;
    mode: Session['mode'];
  } | null>(null);
  const [pendingStart, setPendingStart] = useState<(() => void) | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updatePwa = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const updating = useRef(false);
  const installPrompt = useRef<InstallPrompt | null>(null);
  const navigate = (next: Route) => {
    setRoute(next);
    setMobileOpen(false);
    window.location.hash = `/${next}`;
  };
  useEffect(() => {
    const hashChanged = () => {
      setRoute(readRoute());
      setMobileOpen(false);
    };
    const dayChanged = () => setToday(dayKey());
    const onlineChanged = () => setOnline(navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPrompt;
    };
    window.addEventListener('hashchange', hashChanged);
    window.addEventListener('online', onlineChanged);
    window.addEventListener('offline', onlineChanged);
    document.addEventListener('visibilitychange', dayChanged);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    const timer = window.setInterval(dayChanged, 60_000);
    return () => {
      window.removeEventListener('hashchange', hashChanged);
      window.removeEventListener('online', onlineChanged);
      window.removeEventListener('offline', onlineChanged);
      document.removeEventListener('visibilitychange', dayChanged);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let disposed = false;
    let stopChecks: (() => void) | undefined;
    void import('virtual:pwa-register').then(({ registerSW }) => {
      if (disposed) return;
      updatePwa.current = registerSW({
        onNeedRefresh: () => setUpdateAvailable(true),
        onOfflineReady: () => setOfflineReady(true),
        onRegisteredSW: (_url, registration) => {
          if (!registration || disposed) return;
          const check = () => {
            if (navigator.onLine && document.visibilityState === 'visible') {
              setUpdateError(false);
              void registration.update().catch(() => {
                // Offline or transient network error: try again on the next visit/check.
              });
            }
          };
          const visible = () => {
            if (document.visibilityState === 'visible') check();
          };
          window.addEventListener('online', check);
          document.addEventListener('visibilitychange', visible);
          const timer = window.setInterval(check, 30 * 60_000);
          stopChecks = () => {
            window.removeEventListener('online', check);
            document.removeEventListener('visibilitychange', visible);
            window.clearInterval(timer);
          };
          check();
        },
      });
    });
    return () => {
      disposed = true;
      stopChecks?.();
    };
  }, []);
  // Never reload an unfinished answer or an open dialog. A finished lesson,
  // saved exit, or the next idle visit applies the waiting worker automatically.
  useEffect(() => {
    if (
      !updatePwa.current ||
      !canApplyUpdate({
        updateAvailable: updateAvailable && storageStatus !== 'unavailable',
        route,
        dialogOpen: !!dialog || !!topicDialog,
        pendingStart: !!pendingStart,
        mobileOpen,
        updating: updating.current,
        updateError,
      })
    )
      return;
    updating.current = true;
    void updatePwa.current(true).catch(() => {
      updating.current = false;
      setUpdateError(true);
    });
  }, [
    updateAvailable,
    route,
    dialog,
    topicDialog,
    pendingStart,
    mobileOpen,
    updateError,
    storageStatus,
  ]);
  useEffect(() => {
    document.title = `${routeLabels[route]} · Число`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key === 'Tab') {
        const items = Array.from(
          sidebar?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [],
        );
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [mobileOpen]);
  const onOpen = (topic: Topic, grade: Grade, mode: Session['mode'] = 'learn') =>
    setTopicDialog({ topic, grade, mode });
  const onStart = () => {
    if (!topicDialog) return;
    const { topic, grade, mode } = topicDialog;
    setTopicDialog(null);
    const start = () => {
      updateProfile((p) => ({
        ...p,
        activeSession: createSession(
          topic,
          grade,
          mode,
          p.topics[topicKey(grade, topic.id)]?.mistakeIds,
        ),
      }));
      navigate('lesson');
    };
    if (profile.activeSession) {
      if (profile.activeSession.topicId === topic.id && profile.activeSession.grade === grade)
        navigate('lesson');
      else setPendingStart(() => start);
    } else start();
  };
  const onSubmit = (answer: Answer) =>
    updateProfile((p) =>
      p.activeSession ? { ...p, activeSession: submitAnswer(p.activeSession, answer) } : p,
    );
  const onNext = () => {
    const session = profile.activeSession;
    if (!session) return;
    const next = nextTask(session);
    if (next) updateProfile((p) => ({ ...p, activeSession: next }));
    else {
      updateProfile((p) => finishSession(p, session).profile);
      navigate('result');
    }
  };
  const install = async () => {
    if (installPrompt.current) {
      await installPrompt.current.prompt();
      await installPrompt.current.userChoice;
      installPrompt.current = null;
    } else setDialog('install');
  };
  const dueCount = dueTopics(profile, pack, today).length;
  const lastResult = profile.history.at(-1);
  const focused =
    (route === 'lesson' && !!profile.activeSession) || (route === 'result' && !!lastResult);
  const storageMessages = {
    ok: '',
    recovered:
      'Прогресс восстановлен из предыдущей локальной копии. Последнее действие могло не сохраниться — проверьте историю занятий.',
    unavailable:
      'Браузер не даёт сохранить данные. Прогресс сейчас только в этой вкладке. Не закрывайте её, пока не скачаете резервную копию в разделе «Родителям».',
    corrupted:
      'Не удалось прочитать сохранённые данные. Открыт новый профиль. Восстановите прогресс из файла в разделе «Родителям», если у вас есть копия.',
  };
  const banners = (
    <>
      {storageStatus !== 'ok' && (
        <div className="global-banner warning" role="alert">
          <Info size={18} />
          <span>{storageMessages[storageStatus]}</span>
          <button onClick={() => navigate('parents')}>
            К данным
            <ArrowRight size={14} />
          </button>
          {storageStatus !== 'unavailable' && (
            <button
              className="banner-close"
              aria-label="Закрыть уведомление"
              onClick={acknowledgeStorage}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {!online && (
        <div className="global-banner offline" role="status">
          <CloudOff size={17} />
          <span>Сейчас без интернета. Загруженные темы и локальный прогресс доступны.</span>
        </div>
      )}
      {updateError && (
        <div className="global-banner update" role="alert">
          <span>Не удалось установить обновление. Повторим попытку при следующем открытии.</span>
          <button onClick={() => setUpdateError(false)}>Повторить</button>
        </div>
      )}
    </>
  );
  return (
    <>
      {focused ? (
        <>
          {banners}
          {route === 'lesson' && profile.activeSession ? (
            <Lesson
              session={profile.activeSession}
              onChange={(session) => updateProfile((p) => ({ ...p, activeSession: session }))}
              onSubmit={onSubmit}
              onNext={onNext}
              onExit={() => navigate('learn')}
            />
          ) : (
            lastResult && (
              <Result
                result={lastResult}
                onHome={() => navigate('learn')}
                onTopics={() => navigate('topics')}
              />
            )
          )}
        </>
      ) : (
        <div className="app-shell">
          <a
            className="skip-link"
            href="#main-content"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('main-content')?.focus();
            }}
          >
            К содержанию
          </a>
          {mobileOpen && (
            <button
              className="sidebar-scrim"
              aria-label="Закрыть меню"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <aside
            className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
            aria-label="Основная навигация"
          >
            <div className="sidebar-brand">
              <button
                className="brand-button"
                onClick={() => navigate('learn')}
                aria-label="Число — на главную"
              >
                <Brand />
              </button>
              <button
                className="icon-button mobile-close"
                aria-label="Закрыть меню"
                onClick={() => setMobileOpen(false)}
              >
                <X size={21} />
              </button>
            </div>
            <p className="sidebar-release" aria-label={`Версия приложения ${version}`}>
              Версия приложения <strong>v{version}</strong>
            </p>
            <p className="nav-caption">ТВОЁ ПРОСТРАНСТВО</p>
            <nav className="main-nav">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    href={`#/${item.id}`}
                    key={item.id}
                    className={route === item.id ? 'active' : ''}
                    aria-current={route === item.id ? 'page' : undefined}
                    onClick={() => {
                      setRoute(item.id);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                    <span>{item.label}</span>
                    {item.id === 'review' && dueCount > 0 && (
                      <span className="nav-count">{dueCount}</span>
                    )}
                    {route === item.id && <span className="nav-active-dot" />}
                  </a>
                );
              })}
            </nav>
            <div className="sidebar-philosophy">
              <span className="philosophy-art">
                <span>+</span>
                <span>÷</span>
                <i>✦</i>
              </span>
              <strong>
                Всё начинается
                <br />с любопытства
              </strong>
              <p>
                Одно «а почему?» может
                <br />
                стать большим открытием.
              </p>
              <button className="text-button" onClick={() => setDialog('concept')}>
                Как мы учимся
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="sidebar-bottom">
              <button
                className="install-card"
                onClick={() => {
                  void install();
                }}
              >
                <span>
                  <Download size={18} />
                </span>
                <div>
                  <strong>Учиться где удобно</strong>
                  <small>Установить приложение</small>
                </div>
                <ChevronRight size={14} />
              </button>
              <a
                className={`parent-nav ${route === 'parents' ? 'active' : ''}`}
                href="#/parents"
                aria-current={route === 'parents' ? 'page' : undefined}
                onClick={() => {
                  setRoute('parents');
                  setMobileOpen(false);
                }}
              >
                <Settings2 size={19} strokeWidth={1.7} />
                Родителям
                <ShieldCheck size={15} />
              </a>
              <ProfileButton
                profile={profile}
                onClick={() => {
                  setMobileOpen(false);
                  setDialog('profiles');
                }}
              />
              <p className="sidebar-credit">Сделано с заботой</p>
            </div>
          </aside>
          <div className="workspace">
            <header className="app-topbar">
              <div className="topbar-left">
                <button
                  className="icon-button mobile-menu-button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Открыть меню"
                  aria-expanded={mobileOpen}
                >
                  <Menu size={23} />
                </button>
                <div className="breadcrumbs">
                  <House size={15} />
                  <span>/</span>
                  <strong>{routeLabels[route]}</strong>
                </div>
                <span className="topbar-date">
                  {new Date(`${today}T12:00:00`).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'long',
                  })}
                </span>
              </div>
              <div className="topbar-right">
                <StatPills streak={streak(profile, today)} xp={profile.totals.xp} />
                <span className="topbar-divider" />
                <button
                  className="icon-button help-button"
                  onClick={() => setDialog('concept')}
                  aria-label="Как устроено обучение"
                >
                  <CircleHelp size={20} strokeWidth={1.7} />
                </button>
              </div>
            </header>
            {banners}
            <main id="main-content" className="main-content" tabIndex={-1}>
              {route === 'topics' ? (
                <Catalog onOpen={onOpen} />
              ) : route === 'review' ? (
                <Review today={today} onOpen={onOpen} onNavigate={navigate} />
              ) : route === 'progress' ? (
                <Progress today={today} onOpen={onOpen} />
              ) : route === 'rewards' ? (
                <Rewards today={today} />
              ) : route === 'parents' ? (
                <Parents onProfiles={() => setDialog('profiles')} />
              ) : (
                <Learning
                  today={today}
                  onOpen={onOpen}
                  onNavigate={navigate}
                  onResume={() => navigate('lesson')}
                />
              )}
            </main>
            {offlineReady && (
              <div className="offline-ready" role="status">
                <Check size={15} />
                Можно заниматься без интернета
                <button
                  className="icon-button"
                  aria-label="Скрыть сообщение о доступности офлайн"
                  onClick={() => setOfflineReady(false)}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {dialog === 'profiles' && <ProfilesDialog onClose={() => setDialog(null)} />}
      {dialog === 'concept' && (
        <Modal
          title="Математика, которая получается"
          eyebrow="МАЛЕНЬКИМИ ШАГАМИ, С БОЛЬШИМ ИНТЕРЕСОМ"
          onClose={() => setDialog(null)}
          className="concept-dialog"
        >
          <p className="modal-intro">
            «Число» — спокойное пространство для знакомства с математикой в 1–4 классах. Без гонки,
            оценок и сравнения с другими.
          </p>
          <div className="concept-steps">
            <div>
              <span className="tone-sage">
                <BookOpen size={23} />
              </span>
              <section>
                <h3>Сначала понять</h3>
                <p>Короткое объяснение и пример перед каждым занятием.</p>
              </section>
            </div>
            <div>
              <span className="tone-peach">
                <Sprout size={23} />
              </span>
              <section>
                <h3>Попробовать самому</h3>
                <p>Пять заданий в своём темпе. Если трудно — можно взять подсказку.</p>
              </section>
            </div>
            <div>
              <span className="tone-lavender">
                <RotateCcw size={23} />
              </span>
              <section>
                <h3>Вернуться к открытию</h3>
                <p>Разберём ошибку, попробуем снова, а через несколько дней повторим тему.</p>
              </section>
            </div>
          </div>
          <button
            data-autofocus
            className="button primary full-width"
            onClick={() => setDialog(null)}
          >
            Хочу попробовать
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {dialog === 'install' && (
        <Modal
          title="Число всегда под рукой"
          eyebrow="КАК ОБЫЧНОЕ ПРИЛОЖЕНИЕ"
          onClose={() => setDialog(null)}
        >
          <span className="install-modal-icon tone-sage">
            <Download size={32} />
          </span>
          <p className="modal-intro">
            На телефоне или компьютере «Число» можно добавить на главный экран. После первой
            загрузки опубликованная версия работает без интернета.
          </p>
          <div className="install-instructions">
            <p>
              <strong>Android и компьютер</strong>Откройте меню браузера → «Установить приложение»
              или «Добавить на главный экран».
            </p>
            <p>
              <strong>iPhone и iPad</strong>В Safari нажмите «Поделиться» → «На экран Домой».
            </p>
          </div>
          <InfoNote>
            В режиме разработки установка недоступна. Для проверки используйте опубликованную или
            собранную версию по HTTPS.
          </InfoNote>
          <button
            data-autofocus
            className="button primary full-width"
            onClick={() => setDialog(null)}
          >
            Понятно
            <Check size={17} />
          </button>
        </Modal>
      )}
      {topicDialog && (
        <TopicDialog
          {...topicDialog}
          isDemo={pack.isDemo || !!topicDialog.topic.isDemo}
          progress={profile.topics[topicKey(topicDialog.grade, topicDialog.topic.id)]}
          onClose={() => setTopicDialog(null)}
          onStart={onStart}
        />
      )}
      {pendingStart && (
        <ConfirmDialog
          confirmation={{
            title: 'Начать новое открытие?',
            text: `Уже начато занятие «${profile.activeSession?.topicTitle}». Если начать другое, незавершённые ответы первого занятия будут заменены. Ранее полученные достижения останутся.`,
            label: 'Начать новое',
            onConfirm: pendingStart,
          }}
          onClose={() => setPendingStart(null)}
        />
      )}
    </>
  );
}
