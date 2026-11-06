import {
  Award,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Flame,
  Footprints,
  LockKeyhole,
  Mountain,
  Sprout,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  BADGES,
  badgeValues,
  gradeStats,
  LEVEL_LABELS,
  streak,
  topicKey,
} from '../engine/progress';
import { dayKey, plural, recentDays } from '../engine/dates';
import { GradeSwitcher, InfoNote, PageHeading, ProgressBar, Stars, TopicSymbol } from './shared';
import type { OpenTopic } from './Learning';
const BADGE_GOALS: Record<(typeof BADGES)[number]['id'], string> = {
  first: '1 занятие',
  ten: '10 верных ответов',
  perfect: 'Без ошибок и подсказок',
  recovery: '5 исправленных ошибок',
  week: '7 дней подряд',
  master: '5 тем на «Умею»',
};
const badgeIcons = {
  footprints: Footprints,
  check: CheckCheck,
  target: Target,
  sprout: Sprout,
  flame: Flame,
  mountain: Mountain,
};
export function Progress({ onOpen, today = dayKey() }: { onOpen: OpenTopic; today?: string }) {
  const { profile, pack, setGrade } = useApp();
  const totals = profile.totals;
  const stats = gradeStats(profile, pack);
  const days = recentDays(today, 7);
  const max = Math.max(profile.goal, ...days.map((d) => profile.daily[d]?.tasks ?? 0));
  const accuracy = totals.tasks ? Math.round((totals.correct / totals.tasks) * 100) : 0;
  const history = [...profile.history].reverse().slice(0, 5);
  return (
    <div className="page">
      <PageHeading
        eyebrow="ТВОИ МАЛЕНЬКИЕ ПОБЕДЫ ВИДНЫ ЗДЕСЬ"
        title="Мой прогресс"
        description="Сравниваем только с собой. Каждая попытка — шаг вперёд."
      >
        <GradeSwitcher grade={profile.grade} onChange={setGrade} />
      </PageHeading>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon tone-sage">
            <BookOpen size={22} />
          </span>
          <small>Занятия</small>
          <strong>{totals.lessons}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-peach">
            <Target size={22} />
          </span>
          <small>С первого раза</small>
          <strong>{totals.tasks ? `${accuracy}%` : '—'}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-butter">
            <Flame size={22} />
          </span>
          <small>Серия</small>
          <strong>
            {streak(profile, today)}
            <span> дн.</span>
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-lavender">
            <Star size={22} />
          </span>
          <small>Опыт</small>
          <strong>{totals.xp}</strong>
        </div>
      </div>
      <div className="progress-panels">
        <section className="panel activity-panel">
          <div className="section-heading">
            <div>
              <h2>Ритм недели</h2>
              <p>Завершённые задания · все классы</p>
            </div>
            <TrendingUp size={20} className="muted-icon" />
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={days.map((d) => `${d}: ${profile.daily[d]?.tasks ?? 0} заданий`).join('; ')}
          >
            {days.map((d) => {
              const count = profile.daily[d]?.tasks ?? 0;
              return (
                <div key={d} className={`chart-column ${d === today ? 'chart-today' : ''}`}>
                  <span className="chart-value">{count}</span>
                  <div className="bar-space">
                    <div
                      className={`chart-bar ${count ? '' : 'zero'}`}
                      style={{ height: `${count ? Math.max(8, (count / max) * 100) : 4}%` }}
                    />
                  </div>
                  <span className="chart-label">
                    {new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel grade-progress-panel">
          <div className="section-heading">
            <div>
              <h2>Твой путь · {pack.grade} класс</h2>
              <p>{pack.isDemo ? 'Прогресс по демонабору' : 'Прогресс по текущему набору тем'}</p>
            </div>
            <span className="tone-sage stat-icon">
              <Sprout size={22} />
            </span>
          </div>
          <strong className="grade-percent">
            {stats.percent}
            <span>%</span>
          </strong>
          <ProgressBar value={stats.percent} label="Освоение тем класса" />
          <div className="grade-progress-stats">
            <span>
              <b>{stats.started}</b>тем {plural(stats.started, ['знакома', 'знакомы', 'знакомы'])}
            </span>
            <span>
              <b>{stats.mastered}</b>на уровне «Умею»
            </span>
            <span>
              <b>{pack.topics.length}</b>всего тем
            </span>
          </div>
          <p className="small-note">
            Уровень растёт, когда возвращаешься к теме и решаешь уверенно. Не больше одной ступени
            за день.
          </p>
        </section>
      </div>
      <section className="panel topic-progress-panel">
        <div className="section-heading">
          <h2>Как идут дела с темами</h2>
          <span className="soft-tag">{pack.grade} класс</span>
        </div>
        <div className="topic-progress-list">
          {pack.topics.map((topic) => {
            const progress = profile.topics[topicKey(pack.grade, topic.id)];
            return (
              <button
                className="topic-progress-row"
                key={topic.id}
                onClick={() => onOpen(topic, pack.grade)}
              >
                <TopicSymbol symbol={topic.symbol} color={topic.color} />
                <span className="topic-row-name">
                  <strong>{topic.title}</strong>
                  <small>{LEVEL_LABELS[progress?.level ?? 0]}</small>
                </span>
                <span
                  className="mastery-steps"
                  aria-label={`Освоено ${progress?.level ?? 0} из 3 ступеней`}
                >
                  {[1, 2, 3].map((level) => (
                    <i key={level} className={(progress?.level ?? 0) >= level ? 'complete' : ''} />
                  ))}
                </span>
                <Stars count={progress?.bestStars} />
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel history-panel">
        <div className="section-heading">
          <h2>Последние открытия</h2>
          <span className="muted">Все классы</span>
        </div>
        {history.length ? (
          <div className="history-list">
            {history.map((result) => (
              <div className="history-row" key={result.id}>
                <span className="history-check">
                  <Check size={18} />
                </span>
                <span>
                  <strong>{result.topicTitle}</strong>
                  <small>
                    {new Date(`${result.day}T12:00:00`).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    · {result.grade} класс · {result.correct} из {result.total} с первого раза
                  </small>
                </span>
                <Stars count={result.stars} />
                <span className="xp-label">+{result.xp} опыта</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="quiet-empty">
            <Footprints size={24} />
            <p>
              Здесь появится история твоих занятий.
              <br />
              Первое открытие уже ждёт!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
export function Rewards({ today = dayKey() }: { today?: string }) {
  const { profile } = useApp();
  const values = badgeValues(profile, today);
  const unlocked = BADGES.filter((b) => values[b.id] >= b.target).length;
  const level = Math.floor(profile.totals.xp / 250) + 1;
  return (
    <div className="page">
      <PageHeading
        eyebrow="КАЖДОЕ УСИЛИЕ ИМЕЕТ ЗНАЧЕНИЕ"
        title="Мои награды"
        description="Не за скорость и не за сравнение с другими. За любопытство и старание."
      />
      <section className="rewards-hero">
        <span className="reward-hero-art">
          <Award size={72} strokeWidth={1.2} />
          <span className="reward-spark s1">✦</span>
          <span className="reward-spark s2">✦</span>
        </span>
        <div>
          <span className="eyebrow">ИССЛЕДОВАТЕЛЬ ЧИСЕЛ</span>
          <h2>{level} уровень открытий</h2>
          <p>
            {profile.totals.xp} очков опыта · ещё {250 - (profile.totals.xp % 250)} до следующего
            уровня
          </p>
          <ProgressBar
            value={((profile.totals.xp % 250) / 250) * 100}
            label="Опыт до следующего уровня"
          />
        </div>
        <span className="reward-total">
          <strong>
            {unlocked}
            <span>/{BADGES.length}</span>
          </strong>
          <small>наград открыто</small>
        </span>
      </section>
      <div className="section-heading">
        <h2>Коллекция маленьких побед</h2>
        <span className="soft-tag">
          <Star size={14} />
          Всё ещё впереди
        </span>
      </div>
      <div className="badge-grid">
        {BADGES.map((badge) => {
          const Icon = badgeIcons[badge.icon];
          const value = values[badge.id];
          const done = value >= badge.target;
          return (
            <article className={`badge-card ${done ? 'unlocked' : 'locked'}`} key={badge.id}>
              <span className={`badge-medallion tone-${badge.color}`}>
                <Icon size={36} strokeWidth={1.5} />
                {done ? (
                  <span className="badge-check">
                    <Check size={13} />
                  </span>
                ) : (
                  <span className="badge-lock">
                    <LockKeyhole size={12} />
                  </span>
                )}
              </span>
              <h3>{badge.title}</h3>
              <p>{BADGE_GOALS[badge.id]}</p>
              <div className="badge-progress">
                {done ? (
                  <small>Получено</small>
                ) : (
                  <>
                    <ProgressBar value={(value / badge.target) * 100} label={badge.description} />
                    <small>
                      {Math.min(value, badge.target)} / {badge.target}
                    </small>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <InfoNote icon="sparkles">
        За самостоятельный верный ответ — 10 очков опыта, с подсказкой — 5. За новую попытку после
        ошибки — ещё 5. Старание тоже считается!
      </InfoNote>
    </div>
  );
}
