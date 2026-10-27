// Saved progress: unlocking, spaced repetition, streaks and XP. Pure functions.
import { allWords, type Course, type Item, type Lesson, type Unit } from '../content';

// ---------- Dates ----------

export function dayKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// ---------- State ----------

export interface SrsEntry {
  box: number;
  due: string;
}

export interface CourseProgress {
  lessons: Record<string, number>; // lesson key -> best %
  checkpoints: Record<string, number>; // unit index -> best %
  srs: Record<string, SrsEntry>;
}

export interface Stats {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  daily: Record<string, number>;
}

export interface Settings {
  /** Speak target-language words slowly by default. */
  slow: boolean;
  /** Black out the screen during sessions so the phone can go in a pocket. */
  pocketMode: boolean;
}

export interface AppState {
  v: 2;
  courseId: string | null;
  stats: Stats;
  courses: Record<string, CourseProgress>;
  settings: Settings;
}

export function freshState(): AppState {
  return {
    v: 2,
    courseId: null,
    stats: { xp: 0, streak: 0, bestStreak: 0, lastActive: null, daily: {} },
    courses: {},
    settings: { slow: false, pocketMode: true },
  };
}

export function courseProgress(state: AppState, courseId: string): CourseProgress {
  return state.courses[courseId] ?? { lessons: {}, checkpoints: {}, srs: {} };
}

// ---------- Unlocking ----------

export const CHECKPOINT_PASS = 80;

export function checkpointPassed(state: AppState, course: Course, unit: Unit): boolean {
  return (courseProgress(state, course.id).checkpoints[unit.index] ?? -1) >= CHECKPOINT_PASS;
}

export function unitUnlocked(state: AppState, course: Course, ui: number): boolean {
  return ui === 0 || checkpointPassed(state, course, course.units[ui - 1]);
}

export function lessonDone(state: AppState, course: Course, lesson: Lesson): boolean {
  return courseProgress(state, course.id).lessons[lesson.key] != null;
}

export function lessonUnlocked(state: AppState, course: Course, lesson: Lesson): boolean {
  if (!unitUnlocked(state, course, lesson.unit)) return false;
  return lesson.index === 0 || lessonDone(state, course, course.units[lesson.unit].lessons[lesson.index - 1]);
}

export function checkpointUnlocked(state: AppState, course: Course, unit: Unit): boolean {
  return unitUnlocked(state, course, unit.index) && unit.lessons.every((l) => lessonDone(state, course, l));
}

export function percentComplete(state: AppState, course: Course): number {
  let steps = 0;
  let done = 0;
  for (const u of course.units) {
    steps += u.lessons.length + 1;
    done += u.lessons.filter((l) => lessonDone(state, course, l)).length;
    if (checkpointPassed(state, course, u)) done++;
  }
  return Math.round((done / steps) * 100);
}

// ---------- Spaced repetition (Leitner boxes) ----------

/** Days until the next review for each box. Box 0 means "missed: review today". */
export const BOX_INTERVALS = [0, 1, 3, 7, 14, 30];

export function srsUpdate(entry: SrsEntry | undefined, correct: boolean, today = dayKey()): SrsEntry {
  const box = entry ? entry.box : 0;
  const next = correct ? Math.min(box + 1, BOX_INTERVALS.length - 1) : 0;
  return { box: next, due: addDays(today, BOX_INTERVALS[next]) };
}

export function isDue(entry: SrsEntry | undefined, today = dayKey()): boolean {
  return !!entry && daysBetween(entry.due, today) >= 0;
}

export interface DueWord {
  item: Item;
  box: number;
}

export function dueWords(state: AppState, course: Course, today = dayKey()): DueWord[] {
  const srs = courseProgress(state, course.id).srs;
  return allWords(course)
    .filter((w) => isDue(srs[w.id], today))
    .map((w) => ({ item: w, box: srs[w.id].box }));
}

export function learnedWords(state: AppState, course: Course): DueWord[] {
  const srs = courseProgress(state, course.id).srs;
  return allWords(course)
    .filter((w) => srs[w.id])
    .map((w) => ({ item: w, box: srs[w.id].box }));
}

// ---------- Streaks & XP ----------

export const DAILY_GOAL = 30;

export function addXp(stats: Stats, amount: number, today = dayKey()): Stats {
  const s: Stats = { ...stats, daily: { ...stats.daily } };
  if (s.lastActive !== today) {
    const gap = s.lastActive ? daysBetween(s.lastActive, today) : null;
    s.streak = gap === 1 ? s.streak + 1 : 1;
    s.lastActive = today;
  }
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  s.xp += amount;
  s.daily[today] = (s.daily[today] ?? 0) + amount;
  return s;
}

