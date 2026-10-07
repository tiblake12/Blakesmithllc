// Pure logic shared by the browser app and the Node tests: answer checking,
// spaced repetition, streaks/XP and quiz generation. No DOM access here.
(function (root) {
  'use strict';

  // ---------- Answer checking ----------

  function stripAccents(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  }

  function normalize(s) {
    return String(s)
      .toLowerCase()
      .replace(/[’`]/g, "'")
      .replace(/[¿¡?!.,;:"«»()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Returns { correct, accentSlip, expected }. An answer that is right apart
  // from accents still counts, but the learner is told about it.
  function checkAnswer(input, accepted) {
    const answers = Array.isArray(accepted) ? accepted : [accepted];
    const given = normalize(input);
    if (!given) return { correct: false, accentSlip: false, expected: answers[0] };
    for (const a of answers) {
      if (normalize(a) === given) return { correct: true, accentSlip: false, expected: a };
    }
    for (const a of answers) {
      if (stripAccents(normalize(a)) === stripAccents(given)) {
        return { correct: true, accentSlip: true, expected: a };
      }
    }
    return { correct: false, accentSlip: false, expected: answers[0] };
  }

  // ---------- Dates ----------

  function dayKey(date) {
    const d = date || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function daysBetween(fromKey, toKey) {
    const a = new Date(fromKey + 'T00:00:00');
    const b = new Date(toKey + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function addDays(key, n) {
    const d = new Date(key + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return dayKey(d);
  }

  // ---------- Spaced repetition (Leitner boxes) ----------

  // Days until the next review for each box. Box 0 = "missed, review today".
  const BOX_INTERVALS = [0, 1, 3, 7, 14, 30];

  function srsUpdate(entry, wasCorrect, today) {
    const t = today || dayKey();
    const box = entry ? entry.box : 0;
    const next = wasCorrect ? Math.min(box + 1, BOX_INTERVALS.length - 1) : 0;
    return { box: next, due: addDays(t, BOX_INTERVALS[next]) };
  }

  function isDue(entry, today) {
    return !!entry && daysBetween(entry.due, today || dayKey()) >= 0;
  }

  // ---------- Streaks & XP ----------

  const DAILY_GOAL = 30;

  // Records XP for today and updates the streak. Returns a new stats object.
  function addXp(stats, amount, today) {
    const t = today || dayKey();
    const s = Object.assign({ xp: 0, streak: 0, bestStreak: 0, lastActive: null, daily: {} }, stats);
    s.daily = Object.assign({}, s.daily);
    if (s.lastActive !== t) {
      const gap = s.lastActive ? daysBetween(s.lastActive, t) : null;
      s.streak = gap === 1 ? s.streak + 1 : 1;
      s.lastActive = t;
    }
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.xp += amount;
    s.daily[t] = (s.daily[t] || 0) + amount;
    return s;
  }

  // The streak shown to the user: it's lost if yesterday was skipped.
  function currentStreak(stats, today) {
    if (!stats || !stats.lastActive) return 0;
    return daysBetween(stats.lastActive, today || dayKey()) <= 1 ? stats.streak : 0;
  }

  // ---------- Quiz generation ----------

  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sample(arr, n, rand) {
    return shuffle(arr, rand).slice(0, n);
  }

  function tokenize(sentence) {
    return sentence.replace(/[¿¡?!.,]/g, '').split(/\s+/).filter(Boolean);
  }

  function choiceOptions(answer, pool, key, n, rand) {
    const others = [...new Set(pool.map((x) => x[key]))].filter((v) => v !== answer);
    return shuffle([answer, ...sample(others, n - 1, rand)], rand);
  }

  // Builds one question about `item`. `pool` supplies wrong options.
  function makeQuestion(type, item, pool, rand) {
    switch (type) {
      case 'mc-target': // see the foreign word, pick the English
        return { type, item, prompt: item.t, answer: item.e, options: choiceOptions(item.e, pool, 'e', 4, rand) };
      case 'mc-english': // see English, pick the foreign word
        return { type, item, prompt: item.e, answer: item.t, options: choiceOptions(item.t, pool, 't', 4, rand) };
      case 'listen': // hear the word, pick it
        return { type, item, prompt: item.t, answer: item.t, options: choiceOptions(item.t, pool, 't', 4, rand) };
      case 'type': // see English, type the foreign word
        return { type, item, prompt: item.e, answer: [item.t].concat(item.alt || []) };
      case 'build': { // assemble a sentence from word tiles
        const words = tokenize(item.t);
        const extra = pool
          .flatMap((p) => tokenize(p.t))
          .filter((w) => !words.some((x) => x.toLowerCase() === w.toLowerCase()));
        const distractors = sample([...new Set(extra)], Math.min(3, Math.max(1, 6 - words.length)), rand);
        return { type, item, prompt: item.e, answer: words.join(' '), tiles: shuffle(words.concat(distractors), rand) };
      }
      default:
        throw new Error('Unknown question type ' + type);
    }
  }

  // A lesson quiz: every new word is asked once in a recognition form, most
  // are asked again in a harder recall form, plus sentence builds and a
  // matching round. Mistakes are re-queued by the UI until answered.
  function lessonQuiz(lesson, unitPool, rand) {
    const pool = unitPool.length >= 4 ? unitPool : lesson.items;
    const qs = [];
    lesson.items.forEach((item, i) => {
      qs.push(makeQuestion(i % 3 === 2 ? 'listen' : i % 2 ? 'mc-english' : 'mc-target', item, pool, rand));
    });
    const recall = sample(lesson.items, Math.min(4, lesson.items.length), rand)
      .map((item) => makeQuestion('type', item, pool, rand));
    const builds = (lesson.sentences || []).map((s) => makeQuestion('build', s, lesson.items.concat(lesson.sentences), rand));
    const match = { type: 'match', pairs: sample(lesson.items, Math.min(4, lesson.items.length), rand) };
    // Recognition first, then the harder stuff mixed together.
    return shuffle(qs, rand).concat([match], shuffle(recall.concat(builds), rand));
  }

  // A checkpoint: a fixed-length mixed test over the whole unit, no retries.
  function checkpointQuiz(unit, rand) {
    const items = unit.lessons.flatMap((l) => l.items);
    const sentences = unit.lessons.flatMap((l) => l.sentences || []);
    const types = ['mc-target', 'mc-english', 'listen', 'type', 'type'];
    const picked = sample(items, Math.min(10, items.length), rand);
    const qs = picked.map((item, i) => makeQuestion(types[i % types.length], item, items, rand));
    sample(sentences, 2, rand).forEach((s) => qs.push(makeQuestion('build', s, items.concat(sentences), rand)));
    return shuffle(qs, rand);
  }

  // Review session: due items, hardest (lowest box) first.
  function reviewQuiz(dueItems, allItems, rand) {
    const ordered = shuffle(dueItems, rand).sort((a, b) => a.box - b.box).slice(0, 12);
    return ordered.map((d, i) => makeQuestion(i % 2 ? 'type' : 'mc-english', d.item, allItems, rand));
  }

  const CHECKPOINT_PASS = 0.8;

  const Core = {
    stripAccents, normalize, checkAnswer,
    dayKey, daysBetween, addDays,
    BOX_INTERVALS, srsUpdate, isDue,
    DAILY_GOAL, addXp, currentStreak,
    shuffle, sample, tokenize, makeQuestion, lessonQuiz, checkpointQuiz, reviewQuiz,
    CHECKPOINT_PASS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
