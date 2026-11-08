import { useState } from 'react';
import { Gift, Lock } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { plural } from '../engine/dates';
import {
  REWARD_ITEMS,
  REWARD_SHELVES,
  type RewardItem,
  type RewardShelf,
  collectionRank,
  rewardProgress,
  rewardsByShelf,
} from '../engine/rewards';
import { ProgressBar } from './shared';

/** Путь к картинке вещи: файлы перенесены из витрины «Слова» без переименования. */
export function rewardArtUrl(id: string): string {
  return `${import.meta.env.BASE_URL}rewards/${id}.webp`;
}

const LESSON_FORMS: [string, string, string] = ['занятие', 'занятия', 'занятий'];
const REWARD_FORMS: [string, string, string] = ['награда', 'награды', 'наград'];

function lessonsLabel(value: number): string {
  return `${value} ${plural(value, LESSON_FORMS)}`;
}

function rewardCountLabel(value: number): string {
  return `${value} ${plural(value, REWARD_FORMS)}`;
}

function RewardCard({ item, unlocked }: { item: RewardItem; unlocked: boolean }) {
  return (
    <li className={`collection-card ${unlocked ? 'unlocked' : 'locked'}`}>
      <span className="collection-art">
        <img
          src={rewardArtUrl(item.id)}
          alt=""
          width={480}
          height={360}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {!unlocked && (
          <span className="collection-lock" aria-hidden="true">
            <Lock size={13} />
          </span>
        )}
      </span>
      <span className="collection-name">{item.title}</span>
      <span className="collection-state">{unlocked ? 'Открыто' : `на ${item.need}-м занятии`}</span>
    </li>
  );
}

/**
 * «Скины и вещи» — коллекция наград за пройденные занятия.
 *
 * Правила — в engine/rewards.ts: вещь открывается на своём занятии и остаётся
 * навсегда, валюты и покупок нет. На карточке по CARD-01 только картинка,
 * название и состояние; общее условие объяснено одной строкой над полками.
 */
export function RewardCollection() {
  const { profile } = useApp();
  const lessons = profile.totals.lessons;
  const progress = rewardProgress(lessons);
  const rank = collectionRank(progress.unlocked);
  const [shelf, setShelf] = useState<'all' | RewardShelf>('all');
  const items = shelf === 'all' ? REWARD_ITEMS : rewardsByShelf(shelf);
  const nextTitles = progress.next?.items
    .map((item) => item.title)
    .slice(0, 2)
    .join(', ');

  return (
    <section className="collection" aria-labelledby="collection-title">
      <div className="section-heading">
        <div>
          <h2 id="collection-title">Скины и вещи</h2>
          <p>Открываются за пройденные занятия. Открытое остаётся навсегда.</p>
        </div>
        <span className="soft-tag">
          <Gift size={14} />
          {progress.unlocked} из {progress.total}
        </span>
      </div>

      <div className="collection-progress">
        <div className="collection-rank">
          <span className="eyebrow">ТВОЁ ЗВАНИЕ</span>
          <strong>{rank.title}</strong>
          <small>Пройдено {lessonsLabel(progress.lessons)}</small>
        </div>
        <div className="collection-next">
          {progress.next ? (
            <>
              <span className="collection-next-title">
                Бонус на {progress.next.need}-м занятии —{' '}
                {rewardCountLabel(progress.next.items.length)}
              </span>
              <ProgressBar
                value={progress.percent}
                label={`До следующего бонуса: ${lessonsLabel(progress.next.left)}`}
              />
              <small>
                Осталось {lessonsLabel(progress.next.left)}
                {nextTitles ? ` · дальше: ${nextTitles}` : ''}
              </small>
            </>
          ) : (
            <>
              <span className="collection-next-title">Коллекция собрана полностью</span>
              <ProgressBar value={100} label="Все награды открыты" />
              <small>
                Открыто {progress.total} из {progress.total}. Спасибо за старание!
              </small>
            </>
          )}
        </div>
      </div>

      <div className="collection-shelves" role="group" aria-label="Полки коллекции">
        <button
          type="button"
          className={`collection-shelf ${shelf === 'all' ? 'on' : ''}`}
          aria-pressed={shelf === 'all'}
          onClick={() => setShelf('all')}
        >
          Все
        </button>
        {REWARD_SHELVES.map((info) => (
          <button
            key={info.id}
            type="button"
            className={`collection-shelf ${shelf === info.id ? 'on' : ''}`}
            aria-pressed={shelf === info.id}
            onClick={() => setShelf(info.id)}
          >
            {info.title}
          </button>
        ))}
      </div>

      <ul className="collection-grid" aria-label={shelf === 'all' ? 'Все награды' : undefined}>
        {items.map((item) => (
          <RewardCard key={item.id} item={item} unlocked={item.need <= progress.lessons} />
        ))}
      </ul>
    </section>
  );
}