/** The streak shown to the user: it is lost once a whole day is skipped. */
export function currentStreak(stats: Stats, today = dayKey()): number {
  if (!stats.lastActive) return 0;
  return daysBetween(stats.lastActive, today) <= 1 ? stats.streak : 0;
}

export function todayXp(stats: Stats, today = dayKey()): number {
  return stats.daily[today] ?? 0;
}

// ---------- Activities ----------

export type Activity =
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'checkpoint'; unit: Unit }
  | { kind: 'review'; words: DueWord[] };

/** How many due words make the coach suggest a review before new material. */
export const REVIEW_FIRST_AT = 6;

/** The next new step in the course: the first unfinished lesson or checkpoint. */
export function nextStep(state: AppState, course: Course): Activity | null {
  for (const unit of course.units) {
    if (!unitUnlocked(state, course, unit.index)) return null;
    const lesson = unit.lessons.find((l) => !lessonDone(state, course, l));
    if (lesson) return { kind: 'lesson', lesson };
    if (!checkpointPassed(state, course, unit)) return { kind: 'checkpoint', unit };
  }
  return null;
}

/** What the coach should do when the learner taps Start or says "next". */
export function recommend(state: AppState, course: Course, today = dayKey()): Activity {
  const due = dueWords(state, course, today);
  const step = nextStep(state, course);
  if (due.length >= REVIEW_FIRST_AT || (!step && due.length)) return { kind: 'review', words: due };
  if (step) return step;
  // Course finished and nothing due: practise the weakest words.
  const weakest = learnedWords(state, course).sort((a, b) => a.box - b.box).slice(0, 10);
  return { kind: 'review', words: weakest };
}

export function describe(activity: Activity): string {
  switch (activity.kind) {
    case 'lesson':
      return `Lesson ${activity.lesson.index + 1} of unit ${activity.lesson.unit + 1}: ${activity.lesson.title}`;
    case 'checkpoint':
      return `the unit ${activity.unit.index + 1} checkpoint`;
    case 'review':
      return `a review of ${activity.words.length} word${activity.words.length === 1 ? '' : 's'}`;
  }
}

// ---------- Applying results ----------

export interface SessionResult {
  total: number;
  correct: number;
  pct: number;
  /** Word id -> answered correctly every time it was scored. */
  itemResults: Record<string, boolean>;
  missed: Item[];
}

export interface Outcome {
  state: AppState;
  xp: number;
  passed: boolean;
  /** A unit was unlocked by this result. */
  unlockedUnit: Unit | null;
  reachedGoal: boolean;
  courseFinished: boolean;
}

export function applyResult(state: AppState, course: Course, activity: Activity, r: SessionResult, today = dayKey()): Outcome {
  const prev = courseProgress(state, course.id);
  const cp: CourseProgress = {
    lessons: { ...prev.lessons },
    checkpoints: { ...prev.checkpoints },
    srs: { ...prev.srs },
  };
  for (const [id, ok] of Object.entries(r.itemResults)) cp.srs[id] = srsUpdate(cp.srs[id], ok, today);

  let xp = 0;
  let passed = true;
  let unlockedUnit: Unit | null = null;
  if (activity.kind === 'lesson') {
    cp.lessons[activity.lesson.key] = Math.max(cp.lessons[activity.lesson.key] ?? 0, r.pct);
    xp = 10 + (r.pct === 100 ? 5 : 0);
  } else if (activity.kind === 'checkpoint') {
    passed = r.pct >= CHECKPOINT_PASS;
    const wasPassed = (cp.checkpoints[activity.unit.index] ?? -1) >= CHECKPOINT_PASS;
    cp.checkpoints[activity.unit.index] = Math.max(cp.checkpoints[activity.unit.index] ?? 0, r.pct);
    xp = passed ? 20 : 5;
    if (passed && !wasPassed) unlockedUnit = course.units[activity.unit.index + 1] ?? null;
  } else {
    xp = Math.max(1, r.correct * 2);
  }

  const before = todayXp(state.stats, today);
  const next: AppState = {
    ...state,
    stats: addXp(state.stats, xp, today),
    courses: { ...state.courses, [course.id]: cp },
  };
  const courseFinished =
    activity.kind === 'checkpoint' && passed && activity.unit.index === course.units.length - 1;
  return {
    state: next,
    xp,
    passed,
    unlockedUnit,
    reachedGoal: before < DAILY_GOAL && before + xp >= DAILY_GOAL,
    courseFinished,
  };
}

