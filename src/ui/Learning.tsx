import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Heart,
  Lightbulb,
  RotateCcw,
  Search,
  Sprout,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  CATEGORIES,
  type Category,
  type Grade,
  type Topic,
  type TopicReference,
} from '../engine/content';
import { referenceLabel } from '../engine/references';
import { dayKey, plural } from '../engine/dates';
import type { Session } from '../engine/model';
import { dueTopics, gradeStats, recommendedTopic, topicKey } from '../engine/progress';
import { GradeSwitcher, InfoNote, PageHeading, TopicCard } from './shared';

export type OpenTopic = (topic: Topic, grade: Grade, mode?: Session['mode']) => void;
function GoalCard({ today }: { today: string }) {
  const { profile } = useApp();
  const count = profile.daily[today]?.tasks ?? 0;
  const percent = Math.min(1, count / profile.goal);
  const achieved = count >= profile.goal;
  return (
    <aside className={`goal-card ${achieved ? 'goal-complete' : ''}`}>
      <div className="goal-heading">
        <span className="goal-icon">
          <Target size={20} />
        </span>
        <span>
          <strong>Цель дня</strong>
        </span>
      </div>
      <div className="goal-ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="goal-ring-track" cx="60" cy="60" r="49" />
          <circle
            className="goal-ring-value"
            cx="60"
            cy="60"
            r="49"
            strokeDasharray={`${percent * 308} 308`}
          />
        </svg>
        <div>
          <strong>
            {count}
            <span>/{profile.goal}</span>
          </strong>
          <small>заданий</small>
        </div>
        {achieved && <span className="goal-done">✓</span>}
      </div>
    </aside>
  );
}
export function Learning({
  onOpen,
  onNavigate,
  onResume,
  today = dayKey(),
}: {
  onOpen: OpenTopic;
  onNavigate: (page: 'topics' | 'review') => void;
  onResume: () => void;
  today?: string;
}) {
  const { profile, pack, setGrade } = useApp();
  const next = recommendedTopic(profile, pack, today);
  const stats = gradeStats(profile, pack);
  const active = profile.activeSession;
  // Show the next untried step first; completed topics stay in the catalog.
  const routeTopics = [
    ...(next.topic ? [next.topic] : []),
    ...pack.topics.filter(
      (topic) =>
        topic.id !== next.topic?.id && !profile.topics[topicKey(pack.grade, topic.id)]?.sessions,
    ),
    ...pack.topics.filter(
      (topic) =>
        topic.id !== next.topic?.id && !!profile.topics[topicKey(pack.grade, topic.id)]?.sessions,
    ),
  ].slice(0, 3);
  return (
    <div className="page learning-page">
      <PageHeading
        title={profile.name === 'Исследователь' ? 'Твой день открытий' : `Привет, ${profile.name}!`}
        description="Маленькие шаги сегодня — большие возможности завтра."
      >
        <GradeSwitcher grade={profile.grade} onChange={setGrade} />
      </PageHeading>
      <div className="hero-grid">
        <section className="learning-hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span />
              {profile.grade} КЛАСС · ШАГ ЗА ШАГОМ
            </span>
            <h2>
              Большие открытия
              <br />
              начинаются
              <br />с маленьких чисел<span>.</span>
            </h2>
            <p>
              Разбирайся, пробуй и удивляйся.
              <br />
              Математика обязательно получится!
            </p>
            <button
              className="button primary hero-button"
              onClick={() => {
                if (active) onResume();
                else if (next.topic)
                  onOpen(next.topic, pack.grade, next.review ? 'review' : 'learn');
              }}
              disabled={!active && !next.topic}
            >
              {active
                ? 'Продолжить занятие'
                : !next.topic
                  ? 'Ожидаем проверенные задания'
                  : next.review
                    ? 'Время повторить'
                    : 'Начать занятие'}
              <ArrowRight size={18} />
            </button>
            <span className="hero-time">
              <Clock3 size={13} />
              {active
                ? `${active.grade} класс · ${active.topicTitle}`
                : next.topic
                  ? '5 минут · в своём темпе'
                  : 'Материалы проверяются по учебнику'}
            </span>
          </div>
          <div className="hero-magic" aria-hidden="true">
            <span>✦</span>
            <span>+</span>
            <span>✧</span>
          </div>
          <img
            className="hero-illustration"
            src={`${import.meta.env.BASE_URL}illustrations/math-adventure.svg`}
            alt="Дружелюбный оранжевый кубик исследует мир чисел и геометрических фигур"
          />
        </section>
        <GoalCard today={today} />
      </div>
      <section className="route-section">
        <div className="section-heading">
          <div>
            <div className="section-title">
              <h2>Твой маршрут</h2>
              <span className="grade-label">{profile.grade} класс</span>
            </div>
            <p>Следующий шаг — первым</p>
          </div>
          <button className="text-button" onClick={() => onNavigate('topics')}>
            Все темы
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="topic-grid">
          {!routeTopics.length && (
            <p role="status">Пока нет заданий, сверенных с учебником для этого класса.</p>
          )}
          {routeTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              progress={profile.topics[topicKey(pack.grade, topic.id)]}
              recommended={topic.id === next.topic?.id}
              review={next.review}
              onOpen={() =>
                onOpen(
                  topic,
                  pack.grade,
                  topic.id === next.topic?.id && next.review ? 'review' : 'learn',
                )
              }
            />
          ))}
        </div>
        <div className="route-footer">
          <span>
            <span className="tiny-leaf">
              <Sprout size={16} />
            </span>
            {stats.started
              ? `${stats.started} из ${pack.topics.length} тем уже знакомы. Продолжим?`
              : `${pack.topics.length} ${plural(pack.topics.length, ['тема', 'темы', 'тем'])} для маленьких открытий`}
          </span>
          {pack.isDemo && (
            <span className="demo-label">
              Стартовый демонабор
              <CircleInfo />
            </span>
          )}
        </div>
      </section>
      <div className="encouragement">
        <span className="encouragement-icon">
          <Lightbulb size={24} strokeWidth={1.6} />
        </span>
        <div>
          <strong>Ошибаться — часть открытия</strong>
          <p>Здесь нет плохих оценок. Есть подсказки, новые попытки и твоё «теперь понятно!»</p>
        </div>
        <span className="encouragement-heart">
          <Heart size={23} strokeWidth={1.5} />
        </span>
      </div>
      <footer className="page-footer">
        <span>С интересом к математике. С заботой о ребёнке.</span>
        <span>
          <span className="footer-dot" />
          Без рекламы и спешки
        </span>
      </footer>
    </div>
  );
}
function CircleInfo() {
  return (
    <span className="demo-info" title="Примеры для проверки движка, не полная школьная программа">
      i
    </span>
  );
}
export function Catalog({ onOpen }: { onOpen: OpenTopic }) {
  const { profile, pack, setGrade } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [section, setSection] = useState('all');
  const [origin, setOrigin] = useState<TopicReference['kind'] | 'all'>('all');
  const normalize = (s: string) => s.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
  const topics = pack.topics.filter((t) => {
    const group = pack.sections?.find((s) => s.topicIds.includes(t.id));
    return (
      (category === 'all' || t.category === category) &&
      (section === 'all' || group?.id === section) &&
      (origin === 'all' || t.reference?.kind === origin) &&
      normalize(
        `${t.title} ${t.description} ${referenceLabel(t.reference)} ${t.reference?.exercises?.join(' ') ?? ''} ${group?.title ?? ''}`,
      ).includes(normalize(search.trim()))
    );
  });
  const groups = pack.sections?.map((group) => ({
    ...group,
    topics: topics.filter((t) => group.topicIds.includes(t.id)),
  })) ?? [{ id: 'all', title: '', description: undefined, topics }];
  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setSection('all');
    setOrigin('all');
  };
  const changeGrade = (grade: Grade) => {
    setGrade(grade);
    setSection('all');
    setOrigin('all');
  };
  const taskCount = topics.reduce((n, t) => n + t.tasks.length, 0);
  return (
    <div className="page">
      <PageHeading
        eyebrow="БОЛЬШОЙ МИР МАЛЕНЬКИХ ОТКРЫТИЙ"
        title="Все темы"
        description="Выбирай то, что интересно. Здесь у каждого свой маршрут."
      >
        <GradeSwitcher grade={profile.grade} onChange={changeGrade} />
      </PageHeading>
      {pack.sections && (
        <div className="curriculum-filters">
          <label htmlFor="section-filter">
            Раздел учебника
            <select
              id="section-filter"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="all">Все разделы</option>
              {pack.sections.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="origin-filter">
            Материалы
            <select
              id="origin-filter"
              value={origin}
              onChange={(e) => setOrigin(e.target.value as TopicReference['kind'] | 'all')}
            >
              <option value="all">Все материалы</option>
              <option value="page">По фотографиям страниц</option>
              <option value="contents">Темы из оглавления</option>
              <option value="intro">Вводные демо-темы</option>
            </select>
          </label>
        </div>
      )}
      <div className="catalog-toolbar">
        <div className="filter-pills" role="group" aria-label="Раздел математики">
          <button
            className={category === 'all' ? 'active' : ''}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            Все темы
          </button>
          {Object.entries(CATEGORIES).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={category === id}
              className={category === id ? 'active' : ''}
              onClick={() => setCategory(id as Category)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти тему или страницу"
            aria-label="Поиск тем"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Очистить поиск">
              <X size={15} />
            </button>
          )}
        </label>
      </div>
      <div className="catalog-count">
        <span role="status" aria-live="polite">
          {topics.length} {plural(topics.length, ['тема', 'темы', 'тем'])}
          <span>·</span>
          {taskCount} {plural(taskCount, ['задание', 'задания', 'заданий'])} в банке
        </span>
        {pack.isDemo && <span className="demo-label">Демоматериалы · программа пополняется</span>}
      </div>
      {topics.length ? (
        groups
          .filter((group) => group.topics.length > 0)
          .map((group) => (
            <section
              className="catalog-section"
              key={group.id}
              aria-label={group.title || 'Темы класса'}
            >
              {group.title && (
                <div className="catalog-section-heading">
                  <h2>{group.title}</h2>
                  {group.description && <p>{group.description}</p>}
                </div>
              )}
              <div className="topic-grid catalog-grid">
                {group.topics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    progress={profile.topics[topicKey(pack.grade, topic.id)]}
                    onOpen={() => onOpen(topic, pack.grade)}
                  />
                ))}
              </div>
            </section>
          ))
      ) : (
        <div className="empty-state">
          <Search size={36} />
          <h2>{pack.topics.length ? 'Такой темы пока нет' : 'Задания проверяются'}</h2>
          <p>
            {pack.topics.length
              ? 'Попробуй другое слово или сбрось фильтры.'
              : 'Пока нет заданий, сверенных со страницами учебника для этого класса.'}
          </p>
          <button className="button secondary" onClick={resetFilters}>
            Показать все темы
          </button>
        </div>
      )}
      <InfoNote icon="sparkles">
        <strong>Учим понимать, а не торопиться.</strong> В проверенных темах есть короткое
        объяснение, задания и подсказки. Задания для занятия выбираются из банка темы; повторяй,
        чтобы попробовать другие варианты. Класс можно менять в любой момент.
      </InfoNote>
    </div>
  );
}
export function Review({
  onOpen,
  onNavigate,
  today = dayKey(),
}: {
  onOpen: OpenTopic;
  onNavigate: (page: 'topics') => void;
  today?: string;
}) {
  const { profile, pack, setGrade } = useApp();
  const due = dueTopics(profile, pack, today);
  const mistakes = pack.topics.filter(
    (t) =>
      profile.topics[topicKey(pack.grade, t.id)]?.mistakeIds.length &&
      !due.some((d) => d.id === t.id),
  );
  const practiced = pack.topics.filter((t) => profile.topics[topicKey(pack.grade, t.id)]?.sessions);
  return (
    <div className="page">
      <PageHeading
        eyebrow="ЧТОБЫ ЗНАНИЯ ОСТАВАЛИСЬ С ТОБОЙ"
        title="Вспомним вместе"
        description="Повторять понемногу — легче, чем учить заново."
      >
        <GradeSwitcher grade={profile.grade} onChange={setGrade} />
      </PageHeading>
      {due.length > 0 ? (
        <>
          <div className="section-heading">
            <h2>В самый раз для повторения</h2>
            <span className="soft-tag">
              <RotateCcw size={14} />
              {due.length} {plural(due.length, ['тема', 'темы', 'тем'])}
            </span>
          </div>
          <div className="topic-grid">
            {due.map((topic) => (
              <TopicCard
                topic={topic}
                key={topic.id}
                progress={profile.topics[topicKey(pack.grade, topic.id)]}
                recommended
                review
                onOpen={() => onOpen(topic, pack.grade, 'review')}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state review-empty">
          <span className="empty-plant">
            <Sprout size={56} strokeWidth={1.3} />
          </span>
          <span className="eyebrow">ВСЁ В СВОЁ ВРЕМЯ</span>
          <h2>
            {practiced.length ? 'Знаниям тоже нужно отдохнуть' : 'Сначала — маленькое знакомство'}
          </h2>
          <p>
            {practiced.length
              ? 'На сегодня обязательных повторений нет. Мы подскажем, когда лучше вернуться к темам.'
              : 'Пройди первое занятие. А мы подскажем, когда лучше вернуться к теме, чтобы всё запомнилось.'}
          </p>
          <button className="button primary" onClick={() => onNavigate('topics')}>
            <BookOpen size={17} />
            Выбрать тему
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      {mistakes.length > 0 && (
        <section className="spaced-section">
          <div className="section-heading">
            <div>
              <h2>Можно ещё потренироваться</h2>
              <p>Начнём с заданий, в которых понадобилась помощь</p>
            </div>
          </div>
          <div className="topic-grid">
            {mistakes.map((topic) => (
              <TopicCard
                topic={topic}
                key={topic.id}
                progress={profile.topics[topicKey(pack.grade, topic.id)]}
                onOpen={() => onOpen(topic, pack.grade, 'review')}
              />
            ))}
          </div>
        </section>
      )}
      {practiced.length > 0 && !mistakes.length && (
        <button
          className="practice-strip"
          onClick={() => onOpen(practiced[0], pack.grade, 'practice')}
        >
          <span className="tone-peach strip-icon">
            <Target size={23} />
          </span>
          <span>
            <strong>Потренироваться</strong>
          </span>
          <ChevronRight size={20} />
        </button>
      )}
      <InfoNote>
        Повторения появляются через 1, 3 и 7 дней по мере освоения темы. Если было непросто,
        вернёмся к ней уже завтра. Ошибки не отнимают достижения.
      </InfoNote>
    </div>
  );
}
