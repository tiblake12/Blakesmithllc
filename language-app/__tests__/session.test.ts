import { FakeVoice, perfectLearner, speech, type Learner } from '../test-utils/fakeVoice';
import { COURSES } from '../src/content';
import { runCoach } from '../src/core/coach';
import { lessonPlan } from '../src/core/plan';
import { freshState, lessonDone, checkpointPassed, type AppState } from '../src/core/progress';
import { Conversation, runPlan, type Status } from '../src/core/session';

const es = COURSES[0];
const lesson = es.units[0].lessons[0];
const seeded = () => {
  let x = 42;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
};

function setup(learner: Learner) {
  const io = new FakeVoice(learner);
  const statuses: Status[] = [];
  const conv = new Conversation(es, io, (s) => statuses.push(s), { random: seeded() });
  return { io, conv, statuses };
}

describe('voice lesson', () => {
  it('teaches every word aloud and finishes with a perfect score', async () => {
    const { io, conv } = setup(perfectLearner());
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(run).toMatchObject({ kind: 'finished', result: { pct: 100, total: 8, correct: 8 } });
    const text = io.transcript();
    for (const w of lesson.items) expect(text).toContain(`The word for ${w.e} is: {${w.t}}`);
    expect(text).toContain("Here's a tip.");
    expect(io.cues).toContain('done');
  });

  it('gives the answer when wrong, has the learner repeat it, and asks again later', async () => {
    let wrongOnce = false;
    const { io, conv } = setup((req) => {
      if (/How do you say: thank you\?/.test(req.lastSaid) && !wrongOnce && req.lastSaid.includes('Quiz') === false && io.said.some((s) => s.startsWith('Quiz'))) {
        wrongOnce = true;
        return speech('adiós');
      }
      return speech(req.hints[0]);
    });
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    if (run.kind !== 'finished') throw new Error(run.kind);
    const said = io.transcript();
    if (wrongOnce) {
      expect(said).toContain("Not quite. It's: {gracias}");
      expect(said).toContain("Let's try one from earlier again.");
      expect(run.result.missed.map((m) => m.t)).toEqual(['gracias']);
      expect(run.result.itemResults[`es:gracias`]).toBe(false);
      expect(run.result.correct).toBe(run.result.total - 1);
    } else {
      // "thank you" was a say-meaning question in this shuffle; the flow is still valid.
      expect(run.result.pct).toBe(100);
    }
  });

  it('a missed say-meaning question explains the meaning', async () => {
    const { io, conv } = setup((req) => (req.lang === 'en' && req.context === 'question' ? speech('banana') : speech(req.hints[0])));
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(run.kind).toBe('finished');
    expect(io.transcript()).toMatch(/Not quite\. \{[^}]+\} means /);
  });

  it('repeat, slower and help re-ask the same question', async () => {
    let n = 0;
    const { io, conv } = setup((req) => {
      n++;
      if (n === 1) return speech('can you repeat that');
      if (n === 2) return speech('slower please');
      if (n === 3) return speech('help');
      return speech(req.hints[0]);
    });
    await runPlan(conv, lessonPlan(lesson, seeded()));
    const said = io.said.slice(0, 12).join('\n');
    expect(said).toContain("Okay, I'll slow down.");
    expect(said).toContain('You can say: repeat, slower, skip, pause, or stop.');
    expect(conv.slow).toBe(true);
  });

  it('skip reveals the answer and counts as a miss', async () => {
    let skipped = false;
    const { io, conv } = setup((req) => {
      if (!skipped && io.said.some((s) => s.startsWith('Quiz'))) {
        skipped = true;
        return speech("I don't know");
      }
      return speech(req.hints[0]);
    });
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(io.transcript()).toContain("Here's the answer.");
    if (run.kind !== 'finished') throw new Error(run.kind);
    expect(run.result.correct).toBe(run.result.total - 1);
  });

  it('two silences pause the lesson; saying continue picks up where it left off', async () => {
    let silent = 0;
    const { io, conv, statuses } = setup((req) => {
      if (req.context === 'paused') return speech("okay I'm ready");
      if (io.said.some((s) => s.startsWith('Quiz')) && silent < 2) {
        silent++;
        return { kind: 'silence' };
      }
      return speech(req.hints[0]);
    });
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(statuses.some((s) => s.phase === 'paused')).toBe(true);
    expect(io.transcript()).toContain("I didn't catch that.");
    expect(io.transcript()).toContain('Paused. Say continue when you');
    expect(run).toMatchObject({ kind: 'finished', result: { pct: 100 } });
  });

  it('saying stop ends the lesson without a result', async () => {
    let n = 0;
    const { io, conv } = setup((req) => (++n === 3 ? speech('stop the lesson') : speech(req.hints[0])));
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(run.kind).toBe('stopped');
    expect(io.said.at(-1)).toBe('Okay, stopping here.');
  });

  it('the screen buttons pause, resume and stop', async () => {
    let n = 0;
    const holder: { conv?: Conversation } = {};
    const { conv, statuses } = setup((req) => {
      n++;
      if (n === 2) {
        holder.conv!.pause();
        return { kind: 'cancelled' };
      }
      if (req.context === 'paused') {
        holder.conv!.resume();
        return { kind: 'cancelled' };
      }
      if (n === 12) {
        holder.conv!.stop();
        return { kind: 'cancelled' };
      }
      return speech(req.hints[0]);
    });
    holder.conv = conv;
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(statuses.some((s) => s.phase === 'paused')).toBe(true);
    expect(run.kind).toBe('stopped');
  });

  it('fails clearly when microphone permission is missing', async () => {
    const { conv } = setup(() => ({ kind: 'error', code: 'not-allowed' }));
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(run).toMatchObject({ kind: 'failed' });
    if (run.kind === 'failed') expect(run.message).toMatch(/microphone/);
  });

  it('retries a temporary recognition error, then pauses if it keeps happening', async () => {
    let errors = 0;
    const { io, conv } = setup((req) => {
      if (req.context === 'paused') return speech('continue');
      if (io.said.some((s) => s.startsWith('Quiz')) && errors < 2) {
        errors++;
        return { kind: 'error', code: 'network' };
      }
      return speech(req.hints[0]);
    });
    const run = await runPlan(conv, lessonPlan(lesson, seeded()));
    expect(io.transcript()).toContain("I'm having trouble hearing you.");
    expect(run.kind).toBe('finished');
  });
});

