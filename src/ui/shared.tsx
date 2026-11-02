import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Flame,
  Shapes,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { GRADES, type Grade, type Topic } from '../engine/content';
import { LEVEL_LABELS } from '../engine/progress';
import type { Profile, TopicProgress } from '../engine/model';

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? 'brand-small' : ''}`}>
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="42" height="42" />
      <span>
        <strong>
          число<span className="brand-dot">.</span>
        </strong>
        {!small && <small>математика с интересом</small>}
      </span>
    </span>
  );
}
export function Avatar({
  color = 'sage',
  size = 40,
}: {
  color?: Profile['avatar'];
  size?: number;
}) {
  return (
    <span
      className={`avatar tone-${color}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M11 26c-1-10 6-16 14-16s14 7 13 16v12H11V26Z" fill="currentColor" opacity=".35" />
        <circle cx="24" cy="25" r="12" fill="#fff7e6" />
        <path d="M12 22c1-9 7-15 15-12 6 1 10 6 10 12-7 1-12-3-14-6-1 4-6 6-11 6Z" fill="#637252" />
        <circle cx="20" cy="25" r="1.1" fill="#425341" />
        <circle cx="28" cy="25" r="1.1" fill="#425341" />
        <path d="M21 30c2 2 4 2 6 0" stroke="#ac7155" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = '',
  eyebrow,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  eyebrow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      );
    const target = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current;
    target?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || !ref.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`modal ${className}`}
      >
        <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть окно">
          <X size={21} />
        </button>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
export function GradeSwitcher({
  grade,
  onChange,
  compact = false,
}: {
  grade: Grade;
  onChange: (grade: Grade) => void;
  compact?: boolean;
}) {
  return (
    <div className={`grade-switcher ${compact ? 'compact' : ''}`}>
      <span>Класс</span>
      <div role="group" aria-label="Выбрать класс">
        {GRADES.map((g) => (
          <button
            type="button"
            key={g}
            aria-label={`${g} класс`}
            aria-pressed={g === grade}
            className={g === grade ? 'selected' : ''}
            onClick={() => onChange(g)}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
export function ProgressBar({
  value,
  label,
  className = '',
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`progress-track ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Stars({ count = 0, size = 14 }: { count?: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${count} из 3 звёзд`}>
      {[1, 2, 3].map((s) => (
        <Star key={s} size={size} className={s <= count ? 'filled' : ''} />
      ))}
    </span>
  );
}
export function TopicSymbol({
  symbol,
  color,
  large = false,
}: {
  symbol: Topic['symbol'];
  color: Topic['color'];
  large?: boolean;
}) {
  return (
    <span className={`topic-symbol tone-${color} ${large ? 'large' : ''}`} aria-hidden="true">
      {symbol === 'numbers' ? (
        <span className="number-symbol">
          <b>1</b>
          <b>2</b>
          <b>3</b>
        </span>
      ) : symbol === 'plus' ? (
        <span className="math-symbol">
          +<small>−</small>
        </span>
      ) : symbol === 'multiply' ? (
        <span className="math-symbol">
          ×<small>÷</small>
        </span>
      ) : symbol === 'ruler' ? (
        <svg viewBox="0 0 40 40" fill="none">
          <rect
            x="8"
            y="5"
            width="23"
            height="32"
            rx="3"
            transform="rotate(20 20 20)"
            fill="currentColor"
            opacity=".17"
          />
          <path
            d="m16 7 7 3m-9 4 4 2m-6 5 7 2m-9 5 4 1m-6 6 7 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : symbol === 'fraction' ? (
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="14" fill="currentColor" opacity=".17" />
          <path d="M20 6a14 14 0 0 1 14 14H20V6Z" fill="currentColor" opacity=".75" />
          <path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      ) : symbol === 'brackets' ? (
        <span className="bracket-symbol">(a)</span>
      ) : symbol === 'puzzle' ? (
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M8 13h8v-2a4 4 0 1 1 8 0v2h8v9h-2a4 4 0 1 0 0 8h2v4H8V13Z"
            fill="currentColor"
            opacity=".25"
          />
          <path
            d="M8 13h8v-2a4 4 0 1 1 8 0v2h8v9"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Shapes size={31} strokeWidth={1.7} />
      )}
    </span>
  );
}
export function TopicCard({
  topic,
  index,
  progress,
  recommended = false,
  onOpen,
  review = false,
}: {
  topic: Topic;
  index: number;
  progress?: TopicProgress;
  recommended?: boolean;
  onOpen: () => void;
  review?: boolean;
}) {
  return (
    <button className={`topic-card ${recommended ? 'recommended' : ''}`} onClick={onOpen}>
      <span className="topic-card-top">
        <TopicSymbol symbol={topic.symbol} color={topic.color} />
        {recommended ? (
          <span className="recommend-pill">
            {review ? 'Пора повторить' : 'Начни отсюда'}
            <Sparkles size={10} />
          </span>
        ) : (
          <span className="topic-number">{String(index + 1).padStart(2, '0')}</span>
        )}
      </span>
      <strong>{topic.title}</strong>
      <span className="topic-description">{topic.description}</span>
      <span className="topic-card-bottom">
        <span>
          {progress ? (
            <>
              <span className="topic-level">
                <span className={`level-dot level-${progress.level}`} />
                {LEVEL_LABELS[progress.level]}
              </span>
              <Stars count={progress.bestStars} size={11} />
            </>
          ) : (
            <span className="task-count">
              {Math.min(topic.lessonSize, topic.tasks.length)} заданий<span>·</span>
              {topic.minutes} минут
            </span>
          )}
        </span>
        <span className="card-arrow">
          <ArrowRight size={17} />
        </span>
      </span>
    </button>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </header>
  );
}
export function InfoNote({
  children,
  icon = 'help',
}: {
  children: ReactNode;
  icon?: 'help' | 'sparkles' | 'check';
}) {
  const Icon = icon === 'sparkles' ? Sparkles : icon === 'check' ? Check : CircleHelp;
  return (
    <div className="info-note">
      <Icon size={19} />
      <div>{children}</div>
    </div>
  );
}
export function StatPills({ streak, xp }: { streak: number; xp: number }) {
  return (
    <div className="stat-pills">
      <span title="Дней занятий подряд">
        <Flame size={17} />
        {streak}
        <span className="pill-caption">дней подряд</span>
      </span>
      <span title="Очки за завершённые занятия">
        <Star size={17} />
        {xp}
        <span className="pill-caption">опыта</span>
      </span>
    </div>
  );
}
export function ProfileButton({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  return (
    <button className="profile-button" onClick={onClick} aria-label="Открыть профили учеников">
      <Avatar color={profile.avatar} />
      <span>
        <strong>{profile.name}</strong>
        <small>{profile.grade} класс</small>
      </span>
      <ChevronDown size={16} />
    </button>
  );
}
