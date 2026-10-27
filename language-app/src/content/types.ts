export type RawWord = [target: string, english: string, alternatives?: string[]];
export type RawSentence = [target: string, english: string];

export interface RawLesson {
  title: string;
  /** Spoken in English; phrases in {braces} are spoken in the target language. */
  tip: string;
  words: RawWord[];
  sentences: RawSentence[];
}

export interface RawUnit {
  title: string;
  description: string;
  lessons: RawLesson[];
}

export interface RawCourse {
  id: string;
  name: string;
  native: string;
  flag: string;
  /** BCP-47 locale used for speech, e.g. "es-ES". */
  voice: string;
  units: RawUnit[];
}

export interface Item {
  id: string;
  /** Target-language text. */
  t: string;
  /** English meaning. */
  e: string;
  alt: string[];
  kind: 'word' | 'sentence';
}

export interface Lesson {
  key: string;
  unit: number;
  index: number;
  title: string;
  tip: string;
  items: Item[];
  sentences: Item[];
}

export interface Unit {
  index: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  native: string;
  flag: string;
  voice: string;
  units: Unit[];
}