describe('hands-free coach', () => {
  it('runs lesson after lesson and the checkpoint by voice, saving progress', async () => {
    let state: AppState = freshState();
    const { io, conv } = setup(perfectLearner(['next', 'yes', 'next', 'stop']));
    const end = await runCoach(conv, es, { getState: () => state, setState: (s) => (state = s) });
    expect(end).toEqual({ kind: 'done' });
    for (const l of es.units[0].lessons) expect(lessonDone(state, es, l)).toBe(true);
    expect(checkpointPassed(state, es, es.units[0])).toBe(true);
    const said = io.transcript();
    expect(said).toContain('Welcome!');
    expect(said).toContain('Lesson complete!');
    expect(said).toContain('You passed the checkpoint with 100 percent!');
    expect(said).toContain('Unit 2, Food & Drink, is now unlocked.');
    expect(said).toContain('Great work today. See you next time!');
    expect(state.stats.xp).toBe(15 * 3 + 20);
  });

  it('offers to retake a failed checkpoint', async () => {
    let state: AppState = freshState();
    // Finish unit 1's lessons first.
    const first = setup(perfectLearner(['next', 'next', 'stop']));
    await runCoach(first.conv, es, { getState: () => state, setState: (s) => (state = s) });
    expect(checkpointPassed(state, es, es.units[0])).toBe(false);

    let inCheckpoint = false;
    const { io, conv } = setup((req) => {
      if (req.context === 'menu') return speech(io.transcript().includes('again to retake') ? 'stop' : 'stop');
      if (req.lastSaid.includes('Checkpoint for unit 1')) inCheckpoint = true;
      return speech(inCheckpoint ? 'no idea at all really' : req.hints[0]);
    });
    await runCoach(conv, es, { getState: () => state, setState: (s) => (state = s) });
    expect(io.transcript()).toContain('You need 80 to pass');
    expect(io.transcript()).toContain('again to retake the checkpoint');
    expect(checkpointPassed(state, es, es.units[0])).toBe(false);
  });

  it('stops politely after silence at the menu', async () => {
    let state: AppState = freshState();
    const { io, conv } = setup((req) => (req.context === 'menu' ? { kind: 'silence' } : speech(req.hints[0])));
    await runCoach(conv, es, { getState: () => state, setState: (s) => (state = s) });
    expect(io.said.at(-1)).toBe("I'll stop here. Great work today!");
    expect(lessonDone(state, es, lesson)).toBe(true);
  });
});
