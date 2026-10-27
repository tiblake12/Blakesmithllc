// Turns a lesson, checkpoint or review into a script of spoken steps.
import type { Course, Item, Lesson, Unit } from '../content';
import { CHECKPOINT_PASS, type DueWord } from './progress';
import { t } from './text';

export type QuestionType = 'say-target' | 'say-meaning' | 'say-sentence';

export interface Question {
  type: QuestionType;
  item: Item;
  /** Scored questions count towards the result; practice ones don't. */
  scored: boolean;
}

export type Step =
  | { kind: 'say'; text: string }
  | { kind: 'teach'; item: Item }
  | { kind: 'ask'; q: Question };

export interface Plan {
  mode: 'lesson' | 'checkpoint' | 'review';
  title: string;
  steps: Step[];
  /** Ask missed questions again at the end (lessons only). */
  retryMistakes: boolean;
}

export type Random = () => number;

export function shuffle<T>(arr: T[], rand: Random = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number, rand: Random = Math.random): T[] {
  return shuffle(arr, rand).slice(0, n);
}

/** English meaning as it should be spoken: "also / too" → "also, or too". */
export function spokenEnglish(e: string): string {
  return e.replace(/\s*\/\s*/g, ', or ');
}

const ask = (type: QuestionType, item: Item, scored = true): Step => ({ kind: 'ask', q: { type, item, scored } });
const say = (text: string): Step => ({ kind: 'say', text });

export function lessonPlan(lesson: Lesson, rand: Random = Math.random): Plan {
  const words = lesson.items;
  const steps: Step[] = [
    say(`Lesson ${lesson.index + 1}: ${lesson.title}. You'll learn ${words.length} new words, then take a short quiz.`),
  ];
  // Teach each word, and recall the previous one straight after, so it sticks.
  words.forEach((w, i) => {
    steps.push({ kind: 'teach', item: w });
    if (i >= 1) steps.push(ask('say-target', words[i - 1], false));
  });
  steps.push(say(`Here's a tip. ${lesson.tip}`));
  steps.push(say(lesson.sentences.length > 1 ? 'Now some sentences.' : 'Now a sentence.'));
  lesson.sentences.forEach((s) => steps.push({ kind: 'teach', item: s }));
  steps.push(say('Quiz time. Answer out loud after the tone.'));
  const meaning = new Set(sample(words, 2, rand).map((w) => w.id));
  const quiz = shuffle(words, rand).map((w) => ask(meaning.has(w.id) ? 'say-meaning' : 'say-target', w));
  steps.push(...quiz, ...shuffle(lesson.sentences, rand).map((s) => ask('say-sentence', s)));
  return { mode: 'lesson', title: lesson.title, steps, retryMistakes: true };
}

export function checkpointPlan(unit: Unit, rand: Random = Math.random): Plan {
  const words = unit.lessons.flatMap((l) => l.items);
  const sentences = unit.lessons.flatMap((l) => l.sentences);
  const picked = sample(words, 10, rand);
  const qs = picked.map((w, i) => ask(i % 3 === 2 ? 'say-meaning' : 'say-target', w));
  qs.push(...sample(sentences, 2, rand).map((s) => ask('say-sentence', s)));
  const steps: Step[] = [
    say(
      `Checkpoint for unit ${unit.index + 1}: ${unit.title}. ${qs.length} questions, one try each. ` +
        `Score ${CHECKPOINT_PASS} percent to pass.`,
    ),
    ...shuffle(qs, rand),
  ];
  return { mode: 'checkpoint', title: `Unit ${unit.index + 1} checkpoint`, steps, retryMistakes: false };
}

export function reviewPlan(words: DueWord[], rand: Random = Math.random): Plan {
  const picked = shuffle(words, rand).sort((a, b) => a.box - b.box).slice(0, 10);
  const steps: Step[] = [
    say(`Review time. ${picked.length} word${picked.length === 1 ? '' : 's'}.`),
    ...picked.map((d, i) => ask(i % 2 ? 'say-meaning' : 'say-target', d.item)),
  ];
  return { mode: 'review', title: 'Review', steps, retryMistakes: false };
}

export function promptFor(q: Question): string {
  switch (q.type) {
    case 'say-target':
      return `How do you say: ${spokenEnglish(q.item.e)}?`;
    case 'say-meaning':
      return `What does ${t(q.item.t)} mean?`;
    case 'say-sentence':
      return `How would you say: ${q.item.e}?`;
  }
}

export function scoredCount(plan: Plan): number {
  return plan.steps.filter((s) => s.kind === 'ask' && s.q.scored).length;
}

export type { Course };
