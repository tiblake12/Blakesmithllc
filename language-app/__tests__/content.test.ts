import { COURSES, allWords } from '../src/content';
import { questionCommands } from '../src/core/commands';
import { checkpointPlan, lessonPlan, reviewPlan, scoredCount } from '../src/core/plan';
import { parseMarkup, stripAccents, normalize, gradeTarget, gradeEnglish } from '../src/core/text';

describe('course content', () => {
  it('has three courses with complete lessons', () => {
    expect(COURSES.map((c) => c.id)).toEqual(['es', 'fr', 'de']);
    for (const c of COURSES) {
      const seen = new Set<string>();
      for (const u of c.units) {
        for (const l of u.lessons) {
          expect(l.items.length).toBeGreaterThanOrEqual(4);
          expect(l.sentences.length).toBeGreaterThanOrEqual(1);
          expect(parseMarkup(l.tip).some((s) => s.lang === 'target')).toBe(true);
          for (const w of l.items) {
            expect(seen.has(w.t)).toBe(false);
            seen.add(w.t);
          }
        }
      }
    }
  });

  it('every answer is accepted when said exactly', () => {
    for (const c of COURSES) {
      for (const w of allWords(c)) {
        expect(gradeTarget([w.t], [w.t, ...w.alt], c.voice).verdict).toBe('correct');
        expect(gradeEnglish([w.e.split('/')[0]], w.e).verdict).toBe('correct');
      }
    }
  });

  it('no voice command is also a lesson word, so answers are never mistaken for commands', () => {
    const phrases = new Set(questionCommands.phrases);
    for (const c of COURSES) {
      for (const w of [...allWords(c), ...c.units.flatMap((u) => u.lessons.flatMap((l) => l.sentences))]) {
        for (const form of [w.t, ...w.alt]) {
          expect({ word: form, isCommand: phrases.has(stripAccents(normalize(form))) }).toEqual({ word: form, isCommand: false });
        }
      }
    }
  });

  it('builds plans for every lesson, checkpoint and review', () => {
    for (const c of COURSES) {
      for (const u of c.units) {
        for (const l of u.lessons) {
          const p = lessonPlan(l);
          expect(p.steps.filter((s) => s.kind === 'teach')).toHaveLength(l.items.length + l.sentences.length);
          expect(scoredCount(p)).toBe(l.items.length + l.sentences.length);
        }
        expect(scoredCount(checkpointPlan(u))).toBe(12);
      }
      const words = allWords(c).map((item, i) => ({ item, box: i % 4 }));
      expect(scoredCount(reviewPlan(words))).toBe(10);
    }
  });
});
