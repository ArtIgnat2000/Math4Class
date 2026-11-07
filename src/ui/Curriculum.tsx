import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ContentPack } from '../engine/content';
import { plural } from '../engine/dates';
import { Modal } from './shared';
import { isAuthorTask, visiblePack } from '../content/approved';

/** Textbook provenance belongs to the parent-facing materials section, not the child's route. */
export function CurriculumInfo({ pack }: { pack: ContentPack }) {
  const [open, setOpen] = useState(false);
  const source = pack.curriculum;
  if (!source) return null;
  const counts = {
    page: pack.topics.filter((t) => t.reference?.kind === 'page').length,
    contents: pack.topics.filter((t) => t.reference?.kind === 'contents').length,
    intro: pack.topics.filter((t) => t.reference?.kind === 'intro').length,
  };
  const taskCount = pack.topics.reduce((n, t) => n + t.tasks.length, 0);
  const verified = visiblePack(pack);
  const authorCount = verified.topics.reduce(
    (n, t) => n + t.tasks.filter((task) => isAuthorTask(t.id, task.id)).length,
    0,
  );
  const verifiedCount = verified.topics.reduce((n, t) => n + t.tasks.length, 0) - authorCount;
  return (
    <>
      <button className="text-button curriculum-parent-link" onClick={() => setOpen(true)}>
        Об источнике встроенных материалов 4 класса <ChevronRight size={16} />
      </button>
      {open && (
        <Modal
          title="Об учебнике и материалах"
          eyebrow="ИНФОРМАЦИЯ ДЛЯ РОДИТЕЛЕЙ"
          onClose={() => setOpen(false)}
          className="curriculum-dialog"
        >
          <p className="small-note">
            {pack.grade} класс · часть {source.part}
          </p>
          <h3>{source.title}</h3>
          <p className="curriculum-authors">{source.authors.join(', ')}.</p>
          <p className="small-note">
            Серия «{source.series}». {source.publisher}, {source.year}.
            {source.edition ? ` ${source.edition}.` : ''}
          </p>
          <p className="small-note">
            {pack.topics.length} {plural(pack.topics.length, ['тема', 'темы', 'тем'])} · {taskCount}{' '}
            {plural(taskCount, ['задание', 'задания', 'заданий'])} в банке
          </p>
          <p className="small-note" role="status">
            Детям доступны только сверенные упражнения: {verifiedCount} из {taskCount}. Остальные
            скрыты до поштучной проверки по учебнику; старый прогресс сохранён.
          </p>
          {authorCount > 0 && (
            <p className="small-note">
              Отдельно доступны {authorCount}{' '}
              {plural(authorCount, ['авторское задание', 'авторских задания', 'авторских заданий'])}{' '}
              приложения — тема «Римские цифры». Владелец утвердил их условия и ответы 6 ноября 2026
              года. Это не упражнения учебника: страницы и номера у них нет.
            </p>
          )}
          <div className="source-breakdown">
            {counts.page > 0 && (
              <p>
                <strong>{counts.page} тем по фотографиям страниц.</strong> Страница как источник
                темы не подтверждает все задания: неподтверждённые варианты скрыты.
              </p>
            )}
            {counts.contents > 0 && (
              <p>
                <strong>{counts.contents} тем по оглавлению.</strong> Сами страницы этих уроков не
                присланы; темы и упражнения скрыты.
              </p>
            )}
            {counts.intro > 0 && (
              <p>
                <strong>{counts.intro} вводных демо-тем.</strong> Не привязаны к фотографиям и
                скрыты.
              </p>
            )}
          </div>
          <p className="curriculum-coverage">{source.coverage}</p>
          <p className="small-note">
            Объяснения, круговая модель года и игры «Собери год» и «Считаем месяцы» — авторские
            материалы приложения, а не упражнения учебника: они не оцениваются и не начисляют опыт.
            Условия и ответы сверенных заданий не изменяются. Если ребёнок открывает объяснение или
            подсказку во время задания, ответ считается выполненным с помощью.
          </p>
          <p className="small-note">
            Из подтверждённых заданий выбираются упражнения для занятия. В следующий раз могут
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
