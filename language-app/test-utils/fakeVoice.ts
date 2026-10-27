// A scripted stand-in for the phone's speaker and microphone.
import { COMMAND_HINTS } from '../src/core/commands';
import type { Cue, Heard, VoiceIO } from '../src/core/session';
import type { Segment } from '../src/core/text';

export interface ListenRequest {
  lang: 'en' | 'target';
  hints: string[];
  /** Everything said since the last listen, as plain text. */
  lastSaid: string;
  context: 'question' | 'menu' | 'paused';
}

export type Learner = (req: ListenRequest, io: FakeVoice) => Heard;

export class FakeVoice implements VoiceIO {
  said: string[] = [];
  cues: Cue[] = [];
  listens = 0;
  private sinceListen: string[] = [];
  onSpeak?: (text: string) => void;
  onListen?: (req: ListenRequest) => void;

  constructor(public learner: Learner, public maxListens = 2000) {}

  async speak(segments: Segment[]) {
    const text = segments.map((s) => (s.lang === 'target' ? `{${s.text}}` : s.text)).join(' ');
    this.said.push(text);
    this.sinceListen.push(text);
    this.onSpeak?.(text);
  }

  async listen(opts: { lang: 'en' | 'target'; hints: string[] }): Promise<Heard> {
    if (++this.listens > this.maxListens) throw new Error('too many listens — engine is looping');
    const context = opts.hints === COMMAND_HINTS.menu ? 'menu' : opts.hints === COMMAND_HINTS.paused ? 'paused' : 'question';
    const req = { ...opts, lastSaid: this.sinceListen.join(' '), context } as ListenRequest;
    this.sinceListen = [];
    this.onListen?.(req);
    return this.learner(req, this);
  }

  cancel() {}
  cue(kind: Cue) {
    this.cues.push(kind);
  }
  async sleep() {}

  transcript() {
    return this.said.join('\n');
  }
}

export const speech = (...transcripts: string[]): Heard => ({ kind: 'speech', transcripts });

/** Answers every question correctly (the expected answer is the first hint). */
export function perfectLearner(menuAnswers: string[] = ['stop']): Learner {
  let m = 0;
  return (req) => {
    if (req.context === 'menu') return speech(menuAnswers[Math.min(m++, menuAnswers.length - 1)]);
    if (req.context === 'paused') return speech('continue');
    return speech(req.hints[0]);
  };
}
