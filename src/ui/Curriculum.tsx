import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { ContentPack } from '../engine/content';
import { plural } from '../engine/dates';
import { Modal } from './shared';

export function CurriculumBanner({ pack }: { pack: ContentPack }) {
  const [open, setOpen] = useState(false);
  const source = pack.curriculum;
  if (!source) return null;
  const counts = {
    page: pack.topics.filter((t) => t.reference?.kind === 'page').length,
    contents: pack.topics.filter((t) => t.reference?.kind === 'contents').length,
    intro: pack.topics.filter((t) => t.reference?.kind === 'intro').length,
  };
  const taskCount = pack.topics.reduce((n, t) => n + t.tasks.length, 0);
  return (
    <>
      <aside className="curriculum-banner" aria-label="Учебник и материалы">
        <span className="curriculum-icon">
          <BookOpen size={25} strokeWidth={1.7} />
        </span>
        <div className="curriculum-copy">
          <span className="eyebrow">
            {pack.grade} КЛАСС · ЧАСТЬ {source.part}
          </span>
          <h2>«{source.series}»</h2>
          <p>
            {source.authors[0]}
            {source.authors.length > 1 ? ' и др.' : ''} · {source.publisher}, {source.year}
          </p>
          <p className="curriculum-scope">
            {pack.topics.length} {plural(pack.topics.length, ['тема', 'темы', 'тем'])} · {taskCount}{' '}
            {plural(taskCount, ['задание', 'задания', 'заданий'])} в банке
          </p>
          <small>По присланным фотографиям и оглавлению · не полный курс</small>
        </div>
        <button className="text-button curriculum-more" onClick={() => setOpen(true)}>
          Об учебнике и материалах <ChevronRight size={16} />
        </button>
      </aside>
      {open && (
        <Modal
          title="Об учебнике и материалах"
          eyebrow="НА ЧТО ОПИРАЕМСЯ"
          onClose={() => setOpen(false)}
          className="curriculum-dialog"
        >
          <h3>{source.title}</h3>
          <p className="curriculum-authors">{source.authors.join(', ')}.</p>
          <p className="small-note">
            Серия «{source.series}». {source.publisher}, {source.year}.
            {source.edition ? ` ${source.edition}.` : ''}
          </p>
          <div className="source-breakdown">
            {counts.page > 0 && (
              <p>
                <strong>{counts.page} тем по фотографиям страниц.</strong> Сохраняем содержание
                темы, добавляем свои тренировочные варианты.
              </p>
            )}
            {counts.contents > 0 && (
              <p>
                <strong>{counts.contents} тем по оглавлению.</strong> Сами страницы этих уроков не
                присланы. Объяснения и задания составлены самостоятельно.
              </p>
            )}
            {counts.intro > 0 && (
              <p>
                <strong>{counts.intro} вводных демо-тем.</strong> Сохранены для знакомства с
                тренажёром, без привязки к фотографиям.
              </p>
            )}
          </div>
          <p className="curriculum-coverage">{source.coverage}</p>
          <p className="small-note">
            Задания для короткого занятия выбираются из банка темы. В следующий раз могут
            встретиться другие варианты. Материалы доступны офлайн после загрузки приложения.
          </p>
          <button className="button primary full-width" onClick={() => setOpen(false)}>
            Понятно
          </button>
        </Modal>
      )}
    </>
  );
}
