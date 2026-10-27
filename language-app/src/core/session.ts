// The voice engine: speaks, listens, grades and reacts to commands.
// It talks to the device only through VoiceIO, so tests can drive it with a fake.
import type { Course, Item } from '../content';
import { COMMAND_HINTS, HELP_TEXT, pauseCommands, questionCommands } from './commands';
import { promptFor, scoredCount, spokenEnglish, type Plan, type Question, type Random, type Step } from './plan';
import type { SessionResult } from './progress';
import { englishAnswers, gradeEnglish, gradeTarget, parseMarkup, plainText, t, type Grade, type Segment } from './text';

export type Heard =
  | { kind: 'speech'; transcripts: string[] }
  | { kind: 'silence' }
  | { kind: 'cancelled' }
  | { kind: 'error'; code: string; message?: string };

export type Cue = 'listening' | 'correct' | 'wrong' | 'done';

export interface VoiceIO {
  /** Speak the segments in order. Resolves when finished or cancelled. */
  speak(segments: Segment[], opts: { slow: boolean }): Promise<void>;
  /** Listen for one utterance. `lang` picks English or the course language. */
  listen(opts: { lang: 'en' | 'target'; hints: string[] }): Promise<Heard>;
  /** Stop speaking/listening immediately; pending promises resolve. */
  cancel(): void;
  /** A short sound or vibration so the learner knows what happened without looking. */
  cue(kind: Cue): Promise<void> | void;
  sleep(ms: number): Promise<void>;
}

export type Phase = 'speaking' | 'listening' | 'paused' | 'idle';

export interface Status {
  phase: Phase;
  caption: string;
  heard?: string;
  title?: string;
  progress?: { done: number; total: number };
}

/** Errors that retrying won't fix. */
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'language-not-supported']);

export const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'I need permission to use the microphone and speech recognition. You can turn it on in your phone settings.',
  'service-not-allowed': 'Speech recognition is turned off on this phone. You can turn it on in your phone settings.',
  'language-not-supported': "This phone can't recognise speech in this language yet. Try downloading the language in your phone's speech settings.",
};

export class Interrupt extends Error {
  constructor(public reason: 'pause' | 'stop') {
    super(reason);
  }
}

export class Failure extends Error {}

const PAUSE_LISTEN_LIMIT = 30; // roughly 3–4 minutes of silence while paused

/**
 * One spoken conversation with the learner. Owns the pause/stop state, so
 * screen buttons and voice commands behave the same way.
 */
export class Conversation {
  slow: boolean;
  private stopFlag = false;
  private pauseFlag = false;
  private resumeFlag = false;
  private status: Status = { phase: 'idle', caption: '' };

  constructor(
    readonly course: Course,
    readonly io: VoiceIO,
    private onStatus: (s: Status) => void,
    opts: { slow?: boolean; random?: Random } = {},
  ) {
    this.slow = !!opts.slow;
    this.random = opts.random ?? Math.random;
  }

  readonly random: Random;

  // ----- Controls for on-screen buttons -----

  stop() {
    this.stopFlag = true;
    this.io.cancel();
  }

  pause() {
    if (this.status.phase === 'paused') return;
    this.pauseFlag = true;
    this.io.cancel();
  }

  resume() {
    this.resumeFlag = true;
    this.io.cancel();
  }

  get stopped() {
    return this.stopFlag;
  }

  // ----- Status -----

  setStatus(patch: Partial<Status>) {
    this.status = { ...this.status, ...patch };
    this.onStatus(this.status);
  }

  private check() {
    if (this.stopFlag) throw new Interrupt('stop');
    if (this.pauseFlag) {
      this.pauseFlag = false;
      throw new Interrupt('pause');
    }
  }

  // ----- Speaking and listening -----

  async say(text: string, opts: { slow?: boolean } = {}) {
    this.check();
    this.setStatus({ phase: 'speaking', caption: plainText(text) });
    await this.io.speak(parseMarkup(text), { slow: opts.slow ?? this.slow });
    this.check();
  }

  async hear(lang: 'en' | 'target', hints: string[]): Promise<Heard> {
    this.check();
    this.setStatus({ phase: 'listening', heard: undefined });
    await this.io.cue('listening');
    const h = await this.io.listen({ lang, hints });
    this.check();
    if (h.kind === 'speech') this.setStatus({ heard: h.transcripts[0] });
    return h;
  }

  /** Throws Failure for errors that need the learner to change a setting. */
  failIfFatal(h: Heard) {
    if (h.kind === 'error' && FATAL.has(h.code)) throw new Failure(ERROR_MESSAGES[h.code] ?? 'Speech recognition is unavailable.');
  }

