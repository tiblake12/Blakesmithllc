// Voice commands, in English and in each target language.
import { normalize, stripAccents } from './text';

export type QuestionCommand = 'repeat' | 'slower' | 'skip' | 'pause' | 'stop' | 'help';
export type MenuCommand = 'next' | 'again' | 'review' | 'checkpoint' | 'stop' | 'help' | 'repeat';
export type PauseCommand = 'resume' | 'stop' | 'help';

type PhraseTable<C extends string> = Record<C, string[]>;

// Phrases must never be a lesson word in any course: during a question an exact
// match on a phrase wins over grading. A test enforces this.
const QUESTION: PhraseTable<QuestionCommand> = {
  repeat: [
    'repeat', 'repeat that', 'say that again', 'say it again', 'again', 'one more time', 'come again', 'what was that',
    'repite', 'repítelo', 'otra vez', 'répète', 'répétez', 'encore une fois', 'wiederholen', 'wiederhole', 'noch einmal', 'nochmal',
  ],
  slower: [
    'slower', 'slow down', 'more slowly', 'too fast', 'speak slowly', 'slowly',
    'más despacio', 'despacio', 'más lento', 'plus lentement', 'lentement', 'moins vite', 'langsamer', 'langsam',
  ],
  skip: [
    'skip', 'skip it', 'skip this', 'i do not know', "i don't know", 'pass', 'no idea', 'tell me', 'give up', 'i give up', 'next question',
    'no sé', 'no lo sé', 'paso', 'je ne sais pas', 'je sais pas', 'ich weiß nicht', 'weiß nicht', 'keine ahnung',
  ],
  pause: ['pause', 'wait', 'hold on', 'take a break', 'pausa', 'espera', 'attends', 'warte'],
  stop: [
    'stop', 'stop the lesson', 'stop lesson', 'quit', 'exit', 'end lesson', 'end the lesson', 'i am done', "i'm done", 'finish',
    'parar', 'terminar', 'arrête', 'arrêter', 'stopp', 'aufhören', 'beenden',
  ],
  help: ['help', 'what can i say', 'commands', 'options', 'ayuda', 'aide', 'hilfe'],
};

const MENU: PhraseTable<MenuCommand> = {
  next: [
    'next', 'next lesson', 'continue', 'yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'go', 'go on', 'start', 'keep going', "let's go", 'next one',
    'sí', 'siguiente', 'oui', 'suivant', 'ja', 'weiter',
  ],
  again: ['again', 'do it again', 'redo', 'one more time', 'same again', 'repeat the lesson', 'try again', 'retry', 'retake'],
  review: ['review', 'practice', 'practise', 'review words', 'revise'],
  checkpoint: ['checkpoint', 'test', 'take the test', 'quiz', 'the checkpoint'],
  stop: ['stop', 'no', 'no thanks', 'done', "i'm done", 'i am done', 'quit', 'exit', 'finish', "that's all", 'that is all', 'no', 'non', 'nein', 'goodbye', 'bye'],
  help: ['help', 'what can i say', 'options', 'commands'],
  repeat: ['repeat', 'what', 'say that again', 'pardon', 'sorry', 'what did you say'],
};

const PAUSED: PhraseTable<PauseCommand> = {
  resume: [
    'resume', 'continue', 'go on', 'go', 'ready', "i'm ready", 'i am ready', 'start', "let's go", 'keep going', 'okay', 'ok', 'yes', 'back',
    'unpause', 'sigue', 'continúa', 'listo', 'lista', 'continue', 'on continue', 'weiter', 'los',
  ],
  stop: ['stop', 'quit', 'exit', 'end lesson', 'end the lesson', "i'm done", 'i am done', 'finish', 'goodbye'],
  help: ['help', 'what can i say'],
};

function key(s: string) {
  return stripAccents(normalize(s));
}

function matcher<C extends string>(table: PhraseTable<C>) {
  const entries = (Object.keys(table) as C[]).flatMap((cmd) => table[cmd].map((p) => [key(p), cmd] as const));
  return {
    exact(transcripts: string[]): C | null {
      for (const tr of transcripts) {
        const k = key(tr);
        const hit = entries.find(([p]) => p === k);
        if (hit) return hit[1];
      }
      return null;
    },
    /** Command phrase inside a short utterance: "can you repeat that please". */
    loose(transcripts: string[]): C | null {
      for (const tr of transcripts) {
        const k = key(tr);
        if (!k || k.split(' ').length > 7) continue;
        // Longest phrase first so "stop the lesson" beats "stop".
        const hit = [...entries]
          .sort((a, b) => b[0].length - a[0].length)
          .find(([p]) => ` ${k} `.includes(` ${p} `));
        if (hit) return hit[1];
      }
      return null;
    },
    phrases: entries.map(([p]) => p),
  };
}

export const questionCommands = matcher(QUESTION);
export const menuCommands = matcher(MENU);
export const pauseCommands = matcher(PAUSED);

/** Command phrases as typed, for recogniser hints and the help screen. */
export const COMMAND_HINTS = {
  question: Object.values(QUESTION).flat() as string[],
  menu: Object.values(MENU).flat() as string[],
  paused: Object.values(PAUSED).flat() as string[],
};

export const HELP_TEXT = {
  question:
    'You can say: repeat, slower, skip, pause, or stop. Say skip or I don\'t know to hear the answer.',
  menu: 'You can say: next, again, review, checkpoint, or stop.',
  paused: 'Say continue when you\'re ready, or stop to end the lesson.',
};
