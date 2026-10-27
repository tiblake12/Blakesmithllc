import { englishAnswers, gradeEnglish, gradeTarget, parseMarkup, plainText } from '../src/core/text';

describe('gradeTarget', () => {
  it('accepts exact answers regardless of case, punctuation and accents', () => {
    expect(gradeTarget(['Hola!'], ['hola'], 'es-ES').verdict).toBe('correct');
    expect(gradeTarget(['adios'], ['adiós'], 'es-ES').verdict).toBe('correct');
    expect(gradeTarget(['que tal'], ['¿qué tal?'], 'es-ES').verdict).toBe('correct');
    expect(gradeTarget(['gross'], ['groß'], 'de-DE').verdict).toBe('correct');
  });

  it('understands digits from the recogniser', () => {
    expect(gradeTarget(['2'], ['dos'], 'es-ES').verdict).toBe('correct');
    expect(gradeTarget(['Ich habe 2 Äpfel'], ['Ich habe zwei Äpfel'], 'de-DE').verdict).toBe('correct');
    expect(gradeTarget(['10'], ['dix'], 'fr-FR').verdict).toBe('correct');
  });

  it('allows a few extra words around the answer', () => {
    expect(gradeTarget(['hola hola'], ['hola'], 'es-ES').verdict).toBe('correct');
    expect(gradeTarget(['um el pan'], ['el pan'], 'es-ES').verdict).toBe('correct');
  });

  it('marks near misses as close, and wrong answers as wrong', () => {
    expect(gradeTarget(['buenos dias'], ['buenas días'], 'es-ES').verdict).toBe('close');
    expect(gradeTarget(['gracias'], ['adiós'], 'es-ES').verdict).toBe('wrong');
    expect(gradeTarget([''], ['hola'], 'es-ES').verdict).toBe('wrong');
  });

  it('uses the best of several recogniser alternatives', () => {
    expect(gradeTarget(['ola', 'hola'], ['hola'], 'es-ES').verdict).toBe('correct');
  });

  it('accepts alternatives', () => {
    expect(gradeTarget(['el jugo'], ['el zumo', 'el jugo'], 'es-ES').verdict).toBe('correct');
  });
});

describe('gradeEnglish', () => {
  it('ignores articles and filler', () => {
    expect(gradeEnglish(['bread'], 'the bread').verdict).toBe('correct');
    expect(gradeEnglish(['it means the bread'], 'the bread').verdict).toBe('correct');
  });
  it('accepts common synonyms and contractions', () => {
    expect(gradeEnglish(['thanks'], 'thank you').verdict).toBe('correct');
    expect(gradeEnglish(['hi'], 'hello').verdict).toBe('correct');
    expect(gradeEnglish(['sorry'], 'I’m sorry').verdict).toBe('correct');
    expect(gradeEnglish(["what's your name"], 'what is your name?').verdict).toBe('correct');
    expect(gradeEnglish(['3'], 'three').verdict).toBe('correct');
  });
  it('accepts either side of a slash', () => {
    expect(englishAnswers('also / too')).toEqual(expect.arrayContaining(['also', 'too']));
    expect(gradeEnglish(['too'], 'also / too').verdict).toBe('correct');
  });
  it('rejects wrong meanings', () => {
    expect(gradeEnglish(['goodbye'], 'hello').verdict).toBe('wrong');
  });
});

describe('speech markup', () => {
  it('splits English and target-language parts', () => {
    expect(parseMarkup('The word for hello is: {hola}.')).toEqual([
      { text: 'The word for hello is:', lang: 'en' },
      { text: 'hola', lang: 'target' },
    ]);
    expect(plainText('Say {buenos días}.')).toBe('Say buenos días.');
  });
});
