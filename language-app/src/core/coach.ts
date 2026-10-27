// The coach chains sessions together by voice: it picks what to do, runs it,
// saves the result, reports back and asks what's next, so the learner never
// needs to look at the screen between lessons.
import type { Course } from '../content';
import { COMMAND_HINTS, HELP_TEXT, menuCommands } from './commands';
import { checkpointPlan, lessonPlan, reviewPlan, type Plan } from './plan';
import {
  applyResult,
  checkpointPassed,
  checkpointUnlocked,
  currentStreak,
  describe,
  dueWords,
  learnedWords,
  recommend,
  type Activity,
  type AppState,
  type Outcome,
  type SessionResult,
} from './progress';
import { Conversation, Failure, runPlan } from './session';

export interface CoachDeps {
  getState(): AppState;
  setState(s: AppState): void;
}

export type CoachEnd = { kind: 'done' } | { kind: 'failed'; message: string };

export function planFor(activity: Activity, conv: Conversation): Plan {
  switch (activity.kind) {
    case 'lesson':
      return lessonPlan(activity.lesson, conv.random);
    case 'checkpoint':
      return checkpointPlan(activity.unit, conv.random);
    case 'review':
      return reviewPlan(activity.words, conv.random);
  }
}

export function isNewLearner(state: AppState, course: Course) {
  const p = state.courses[course.id];
  return !p || Object.keys(p.lessons).length === 0;
}

export const WELCOME =
  "Welcome! I'll teach you by voice, so you don't need to look at your phone. " +
  "When you hear the tone, answer out loud. You can say repeat, slower, skip, pause or stop at any time.";

export function summary(activity: Activity, r: SessionResult, o: Outcome, state: AppState): string {
  const parts: string[] = [];
  const score = `You got ${r.correct} out of ${r.total}.`;
  if (activity.kind === 'lesson') parts.push(`Lesson complete! ${score}`);
  else if (activity.kind === 'review') parts.push(`Review done. ${score}`);
  else if (o.passed) parts.push(`You passed the checkpoint with ${r.pct} percent!`);
  else parts.push(`You scored ${r.pct} percent. You need 80 to pass, so let's practise a bit more.`);
  if (o.courseFinished) parts.push(`That's the whole course. Amazing work!`);
  else if (o.unlockedUnit) parts.push(`Unit ${o.unlockedUnit.index + 1}, ${o.unlockedUnit.title}, is now unlocked.`);
  parts.push(`Plus ${o.xp} XP.`);
  if (o.reachedGoal) parts.push("You've reached today's goal.");
  const streak = currentStreak(state.stats);
  if (streak > 1) parts.push(`That's a ${streak} day streak.`);
  return parts.join(' ');
}

/** The spoken menu after a session, and the activity each command leads to. */
export function menuFor(state: AppState, course: Course, last: Activity, o: Outcome | null) {
  const next = recommend(state, course);
  const failedCheckpoint = last.kind === 'checkpoint' && o && !o.passed;
  const due = dueWords(state, course);
  const options: string[] = [`Say next for ${describe(next)}`];
  if (failedCheckpoint) options.push('again to retake the checkpoint');
  else if (last.kind === 'lesson') options.push('again to repeat this lesson');
  if (due.length && next.kind !== 'review') options.push(`review to practise ${due.length} word${due.length === 1 ? '' : 's'}`);
  const text = `${options.join(', ')}, or stop to finish.`;
  return { text, next };
}

/** Runs sessions until the learner says stop. */
export async function runCoach(conv: Conversation, course: Course, deps: CoachDeps): Promise<CoachEnd> {
  let state = deps.getState();
  let activity: Activity = recommend(state, course);

  const opening = isNewLearner(state, course)
    ? `${WELCOME} Let's begin with ${describe(activity)}.`
    : `Welcome back. Let's start ${describe(activity)}.`;
  if (!(await conv.withPause(() => conv.say(opening)))) return { kind: 'done' };

  for (;;) {
    const run = await runPlan(conv, planFor(activity, conv));
    if (run.kind === 'failed') return { kind: 'failed', message: run.message };
    if (run.kind === 'stopped') return { kind: 'done' };

    const outcome = applyResult(deps.getState(), course, activity, run.result);
    state = outcome.state;
    deps.setState(state);

    let chosen: { value: Activity | null } | null;
    try {
      chosen = await conv.withPause(async () => {
        await conv.say(summary(activity, run.result, outcome, state));
        return chooseNext(conv, course, state, activity, outcome);
      });
    } catch (e) {
      if (e instanceof Failure) return { kind: 'failed', message: e.message };
      throw e;
    }
    if (!chosen || !chosen.value) return { kind: 'done' };
    activity = chosen.value;
  }
}

async function chooseNext(
  conv: Conversation,
  course: Course,
  state: AppState,
  last: Activity,
  outcome: Outcome | null,
): Promise<Activity | null> {
  const menu = menuFor(state, course, last, outcome);
  await conv.say(menu.text);
  let silences = 0;
  for (;;) {
    const h = await conv.hear('en', COMMAND_HINTS.menu);
    conv.failIfFatal(h);
    if (h.kind === 'silence') {
      if (++silences >= 2) {
        await conv.say('I\'ll stop here. Great work today!');
        return null;
      }
      await conv.say(menu.text);
      continue;
    }
    if (h.kind !== 'speech') continue;
    const cmd = menuCommands.exact(h.transcripts) ?? menuCommands.loose(h.transcripts);
    switch (cmd) {
      case 'next':
        return menu.next;
      case 'again':
        return last;
      case 'review': {
        const due = dueWords(state, course);
        const words = due.length ? due : learnedWords(state, course).sort((a, b) => a.box - b.box).slice(0, 10);
        if (!words.length) {
          await conv.say('There are no words to review yet.');
          break;
        }
        return { kind: 'review', words };
      }
      case 'checkpoint': {
        const unit = course.units.find((u) => checkpointUnlocked(state, course, u) && !checkpointPassed(state, course, u))
          ?? [...course.units].reverse().find((u) => checkpointUnlocked(state, course, u));
        if (!unit) {
          await conv.say("The checkpoint unlocks when you've finished every lesson in the unit.");
          break;
        }
        return { kind: 'checkpoint', unit };
      }
      case 'stop':
        await conv.say('Great work today. See you next time!');
        return null;
      case 'help':
        await conv.say(HELP_TEXT.menu);
        break;
      case 'repeat':
        break;
      case null:
        await conv.say("Sorry, I didn't get that.");
        break;
    }
    await conv.say(menu.text);
  }
}

