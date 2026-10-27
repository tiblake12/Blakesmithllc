import { COURSES } from '../src/content';
import {
  addXp,
  applyResult,
  currentStreak,
  dueWords,
  freshState,
  isDue,
  nextStep,
  recommend,
  srsUpdate,
  BOX_INTERVALS,
  type AppState,
} from '../src/core/progress';

const es = COURSES[0];

describe('spaced repetition', () => {
  it('moves words up a box when right and back to the start when wrong', () => {
    let e = srsUpdate(undefined, true, '2026-01-01');
    expect(e).toEqual({ box: 1, due: '2026-01-02' });
    e = srsUpdate(e, true, '2026-01-02');
    expect(e).toEqual({ box: 2, due: '2026-01-05' });
    expect(isDue(e, '2026-01-04')).toBe(false);
    expect(isDue(e, '2026-01-05')).toBe(true);
    e = srsUpdate(e, false, '2026-01-05');
    expect(e).toEqual({ box: 0, due: '2026-01-05' });
    for (let i = 0; i < 10; i++) e = srsUpdate(e, true, '2026-01-05');
    expect(e.box).toBe(BOX_INTERVALS.length - 1);
  });
});

describe('streaks', () => {
  it('grows on consecutive days, survives month ends, and resets after a gap', () => {
    let s = freshState().stats;
    s = addXp(s, 10, '2026-01-31');
    s = addXp(s, 10, '2026-02-01');
    expect(s.streak).toBe(2);
    expect(currentStreak(s, '2026-02-02')).toBe(2);
    expect(currentStreak(s, '2026-02-03')).toBe(0);
    s = addXp(s, 5, '2026-02-04');
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(2);
    expect(s.xp).toBe(25);
  });
});

function finishLesson(state: AppState, li: number, ui = 0, pct = 100, today = '2026-05-01') {
  const lesson = es.units[ui].lessons[li];
  const itemResults = Object.fromEntries(lesson.items.map((w) => [w.id, pct === 100]));
  return applyResult(state, es, { kind: 'lesson', lesson }, { total: 8, correct: 8, pct, itemResults, missed: [] }, today);
}

describe('course progression', () => {
  it('goes lesson by lesson, then the checkpoint, which unlocks the next unit', () => {
    let s = freshState();
    expect(nextStep(s, es)).toMatchObject({ kind: 'lesson', lesson: { key: 'u0l0' } });
    for (let i = 0; i < 3; i++) s = finishLesson(s, i).state;
    const step = nextStep(s, es);
    expect(step).toMatchObject({ kind: 'checkpoint', unit: { index: 0 } });

    const fail = applyResult(s, es, step!, { total: 12, correct: 7, pct: 58, itemResults: {}, missed: [] }, '2026-05-01');
    expect(fail.passed).toBe(false);
    expect(fail.unlockedUnit).toBeNull();
    expect(nextStep(fail.state, es)).toMatchObject({ kind: 'checkpoint' });

    const pass = applyResult(fail.state, es, step!, { total: 12, correct: 11, pct: 92, itemResults: {}, missed: [] }, '2026-05-01');
    expect(pass.passed).toBe(true);
    expect(pass.unlockedUnit?.index).toBe(1);
    expect(nextStep(pass.state, es)).toMatchObject({ kind: 'lesson', lesson: { key: 'u1l0' } });
  });

  it('suggests a review first once enough words are due', () => {
    let s = freshState();
    s = finishLesson(s, 0, 0, 50, '2026-05-01').state; // all 6 words missed → due today
    expect(dueWords(s, es, '2026-05-01')).toHaveLength(6);
    expect(recommend(s, es, '2026-05-01').kind).toBe('review');
    s = finishLesson(freshState(), 0, 0, 100, '2026-05-01').state;
    expect(recommend(s, es, '2026-05-01').kind).toBe('lesson');
  });

  it('reports reaching the daily goal once', () => {
    let o = finishLesson(freshState(), 0);
    expect(o.reachedGoal).toBe(false); // 15 XP
    o = finishLesson(o.state, 1);
    expect(o.reachedGoal).toBe(true); // 30 XP
    o = finishLesson(o.state, 2);
    expect(o.reachedGoal).toBe(false);
  });
});
