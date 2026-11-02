import type { TopicReference } from './content';

export function referenceLabel(reference?: TopicReference): string {
  if (!reference) return '';
  if (reference.kind === 'intro') return 'Вводная демо-тема';
  const pages = reference.pages.join(', ');
  return reference.kind === 'page' ? `По фото · стр. ${pages}` : `Оглавление · стр. ${pages}`;
}

export function referenceDescription(reference: TopicReference): string {
  if (reference.kind === 'intro')
    return 'Вводная тема для знакомства с тренажёром, не привязана к присланным страницам.';
  if (reference.kind === 'contents')
    return `В оглавлении тема отнесена к странице ${reference.pages.join(', ')}. Сами эти страницы не присланы. Объяснение и задания составлены самостоятельно, а не воспроизведены из учебника.`;
  return `Тема по фотографии страницы ${reference.pages.join(', ')}${reference.exercises?.length ? `, упражнения ${reference.exercises.join(', ')}` : ''}. Здесь — тренировочные задания по этой теме, а не полный набор заданий учебника.`;
}
