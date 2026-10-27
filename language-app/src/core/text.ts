// Text helpers: normalising speech-recognition output and grading spoken answers.

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/œ/g, 'oe');
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[¿¡?!.,;:"«»()\-–—/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Speech recognisers often write numbers as digits. Map them back to words. */
const DIGIT_WORDS: Record<string, string[]> = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
  de: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
};

function spellDigits(s: string, lang: string): string {
  const words = DIGIT_WORDS[lang.slice(0, 2)];
  if (!words) return s;
  return s.replace(/\b(10|[0-9])\b/g, (d) => words[Number(d)]);
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bwhat's\b/g, 'what is'],
  [/\bit's\b/g, 'it is'],
  [/\bhow's\b/g, 'how is'],
  [/\bthat's\b/g, 'that is'],
  [/\bdon't\b/g, 'do not'],
];

/** English phrases a learner might reasonably say for the same meaning. */
const ENGLISH_SYNONYMS: string[][] = [
  ['hello', 'hi', 'hey'],
  ['goodbye', 'bye', 'bye bye', 'good bye'],
  ['thank you', 'thanks', 'thank you very much'],
  ['i am sorry', 'sorry'],
  ['excuse me', 'pardon me', 'pardon'],
  ['how are you', 'how is it going', 'how are things'],
  ['you are welcome', 'no problem'],
  ['nice to meet you', 'pleased to meet you'],
  ['what is your name', 'what are you called'],
  ['my name is', 'i am called'],
  ['how much does it cost', 'how much is it', 'how much is that', 'how much'],
  ['delicious', 'tasty'],
  ['big', 'large', 'tall'],
  ['small', 'little'],
  ['happy', 'glad'],
  ['the bill', 'the check'],
  ['mother', 'mom', 'mum'],
  ['father', 'dad'],
  ['i would like', 'i would love', "i'd like"],
];

function englishForms(s: string): string {
  let out = normalize(s);
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out;
}

/** Drop filler a learner adds around an English meaning: "it means the bread". */
function stripEnglishFiller(s: string): string {
  return s
    .replace(/^(it means|that means|it is|that is|means|i think|um|uh)\s+/g, '')
    .replace(/^(the|a|an|to)\s+/g, '')
    .trim();
}

/** All acceptable English answers for a meaning like "also / too" or "the bread". */
export function englishAnswers(meaning: string): string[] {
  const base = meaning.split('/').map((m) => stripEnglishFiller(englishForms(m))).filter(Boolean);
  const out = new Set(base);
  for (const b of base) {
    for (const group of ENGLISH_SYNONYMS) {
      const forms = group.map((g) => stripEnglishFiller(englishForms(g)));
      if (forms.includes(b)) forms.forEach((f) => out.add(f));
    }
  }
  return [...out];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function containsPhrase(haystack: string, needle: string): boolean {
  return needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);
}

export type Verdict = 'correct' | 'close' | 'wrong';

export interface Grade {
  verdict: Verdict;
  /** What the recogniser heard (best alternative). */
  heard: string;
  score: number;
}

const CLOSE = 0.8;

function bestOf(transcripts: string[], answers: string[], prep: (s: string) => string): Grade {
  let best: Grade = { verdict: 'wrong', heard: transcripts[0] ?? '', score: 0 };
  for (const raw of transcripts) {
    const heard = prep(raw);
    if (!heard) continue;
    const words = heard.split(' ').length;
    for (const ans of answers) {
      let score = similarity(heard, ans);
      // Allow a couple of extra words around the answer ("hola hola", "it's hola").
      if (score < 1 && containsPhrase(heard, ans) && words <= ans.split(' ').length + 3) score = 1;
      if (score > best.score) best = { verdict: score === 1 ? 'correct' : score >= CLOSE ? 'close' : 'wrong', heard: raw, score };
    }
  }
  return best;
}

/** Grade an answer spoken in the target language. Accents are never penalised. */
export function gradeTarget(transcripts: string[], accepted: string[], lang: string): Grade {
  const prep = (s: string) => stripAccents(normalize(spellDigits(s, lang)));
  return bestOf(transcripts, accepted.map(prep), prep);
}

/** Grade an English meaning. */
export function gradeEnglish(transcripts: string[], meaning: string): Grade {
  const prep = (s: string) => stripEnglishFiller(englishForms(spellDigits(s, 'en')));
  return bestOf(transcripts, englishAnswers(meaning), prep);
}

// ---------- Speech markup ----------

export interface Segment {
  text: string;
  lang: 'en' | 'target';
}

/** "The word for hello is {hola}." → English and target-language segments. */
export function parseMarkup(s: string): Segment[] {
  const out: Segment[] = [];
  const re = /\{([^}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), lang: 'en' });
    out.push({ text: m[1], lang: 'target' });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), lang: 'en' });
  return out.map((x) => ({ ...x, text: x.text.trim() })).filter((x) => /[\p{L}\p{N}]/u.test(x.text));
}

/** Markup as plain text for on-screen captions. */
export function plainText(s: string): string {
  return s.replace(/[{}]/g, '');
}

/** Wrap target-language text so it is spoken with the target voice. */
export function t(s: string): string {
  return `{${s}}`;
}
