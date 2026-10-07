// Run with: node --test language-app/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../js/core.js');

function loadCourses() {
  const window = {};
  const dir = path.join(__dirname, '../js/courses');
  for (const f of fs.readdirSync(dir)) vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { window });
  return window.COURSES.map((c) => ({
    ...c,
    units: c.units.map((u) => ({
      ...u,
      lessons: u.lessons.map((l) => ({
        ...l,
        items: l.words.map(([t, e, alt]) => ({ id: t, t, e, alt: alt || [], kind: 'word' })),
        sentences: l.sentences.map(([t, e]) => ({ id: t, t, e, alt: [], kind: 'sentence' })),
      })),
    })),
  }));
}

test('checkAnswer ignores case, punctuation and spacing', () => {
  assert.ok(C.checkAnswer('  Hola!! ', 'hola').correct);
  assert.ok(C.checkAnswer('que tal', '¿qué tal?').correct);
  assert.ok(C.checkAnswer('s’il vous plaît', "s'il vous plaît").correct);
  assert.ok(!C.checkAnswer('adios amigo', 'adiós').correct);
  assert.ok(!C.checkAnswer('', 'hola').correct);
});

test('checkAnswer accepts missing accents but flags them', () => {
  const r = C.checkAnswer('adios', 'adiós');
  assert.ok(r.correct && r.accentSlip);
  assert.strictEqual(r.expected, 'adiós');
  assert.ok(C.checkAnswer('gross', 'groß').accentSlip);
  assert.ok(!C.checkAnswer('adiós', 'adiós').accentSlip);
});

test('checkAnswer accepts alternatives', () => {
  assert.ok(C.checkAnswer('el jugo', ['el zumo', 'el jugo']).correct);
});

test('spaced repetition moves words between boxes', () => {
  let e = C.srsUpdate(undefined, true, '2026-01-01');
  assert.deepStrictEqual(e, { box: 1, due: '2026-01-02' });
  e = C.srsUpdate(e, true, '2026-01-02');
  assert.deepStrictEqual(e, { box: 2, due: '2026-01-05' });
  assert.ok(!C.isDue(e, '2026-01-04'));
  assert.ok(C.isDue(e, '2026-01-05'));
  e = C.srsUpdate(e, false, '2026-01-05');
  assert.deepStrictEqual(e, { box: 0, due: '2026-01-05' });
  for (let i = 0; i < 10; i++) e = C.srsUpdate(e, true, '2026-01-05');
  assert.strictEqual(e.box, C.BOX_INTERVALS.length - 1);
});

test('streak grows on consecutive days and resets after a gap', () => {
  let s = C.addXp({}, 10, '2026-03-01');
  assert.strictEqual(s.streak, 1);
  s = C.addXp(s, 5, '2026-03-01');
  assert.strictEqual(s.streak, 1);
  assert.strictEqual(s.daily['2026-03-01'], 15);
  s = C.addXp(s, 10, '2026-03-02');
  assert.strictEqual(s.streak, 2);
  assert.strictEqual(C.currentStreak(s, '2026-03-03'), 2);
  assert.strictEqual(C.currentStreak(s, '2026-03-04'), 0);
  s = C.addXp(s, 10, '2026-03-05');
  assert.strictEqual(s.streak, 1);
  assert.strictEqual(s.bestStreak, 2);
  assert.strictEqual(s.xp, 35);
});

test('streak survives month boundaries', () => {
  let s = C.addXp({}, 1, '2026-01-31');
  s = C.addXp(s, 1, '2026-02-01');
  assert.strictEqual(s.streak, 2);
});

const courses = loadCourses();

test('course content is well formed', () => {
  assert.ok(courses.length >= 3);
  for (const c of courses) {
    assert.ok(c.id && c.name && c.flag && c.voice, `${c.id} metadata`);
    const seen = new Set();
    for (const u of c.units) {
      assert.ok(u.title && u.description && u.lessons.length);
      for (const l of u.lessons) {
        assert.ok(l.title && l.tip, `${c.id}/${l.title} title and tip`);
        assert.ok(l.items.length >= 4, `${c.id}/${l.title} needs at least 4 words`);
        assert.ok(l.sentences.length >= 1, `${c.id}/${l.title} needs a sentence`);
        for (const w of l.items) {
          assert.ok(w.t && w.e, `${c.id}/${l.title} word`);
          assert.ok(!seen.has(w.t), `${c.id}: duplicate word ${w.t}`);
          seen.add(w.t);
        }
      }
    }
  }
});

test('every lesson and checkpoint produces valid questions', () => {
  for (const c of courses) {
    for (const u of c.units) {
      const pool = u.lessons.flatMap((l) => l.items);
      for (const l of u.lessons) {
        for (let run = 0; run < 20; run++) checkQuestions(C.lessonQuiz(l, pool), `${c.id}/${l.title}`);
      }
      for (let run = 0; run < 20; run++) {
        const qs = C.checkpointQuiz(u);
        assert.ok(qs.length >= 10, `${c.id}/${u.title} checkpoint length`);
        checkQuestions(qs, `${c.id}/${u.title} checkpoint`);
      }
    }
  }
});

function checkQuestions(qs, where) {
  for (const q of qs) {
    if (q.type === 'match') {
      assert.ok(q.pairs.length >= 3, where);
      assert.strictEqual(new Set(q.pairs.map((p) => p.e)).size, q.pairs.length, `${where}: ambiguous match`);
      continue;
    }
    if (q.options) {
      assert.strictEqual(q.options.length, 4, `${where}: ${q.type} option count`);
      assert.strictEqual(new Set(q.options).size, 4, `${where}: duplicate options`);
      assert.ok(q.options.includes(q.answer), `${where}: answer missing`);
    }
    if (q.type === 'type') assert.ok(C.checkAnswer(q.item.t, q.answer).correct, where);
    if (q.type === 'build') {
      // The right answer must be buildable from the tiles.
      const tiles = q.tiles.slice();
      for (const w of C.tokenize(q.item.t)) {
        const i = tiles.indexOf(w);
        assert.ok(i >= 0, `${where}: missing tile ${w}`);
        tiles.splice(i, 1);
      }
      assert.ok(C.checkAnswer(C.tokenize(q.item.t).join(' '), q.answer).correct, where);
    }
  }
}

test('review quiz caps its length and asks hardest words first', () => {
  const words = courses[0].units[0].lessons.flatMap((l) => l.items);
  const due = words.map((w, i) => ({ item: w, box: i % 3 }));
  const qs = C.reviewQuiz(due, words);
  assert.strictEqual(qs.length, 12);
  assert.ok(qs.every((q) => q.type === 'type' || q.type === 'mc-english'));
});