  /**
   * Waits, listening for "continue" or "stop". Returns 'resume' or 'stop'.
   * Gives up (and stops) after a few minutes of silence to save battery.
   */
  async pausedLoop(announce = true): Promise<'resume' | 'stop'> {
    this.pauseFlag = false;
    this.resumeFlag = false;
    const caption = 'Paused. Say "continue" when you\'re ready.';
    this.setStatus({ phase: 'paused', caption, heard: undefined });
    if (announce) await this.speakQuietly(caption.replace(/"/g, ''));
    for (let i = 0; i < PAUSE_LISTEN_LIMIT; i++) {
      if (this.stopFlag) return 'stop';
      if (this.resumeFlag) return this.resumed();
      this.setStatus({ phase: 'paused', caption });
      const h = await this.io.listen({ lang: 'en', hints: COMMAND_HINTS.paused });
      if (this.stopFlag) return 'stop';
      if (this.resumeFlag) return this.resumed();
      this.pauseFlag = false;
      if (h.kind === 'speech') {
        const cmd = pauseCommands.exact(h.transcripts) ?? pauseCommands.loose(h.transcripts);
        if (cmd === 'resume') return this.resumed();
        if (cmd === 'stop') return 'stop';
        if (cmd === 'help') await this.speakQuietly(HELP_TEXT.paused);
      } else if (h.kind === 'error') {
        this.failIfFatal(h);
        await this.io.sleep(1500);
      }
    }
    await this.speakQuietly("I'll stop here for now. Tap start when you want to carry on.");
    return 'stop';
  }

  private resumed(): 'resume' {
    this.resumeFlag = false;
    this.pauseFlag = false;
    return 'resume';
  }

  /** Speak while paused: ignores the pause flag but still honours stop. */
  private async speakQuietly(text: string) {
    if (this.stopFlag) return;
    this.setStatus({ caption: plainText(text) });
    await this.io.speak(parseMarkup(text), { slow: false });
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  /**
   * Runs `fn`, handling pause by waiting and then running `fn` again from the
   * start. Returns null if the learner stopped.
   */
  async withPause<T>(fn: () => Promise<T>): Promise<{ value: T } | null> {
    for (;;) {
      try {
        return { value: await fn() };
      } catch (e) {
        if (!(e instanceof Interrupt)) throw e;
        if (e.reason === 'stop') return null;
        if ((await this.pausedLoop()) === 'stop') return null;
      }
    }
  }
}

// ---------- Running a plan ----------

export type RunResult =
  | { kind: 'finished'; result: SessionResult }
  | { kind: 'stopped' }
  | { kind: 'failed'; message: string };

const MAX_RETRIES = 2; // a missed lesson question comes back at most twice

export async function runPlan(conv: Conversation, plan: Plan): Promise<RunResult> {
  const queue: Step[] = plan.steps.slice();
  const total = scoredCount(plan);
  const firstTry = new Map<Question, boolean>();
  const retries = new Map<Question, number>();
  const itemResults: Record<string, boolean> = {};
  const missed = new Map<string, Item>();
  conv.setStatus({ title: plan.title, progress: { done: 0, total } });

  try {
    while (queue.length) {
      const step = queue[0];
      const ran = await conv.withPause(() => runStep(conv, step));
      if (!ran) return { kind: 'stopped' };
      const correct = ran.value;
      queue.shift();
      if (step.kind !== 'ask' || !step.q.scored || correct === null) continue;
      const q = step.q;
      if (!firstTry.has(q)) {
        firstTry.set(q, correct);
        if (q.item.kind === 'word') itemResults[q.item.id] = correct && itemResults[q.item.id] !== false;
        if (!correct) missed.set(q.item.id, q.item);
        conv.setStatus({ progress: { done: firstTry.size, total } });
      }
      const n = retries.get(q) ?? 0;
      if (!correct && plan.retryMistakes && n < MAX_RETRIES) {
        retries.set(q, n + 1);
        queue.push({ kind: 'say', text: "Let's try one from earlier again." }, step);
      }
    }
  } catch (e) {
    if (e instanceof Failure) {
      conv.setStatus({ phase: 'idle', caption: e.message });
      return { kind: 'failed', message: e.message };
    }
    throw e;
  }

  const correct = [...firstTry.values()].filter(Boolean).length;
  conv.io.cue('done');
  return {
    kind: 'finished',
    result: {
      total,
      correct,
      pct: total ? Math.round((correct / total) * 100) : 100,
      itemResults,
      missed: [...missed.values()],
    },
  };
}

/** Returns true/false for an answered ask step, null for anything else. */
async function runStep(conv: Conversation, step: Step): Promise<boolean | null> {
  switch (step.kind) {
    case 'say':
      await conv.say(step.text);
      return null;
    case 'teach':
      await teach(conv, step.item);
      return null;
    case 'ask':
      return askQuestion(conv, step.q);
  }
}

function targetHints(item: Item) {
  return [item.t, ...item.alt, ...COMMAND_HINTS.question];
}

/** Handles a command shared by teaching and questions. Returns true if it was handled here. */
async function sharedCommand(conv: Conversation, cmd: string, replay: () => Promise<void>): Promise<boolean> {
  switch (cmd) {
    case 'repeat':
      await replay();
      return true;
    case 'slower':
      conv.slow = true;
      await conv.say("Okay, I'll slow down.");
      await replay();
      return true;
    case 'help':
      await conv.say(HELP_TEXT.question);
      await replay();
      return true;
    case 'pause':
      throw new Interrupt('pause');
    case 'stop':
      await conv.say('Okay, stopping here.');
      throw new Interrupt('stop');
  }
  return false;
}

/** "The word for hello is: hola. hola. Your turn." Then listens, up to two tries. */
async function teach(conv: Conversation, item: Item) {
  const word = t(item.t);
  const intro =
    item.kind === 'sentence' ? `To say: ${item.e}. You say: ${word}.` : `The word for ${spokenEnglish(item.e)} is: ${word}.`;
  await conv.say(intro);
  await conv.say(word, { slow: true });
  await conv.say('Your turn.');
  const replay = async () => {
    await conv.say(word, { slow: true });
    await conv.say('Your turn.');
  };
  let tries = 0;
  let silences = 0;
  while (tries < 2) {
    conv.setStatus({ caption: `Your turn. Say: ${item.t}` });
    const h = await conv.hear('target', targetHints(item));
    conv.failIfFatal(h);
    if (h.kind === 'silence') {
      if (++silences >= 2) throw new Interrupt('pause');
      await conv.say(`Say: ${word}`, { slow: true });
      continue;
    }
    if (h.kind !== 'speech') {
      if (h.kind === 'error') await conv.io.sleep(800);
      if (++tries >= 2) break;
      continue;
    }
    let cmd = questionCommands.exact(h.transcripts);
    const g = cmd ? null : gradeTarget(h.transcripts, [item.t, ...item.alt], conv.course.voice);
    if (g && g.verdict === 'wrong') cmd = questionCommands.loose(h.transcripts);
    if (cmd === 'skip') return;
    if (cmd && (await sharedCommand(conv, cmd, replay))) continue;
    if (!g) continue;
    if (g.verdict === 'correct') {
      conv.io.cue('correct');
      await conv.say(conv.pick(['Good.', 'Nice.', 'Perfect.', 'Great.']));
      return;
    }
    tries++;
    if (tries < 2) await conv.say(g.verdict === 'close' ? `Close. Once more: ${word}` : `Listen again: ${word}`, { slow: true });
  }
  await conv.say("Good effort. Let's keep going.");
}

/** Asks one question. Returns whether it was answered correctly. */
async function askQuestion(conv: Conversation, q: Question): Promise<boolean> {
  const prompt = promptFor(q);
  const english = q.type === 'say-meaning';
  const accepted = [q.item.t, ...q.item.alt];
  const hints = english ? [...englishAnswers(q.item.e), ...COMMAND_HINTS.question] : targetHints(q.item);
  await conv.say(prompt);
  let silences = 0;
  let errors = 0;
  for (;;) {
    const h = await conv.hear(english ? 'en' : 'target', hints);
    conv.failIfFatal(h);
    if (h.kind === 'cancelled') continue;
    if (h.kind === 'silence') {
      if (++silences >= 2) throw new Interrupt('pause');
      await conv.say(`I didn't catch that. ${prompt}`);
      continue;
    }
    if (h.kind === 'error') {
      if (++errors >= 2) {
        await conv.say("I'm having trouble hearing you.");
        throw new Interrupt('pause');
      }
      await conv.io.sleep(800);
      continue;
    }
    let cmd = questionCommands.exact(h.transcripts);
    let grade: Grade | null = null;
    if (!cmd) {
      grade = english ? gradeEnglish(h.transcripts, q.item.e) : gradeTarget(h.transcripts, accepted, conv.course.voice);
      if (grade.verdict === 'wrong') cmd = questionCommands.loose(h.transcripts);
    }
    if (cmd === 'skip') {
      await reveal(conv, q, "Here's the answer.");
      return false;
    }
    if (cmd && (await sharedCommand(conv, cmd, () => conv.say(prompt)))) continue;
    if (grade && grade.verdict !== 'wrong') {
      conv.io.cue('correct');
      if (grade.verdict === 'correct') await conv.say(conv.pick(['Correct!', 'Yes!', "That's right.", 'Great.']));
      else await conv.say(english ? 'Yes, close enough.' : `Close enough. Listen: ${t(q.item.t)}`);
      return true;
    }
    await reveal(conv, q, 'Not quite.');
    return false;
  }
}

/** Gives the answer, then has the learner say it once (unscored). */
async function reveal(conv: Conversation, q: Question, lead: string) {
  conv.io.cue('wrong');
  const word = t(q.item.t);
  if (q.type === 'say-meaning') {
    await conv.say(`${lead} ${word} means ${spokenEnglish(q.item.e)}.`);
    return;
  }
  await conv.say(`${lead} It's: ${word}.`);
  await conv.say(`Say it: ${word}`, { slow: true });
  const h = await conv.hear('target', targetHints(q.item));
  conv.failIfFatal(h);
  if (h.kind !== 'speech') return;
  const cmd = questionCommands.exact(h.transcripts);
  if (cmd === 'pause') throw new Interrupt('pause');
  if (cmd === 'stop') {
    await conv.say('Okay, stopping here.');
    throw new Interrupt('stop');
  }
  if (gradeTarget(h.transcripts, [q.item.t, ...q.item.alt], conv.course.voice).verdict !== 'wrong') {
    await conv.say('Good.');
  }
}
