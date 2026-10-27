import { RAW_COURSES } from './courses';
import type { Course, Item, RawCourse } from './types';

export * from './types';

export function prepareCourse(raw: RawCourse): Course {
  return {
    ...raw,
    units: raw.units.map((unit, ui) => ({
      index: ui,
      title: unit.title,
      description: unit.description,
      lessons: unit.lessons.map((lesson, li) => ({
        key: `u${ui}l${li}`,
        unit: ui,
        index: li,
        title: lesson.title,
        tip: lesson.tip,
        items: lesson.words.map(([t, e, alt]): Item => ({ id: `${raw.id}:${t}`, t, e, alt: alt ?? [], kind: 'word' })),
        sentences: lesson.sentences.map(([t, e]): Item => ({ id: `${raw.id}:${t}`, t, e, alt: [], kind: 'sentence' })),
      })),
    })),
  };
}

export const COURSES: Course[] = RAW_COURSES.map(prepareCourse);

export function getCourse(id: string | null | undefined): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function allWords(course: Course): Item[] {
  return course.units.flatMap((u) => u.lessons.flatMap((l) => l.items));
}

export function allLessons(course: Course) {
  return course.units.flatMap((u) => u.lessons);
}
