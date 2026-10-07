// Lingua: UI, quiz runner and saved progress. Pure logic lives in core.js.
(function () {
  'use strict';

  const C = window.Core;
  const app = document.getElementById('app');

  // ---------- Courses ----------

  const SPECIAL_CHARS = {
    es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
    fr: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ô', 'î', 'û', 'ù', 'ë', 'œ'],
    de: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
  };

  const COURSES = (window.COURSES || []).map((raw) => Object.assign({}, raw, {
    units: raw.units.map((unit, ui) => Object.assign({}, unit, {
      index: ui,
      lessons: unit.lessons.map((lesson, li) => Object.assign({}, lesson, {
        key: `u${ui}l${li}`,
        unit: ui,
        index: li,
        items: lesson.words.map(([t, e, alt]) => ({ id: `${raw.id}:${t}`, t, e, alt: alt || [], kind: 'word' })),
        sentences: (lesson.sentences || []).map(([t, e]) => ({ id: `${raw.id}:${t}`, t, e, alt: [], kind: 'sentence' })),
      })),
    })),
  }));

  function getCourse(id) {
    return COURSES.find((c) => c.id === id);
  }

  function allWords(course) {
    return course.units.flatMap((u) => u.lessons.flatMap((l) => l.items));
  }

  // ---------- Saved state ----------

  const STORE_KEY = 'lingua-progress-v1';

  function freshState() {
    return { v: 1, courseId: null, stats: {}, courses: {} };
  }

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v === 1) return s;
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    return freshState();
  }

  let state = loadState();

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function prog(courseId) {
    if (!state.courses[courseId]) state.courses[courseId] = { lessons: {}, checkpoints: {}, srs: {} };
    return state.courses[courseId];
  }

  function unitUnlocked(course, ui) {
    return ui === 0 || prog(course.id).checkpoints[ui - 1] >= C.CHECKPOINT_PASS * 100;
  }

  function lessonDone(course, lesson) {
    return prog(course.id).lessons[lesson.key] != null;
  }

  function lessonUnlocked(course, lesson) {
    if (!unitUnlocked(course, lesson.unit)) return false;
    return lesson.index === 0 || lessonDone(course, course.units[lesson.unit].lessons[lesson.index - 1]);
  }

  function checkpointUnlocked(course, unit) {
    return unitUnlocked(course, unit.index) && unit.lessons.every((l) => lessonDone(course, l));
  }

  function checkpointPassed(course, unit) {
    return prog(course.id).checkpoints[unit.index] >= C.CHECKPOINT_PASS * 100;
  }

  function courseProgress(course) {
    const steps = course.units.reduce((n, u) => n + u.lessons.length + 1, 0);
    let done = 0;
    course.units.forEach((u) => {
      done += u.lessons.filter((l) => lessonDone(course, l)).length;
      if (checkpointPassed(course, u)) done++;
    });
    return Math.round((done / steps) * 100);
  }

  function dueWords(course) {
    const srs = prog(course.id).srs;
    const today = C.dayKey();
    return allWords(course)
      .filter((w) => C.isDue(srs[w.id], today))
      .map((w) => ({ item: w, box: srs[w.id].box }));
  }

  function learnedWords(course) {
    const srs = prog(course.id).srs;
    return allWords(course).filter((w) => srs[w.id]);
  }

  // ---------- Speech ----------

  const tts = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    voices: [],
  };
  if (tts.ok) {
    const loadVoices = () => { tts.voices = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, lang, slow) {
    if (!tts.ok || !text) return;
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, ', '));
    u.lang = lang;
    const prefix = lang.slice(0, 2);
    const voice = tts.voices.find((v) => v.lang === lang) || tts.voices.find((v) => v.lang && v.lang.startsWith(prefix));
    if (voice) u.voice = voice;
    u.rate = slow ? 0.55 : 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function speakButtons(text, small) {
    if (!tts.ok) return '';
    const cls = small ? 'icon-btn small' : 'icon-btn';
    return `<span class="speak-group">
      <button class="${cls}" data-speak="${esc(text)}" aria-label="Listen" title="Listen">🔊</button>
      <button class="${cls}" data-speak-slow="${esc(text)}" aria-label="Listen slowly" title="Listen slowly">🐢</button>
    </span>`;
  }

  // ---------- Rendering helpers ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let keyHandler = null;
  document.addEventListener('keydown', (e) => { if (keyHandler) keyHandler(e); });

  let currentCourse = null;

  // Speak buttons work anywhere on the page.
  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-speak],[data-speak-slow]');
    if (!b || !currentCourse) return;
    const slow = b.hasAttribute('data-speak-slow');
    speak(b.getAttribute(slow ? 'data-speak-slow' : 'data-speak'), currentCourse.voice, slow);
  });

  function render(html) {
    keyHandler = null;
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function $(sel) { return app.querySelector(sel); }
  function $$(sel) { return Array.from(app.querySelectorAll(sel)); }
  function on(sel, fn) { $$(sel).forEach((el) => el.addEventListener('click', fn)); }

  function topBar() {
    const s = state.stats;
    const streak = C.currentStreak(s);
    return `<header class="topbar">
      <button class="brand" id="go-home" aria-label="Home"><span class="logo">L</span> Lingua</button>
      <div class="topbar-stats">
        ${currentCourse ? `<button class="chip" id="switch-course" title="Change language">${currentCourse.flag} ${esc(currentCourse.name)} ▾</button>` : ''}
        <span class="chip ${streak ? 'streak-on' : ''}" title="Day streak">🔥 ${streak}</span>
        <span class="chip" title="Total XP">⚡ ${s.xp || 0}</span>
      </div>
    </header>`;
  }

  function wireTopBar() {
    on('#go-home', () => (currentCourse ? showHome() : showCoursePicker()));
    on('#switch-course', showCoursePicker);
  }

  // ---------- Course picker ----------

  function showCoursePicker() {
    const cards = COURSES.map((c) => {
      const started = !!state.courses[c.id];
      return `<button class="course-card" data-course="${c.id}">
        <span class="flag">${c.flag}</span>
        <span class="course-name">${esc(c.name)}</span>
        <span class="muted">${esc(c.native)}</span>
        ${started ? `<span class="bar"><span style="width:${courseProgress(c)}%"></span></span><span class="muted small">${courseProgress(c)}% complete</span>` : '<span class="muted small">Start from scratch</span>'}
      </button>`;
    }).join('');
    render(`${topBar()}
      <main class="wrap">
        <section class="hero">
          <h1>What do you want to learn?</h1>
          <p class="muted">Short lessons, quick quizzes, and a checkpoint at the end of each unit. Your progress saves on this device.</p>
        </section>
        <div class="course-grid">${cards}</div>
      </main>`);
    wireTopBar();
    on('[data-course]', (e) => {
      state.courseId = e.currentTarget.dataset.course;
      save();
      currentCourse = getCourse(state.courseId);
      showHome();
    });
  }

  // ---------- Home / course map ----------

  function weekDots() {
    const today = C.dayKey();
    const daily = state.stats.daily || {};
    const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const key = C.addDays(today, -i);
      const xp = daily[key] || 0;
      const d = new Date(key + 'T00:00:00');
      const cls = xp >= C.DAILY_GOAL ? 'goal' : xp > 0 ? 'some' : '';
      html += `<span class="day ${cls} ${i === 0 ? 'today' : ''}" title="${key}: ${xp} XP"><span class="dot"></span>${names[d.getDay()]}</span>`;
    }
    return html;
  }

  function showHome() {
    const course = currentCourse;
    const p = prog(course.id);
    const todayXp = (state.stats.daily || {})[C.dayKey()] || 0;
    const goalPct = Math.min(100, Math.round((todayXp / C.DAILY_GOAL) * 100));
    const due = dueWords(course).length;
    const learned = learnedWords(course).length;

    const units = course.units.map((unit) => {
      const open = unitUnlocked(course, unit.index);
      const lessons = unit.lessons.map((lesson) => {
        const done = lessonDone(course, lesson);
        const unlocked = lessonUnlocked(course, lesson);
        const best = p.lessons[lesson.key];
        return `<li class="step ${done ? 'done' : ''} ${unlocked ? '' : 'locked'}">
          <span class="step-icon">${done ? '✓' : unlocked ? lesson.index + 1 : '🔒'}</span>
          <span class="step-text"><strong>${esc(lesson.title)}</strong>
            <span class="muted small">${lesson.items.length} words${done ? ` · best ${best}%` : ''}</span></span>
          ${unlocked ? `<button class="btn ${done ? 'ghost' : 'primary'} sm" data-lesson="${lesson.key}">${done ? 'Practise' : 'Start'}</button>` : ''}
        </li>`;
      }).join('');
      const cpOpen = checkpointUnlocked(course, unit);
      const cpPassed = checkpointPassed(course, unit);
      const cpBest = p.checkpoints[unit.index];
      const isLast = unit.index === course.units.length - 1;
      const cpNote = cpPassed
        ? `Passed · best ${cpBest}%`
        : cpOpen
          ? `Score ${C.CHECKPOINT_PASS * 100}% to ${isLast ? 'finish the course' : `unlock Unit ${unit.index + 2}`}${cpBest != null ? ` · best ${cpBest}%` : ''}`
          : 'Finish every lesson in this unit to unlock';
      return `<section class="unit ${open ? '' : 'locked'}">
        <div class="unit-head">
          <span class="unit-label">Unit ${unit.index + 1}</span>
          <h2>${esc(unit.title)}</h2>
          <p class="muted">${esc(unit.description)}</p>
        </div>
        <ol class="steps">
          ${lessons}
          <li class="step checkpoint ${cpPassed ? 'done' : ''} ${cpOpen ? '' : 'locked'}">
            <span class="step-icon">${cpPassed ? '🏆' : cpOpen ? '🏁' : '🔒'}</span>
            <span class="step-text"><strong>Checkpoint</strong><span class="muted small">${cpNote}</span></span>
            ${cpOpen ? `<button class="btn ${cpPassed ? 'ghost' : 'accent'} sm" data-checkpoint="${unit.index}">${cpPassed ? 'Retake' : 'Take test'}</button>` : ''}
          </li>
        </ol>
      </section>`;
    }).join('');

    render(`${topBar()}
      <main class="wrap">
        <div class="dash">
          <div class="card">
            <div class="card-row"><strong>Daily goal</strong><span class="muted small">${todayXp} / ${C.DAILY_GOAL} XP</span></div>
            <span class="bar big"><span style="width:${goalPct}%"></span></span>
            <div class="week">${weekDots()}</div>
          </div>
          <div class="card">
            <div class="card-row"><strong>Review</strong><span class="muted small">${learned} words learned</span></div>
            <p class="muted small">${due ? `${due} word${due === 1 ? ' is' : 's are'} due. Reviewing at the right time makes words stick.` : learned ? 'All caught up! Words you miss come back here.' : 'Finish a lesson and its words will show up here for review.'}</p>
            ${due ? `<button class="btn accent sm" id="review">Review ${due} word${due === 1 ? '' : 's'}</button>`
              : learned ? '<button class="btn ghost sm" id="practice">Practise anyway</button>' : ''}
          </div>
        </div>
        <div class="course-title">
          <span class="flag">${course.flag}</span>
          <div><h1>${esc(course.name)}</h1><span class="bar"><span style="width:${courseProgress(course)}%"></span></span>
          <span class="muted small">${courseProgress(course)}% of the course complete</span></div>
        </div>
        ${units}
        <footer class="foot">
          <button class="link" id="reset">Reset ${esc(course.name)} progress</button>
          ${tts.ok ? '' : '<p class="muted small">Your browser does not support speech, so listening exercises are turned off.</p>'}
        </footer>
      </main>`);
    wireTopBar();
    on('[data-lesson]', (e) => {
      const key = e.currentTarget.dataset.lesson;
      const lesson = course.units.flatMap((u) => u.lessons).find((l) => l.key === key);
      startLesson(lesson);
    });
    on('[data-checkpoint]', (e) => startCheckpoint(course.units[+e.currentTarget.dataset.checkpoint]));
    on('#review', () => startReview(dueWords(course)));
    on('#practice', () => startReview(C.sample(learnedWords(course), 8).map((w) => ({ item: w, box: prog(course.id).srs[w.id].box }))));
    on('#reset', () => {
      if (!confirm(`Erase all your ${course.name} progress? Your XP and streak are kept.`)) return;
      delete state.courses[course.id];
      save();
      showHome();
    });
  }

  // ---------- Lesson: learn cards, then quiz ----------

  function startLesson(lesson) {
    const cards = [{ tip: true }].concat(lesson.items);
    let i = 0;

    function show() {
      const card = cards[i];
      const body = card.tip
        ? `<div class="flash tip-card">
            <span class="unit-label">New lesson</span>
            <h2>${esc(lesson.title)}</h2>
            <p>You’ll learn ${lesson.items.length} words, then take a short quiz.</p>
            <div class="tip"><strong>💡 Tip</strong><p>${esc(lesson.tip)}</p></div>
          </div>`
        : `<div class="flash">
            <span class="muted small">New word ${i} of ${lesson.items.length}</span>
            <div class="flash-word">${esc(card.t)}</div>
            ${speakButtons(card.t)}
            <div class="flash-meaning">${esc(card.e)}</div>
            ${card.alt.length ? `<p class="muted small">Also: ${card.alt.map(esc).join(', ')}</p>` : ''}
          </div>`;
      const last = i === cards.length - 1;
      render(`<main class="wrap narrow session">
        <div class="session-top">
          <button class="icon-btn" id="quit" aria-label="Quit lesson">✕</button>
          <span class="bar"><span style="width:${(i / cards.length) * 100}%"></span></span>
        </div>
        ${body}
        <div class="session-actions">
          ${i > 0 ? '<button class="btn ghost" id="back">Back</button>' : '<span></span>'}
          <button class="btn primary" id="next">${last ? 'Start quiz' : i === 0 ? 'Let’s go' : 'Next'}</button>
        </div>
        ${i === 0 ? '<p class="center"><button class="link" id="skip">Already know these? Skip to the quiz</button></p>' : ''}
      </main>`);
      if (!card.tip) speak(card.t, currentCourse.voice);
      on('#quit', showHome);
      on('#back', () => { i--; show(); });
      on('#next', () => (last ? quiz() : (i++, show())));
      on('#skip', quiz);
      keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); last ? quiz() : (i++, show()); }
        else if (e.key === 'ArrowLeft' && i > 0) { i--; show(); }
      };
    }

    function quiz() {
      const unit = currentCourse.units[lesson.unit];
      const pool = unit.lessons.filter((l) => lessonUnlocked(currentCourse, l)).flatMap((l) => l.items);
      runQuiz({
        mode: 'lesson',
        title: lesson.title,
        questions: C.lessonQuiz(lesson, pool),
        onDone: (r) => finishLesson(lesson, r),
      });
    }

    show();
  }

  function startCheckpoint(unit) {
    render(`<main class="wrap narrow session">
      <div class="flash tip-card">
        <span class="unit-label">Unit ${unit.index + 1} checkpoint</span>
        <h2>${esc(unit.title)}</h2>
        <p>This test checks that you understand everything in the unit. Each question gets <strong>one try</strong>, and you need <strong>${C.CHECKPOINT_PASS * 100}%</strong> to pass.</p>
        <p class="muted small">You can retake it as many times as you like.</p>
      </div>
      <div class="session-actions"><button class="btn ghost" id="back">Not yet</button><button class="btn accent" id="go">Start checkpoint</button></div>
    </main>`);
    on('#back', showHome);
    const go = () => runQuiz({
      mode: 'checkpoint',
      title: `Unit ${unit.index + 1} checkpoint`,
      questions: C.checkpointQuiz(unit),
      onDone: (r) => finishCheckpoint(unit, r),
    });
    on('#go', go);
    keyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  }

  function startReview(due) {
    runQuiz({
      mode: 'review',
      title: 'Review',
      questions: C.reviewQuiz(due, allWords(currentCourse)),
      onDone: finishReview,
    });
  }

  // ---------- Quiz runner ----------

  // Runs a list of questions. In lessons, wrong answers go to the back of the
  // queue until answered correctly; checkpoints and reviews give one try.
  function runQuiz(cfg) {
    const questions = cfg.questions.map((q) => (q.type === 'listen' && !tts.ok
      ? Object.assign({}, q, { type: 'mc-english', prompt: q.item.e })
      : q));
    const queue = questions.slice();
    const firstTry = new Map(); // question -> correct on first attempt
    const itemResults = {}; // word id -> correct every time it was asked
    const missed = new Map();
    let done = 0;

    function recordItem(item, correct) {
      if (item.kind !== 'word') return;
      itemResults[item.id] = (itemResults[item.id] !== false) && correct;
      if (!correct) missed.set(item.id, item);
    }

    function next() {
      if (!queue.length) {
        const correct = questions.filter((q) => firstTry.get(q)).length;
        cfg.onDone({ total: questions.length, correct, pct: Math.round((correct / questions.length) * 100), itemResults, missed: [...missed.values()] });
        return;
      }
      ask(queue.shift());
    }

    function frame(q, inner, retry) {
      return `<main class="wrap narrow session">
        <div class="session-top">
          <button class="icon-btn" id="quit" aria-label="Quit">✕</button>
          <span class="bar"><span style="width:${(done / questions.length) * 100}%"></span></span>
          <span class="muted small">${done}/${questions.length}</span>
        </div>
        ${retry ? '<p class="retry-note">↻ Let’s try this one again</p>' : ''}
        ${inner}
        <div class="feedback" id="feedback" aria-live="polite"></div>
        <div class="session-actions"><span></span><button class="btn primary" id="check" disabled>Check</button></div>
      </main>`;
    }

    function wireQuit() {
      on('#quit', () => {
        if (confirm(cfg.mode === 'lesson' ? 'Quit this lesson? Your progress in it will be lost.' : 'Quit? Your answers so far won’t count.')) showHome();
      });
    }

    function ask(q) {
      const retry = firstTry.has(q);
      if (q.type === 'match') return askMatch(q, retry);

      const voice = currentCourse.voice;
      let inner = '';
      if (q.type === 'mc-target') {
        inner = `<h2 class="q-title">What does this mean?</h2>
          <div class="prompt target">${esc(q.prompt)} ${speakButtons(q.prompt, true)}</div>
          <div class="options">${q.options.map((o, i) => `<button class="option" data-value="${esc(o)}"><kbd>${i + 1}</kbd>${esc(o)}</button>`).join('')}</div>`;
      } else if (q.type === 'mc-english') {
        inner = `<h2 class="q-title">How do you say this in ${esc(currentCourse.name)}?</h2>
          <div class="prompt">${esc(q.prompt)}</div>
          <div class="options">${q.options.map((o, i) => `<button class="option" data-value="${esc(o)}"><kbd>${i + 1}</kbd>${esc(o)}</button>`).join('')}</div>`;
      } else if (q.type === 'listen') {
        inner = `<h2 class="q-title">What do you hear?</h2>
          <div class="prompt listen">${speakButtons(q.prompt)}</div>
          <div class="options">${q.options.map((o, i) => `<button class="option" data-value="${esc(o)}"><kbd>${i + 1}</kbd>${esc(o)}</button>`).join('')}</div>`;
      } else if (q.type === 'type') {
        const chars = SPECIAL_CHARS[currentCourse.id] || [];
        inner = `<h2 class="q-title">Type this in ${esc(currentCourse.name)}</h2>
          <div class="prompt">${esc(q.prompt)}</div>
          <input class="answer-input" id="answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(voice)}" placeholder="Type your answer">
          <div class="chars">${chars.map((c) => `<button class="char" data-char="${c}" tabindex="-1">${c}</button>`).join('')}</div>`;
      } else if (q.type === 'build') {
        inner = `<h2 class="q-title">Build this sentence</h2>
          <div class="prompt">${esc(q.prompt)}</div>
          <div class="build-line" id="line"></div>
          <div class="tiles" id="bank">${q.tiles.map((t, i) => `<button class="tile" data-tile="${i}">${esc(t)}</button>`).join('')}</div>`;
      }
      render(frame(q, inner, retry));
      wireQuit();
      if (q.type === 'listen') speak(q.prompt, voice);

      const check = $('#check');
      let value = '';
      let checked = false;
      const set = (v) => { value = v; check.disabled = !String(v).trim(); };

      if (q.options) {
        on('.option', (e) => {
          if (checked) return;
          $$('.option').forEach((b) => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          set(e.currentTarget.dataset.value);
        });
      }
      if (q.type === 'type') {
        const input = $('#answer');
        input.focus();
        input.addEventListener('input', () => set(input.value));
        on('.char', (e) => {
          const c = e.currentTarget.dataset.char;
          const s = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? s;
          input.value = input.value.slice(0, s) + c + input.value.slice(end);
          input.setSelectionRange(s + c.length, s + c.length);
          input.focus();
          set(input.value);
        });
      }
      if (q.type === 'build') {
        const chosen = [];
        const draw = () => {
          $('#line').innerHTML = chosen.map((ti) => `<button class="tile" data-placed="${ti}">${esc(q.tiles[ti])}</button>`).join('');
          $$('#bank .tile').forEach((b) => { b.classList.toggle('used', chosen.includes(+b.dataset.tile)); });
          on('[data-placed]', (e) => { if (checked) return; chosen.splice(chosen.indexOf(+e.currentTarget.dataset.placed), 1); draw(); });
          set(chosen.map((ti) => q.tiles[ti]).join(' '));
        };
        on('#bank .tile', (e) => {
          const ti = +e.currentTarget.dataset.tile;
          if (checked || chosen.includes(ti)) return;
          chosen.push(ti);
          draw();
        });
      }

      function grade() {
        if (checked || !String(value).trim()) return;
        checked = true;
        let correct;
        let note = '';
        if (q.type === 'type' || q.type === 'build') {
          const r = C.checkAnswer(value, q.answer);
          correct = r.correct;
          if (r.accentSlip) note = `Watch the spelling: <strong>${esc(r.expected)}</strong>`;
          const input = $('#answer');
          if (input) input.disabled = true;
        } else {
          correct = value === q.answer;
          $$('.option').forEach((b) => {
            if (b.dataset.value === q.answer) b.classList.add('right');
            else if (b.classList.contains('selected')) b.classList.add('wrong');
            b.classList.remove('selected');
            b.disabled = true;
          });
        }
        const display = Array.isArray(q.answer) ? q.answer[0] : q.answer;
        const answerTarget = q.type === 'mc-target' ? q.item.t : q.type === 'build' ? q.item.t : display;
        const meaning = q.type === 'mc-target' ? '' : ` — ${esc(q.item.e)}`;
        showFeedback(correct, correct
          ? `<strong>${retry ? 'Got it!' : C.shuffle(['Correct!', 'Nice!', 'Great job!', 'Well done!'])[0]}</strong>${note ? `<p>${note}</p>` : ''}`
          : `<strong>Not quite.</strong><p>Correct answer: <strong>${esc(q.type === 'mc-target' ? display : answerTarget)}</strong>${q.type === 'mc-target' ? '' : meaning}</p>`,
        q.item.t);
        if (q.type !== 'listen') speak(q.item.t, voice);
        settle(q, correct);
      }

      check.addEventListener('click', () => (checked ? next() : grade()));
      keyHandler = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (checked) next();
          else grade();
        } else if (q.options && !checked && /^[1-4]$/.test(e.key) && document.activeElement.id !== 'answer') {
          const b = $$('.option')[+e.key - 1];
          if (b) b.click();
        }
      };
    }

    function askMatch(q, retry) {
      const left = C.shuffle(q.pairs);
      const right = C.shuffle(q.pairs);
      const inner = `<h2 class="q-title">Match the pairs</h2>
        <div class="match">
          <div class="match-col">${left.map((p) => `<button class="option" data-side="t" data-id="${esc(p.id)}">${esc(p.t)}</button>`).join('')}</div>
          <div class="match-col">${right.map((p) => `<button class="option" data-side="e" data-id="${esc(p.id)}">${esc(p.e)}</button>`).join('')}</div>
        </div>`;
      render(frame(q, inner, retry));
      wireQuit();
      const check = $('#check');
      const wrongIds = new Set();
      let picked = null;
      let matched = 0;

      on('.match .option', (e) => {
        const b = e.currentTarget;
        if (b.classList.contains('right')) return;
        if (!picked || picked.dataset.side === b.dataset.side) {
          if (picked) picked.classList.remove('selected');
          picked = b;
          b.classList.add('selected');
          if (b.dataset.side === 't') speak(b.textContent, currentCourse.voice);
          return;
        }
        const a = picked;
        picked = null;
        a.classList.remove('selected');
        if (a.dataset.id === b.dataset.id) {
          a.classList.add('right');
          b.classList.add('right');
          a.disabled = b.disabled = true;
          if (++matched === q.pairs.length) {
            q.pairs.forEach((p) => recordItem(p, !wrongIds.has(p.id)));
            const correct = wrongIds.size === 0;
            showFeedback(true, `<strong>${correct ? 'Perfect match!' : 'All matched!'}</strong>${correct ? '' : `<p>${wrongIds.size} mix-up${wrongIds.size === 1 ? '' : 's'} along the way.</p>`}`);
            if (!firstTry.has(q)) firstTry.set(q, correct);
            done++;
            check.disabled = false;
            check.textContent = 'Continue';
            check.focus();
          }
        } else {
          // Count the mistake against the word that was picked from the foreign side.
          wrongIds.add(a.dataset.side === 't' ? a.dataset.id : b.dataset.id);
          [a, b].forEach((x) => { x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong'), 600); });
        }
      });
      check.addEventListener('click', () => { if (matched === q.pairs.length) next(); });
      keyHandler = (e) => { if (e.key === 'Enter' && matched === q.pairs.length) { e.preventDefault(); next(); } };
    }

    function showFeedback(correct, html, speakText) {
      const fb = $('#feedback');
      fb.className = `feedback show ${correct ? 'good' : 'bad'}`;
      fb.innerHTML = `<div>${html}</div>${speakText ? speakButtons(speakText, true) : ''}`;
      const check = $('#check');
      check.disabled = false;
      check.textContent = 'Continue';
      check.className = `btn ${correct ? 'primary' : 'danger'}`;
      check.focus();
    }

    function settle(q, correct) {
      const first = !firstTry.has(q);
      if (first) {
        firstTry.set(q, correct);
        recordItem(q.item, correct);
      }
      if (correct) done++;
      else if (cfg.mode === 'lesson') queue.push(q);
      else done++;
    }

    next();
  }

  // ---------- Results ----------

  function applySrs(itemResults) {
    const srs = prog(currentCourse.id).srs;
    const today = C.dayKey();
    Object.keys(itemResults).forEach((id) => { srs[id] = C.srsUpdate(srs[id], itemResults[id], today); });
  }

  function award(xp) {
    const before = (state.stats.daily || {})[C.dayKey()] || 0;
    state.stats = C.addXp(state.stats, xp);
    return before < C.DAILY_GOAL && before + xp >= C.DAILY_GOAL;
  }

  function finishLesson(lesson, r) {
    const p = prog(currentCourse.id);
    p.lessons[lesson.key] = Math.max(p.lessons[lesson.key] || 0, r.pct);
    applySrs(r.itemResults);
    const xp = 10 + (r.pct === 100 ? 5 : 0);
    const goal = award(xp);
    save();
    const unit = currentCourse.units[lesson.unit];
    const nextLesson = unit.lessons[lesson.index + 1];
    const cpReady = !nextLesson && checkpointUnlocked(currentCourse, unit) && !checkpointPassed(currentCourse, unit);
    showResult({
      emoji: r.pct === 100 ? '🌟' : '🎉',
      title: 'Lesson complete!',
      sub: r.pct === 100 ? 'Flawless: every answer right first time.' : 'Mistakes were repeated until you got them right.',
      r, xp, goal,
      primary: nextLesson
        ? { label: `Next: ${nextLesson.title}`, fn: () => startLesson(nextLesson) }
        : cpReady ? { label: 'Take the checkpoint', fn: () => startCheckpoint(unit) } : { label: 'Continue', fn: showHome },
      secondary: { label: 'Back to course', fn: showHome },
    });
  }

  function finishCheckpoint(unit, r) {
    const p = prog(currentCourse.id);
    const passed = r.pct >= C.CHECKPOINT_PASS * 100;
    const firstPass = passed && !checkpointPassed(currentCourse, unit);
    p.checkpoints[unit.index] = Math.max(p.checkpoints[unit.index] || 0, r.pct);
    applySrs(r.itemResults);
    const xp = passed ? 20 : 5;
    const goal = award(xp);
    save();
    const nextUnit = currentCourse.units[unit.index + 1];
    showResult({
      emoji: passed ? '🏆' : '📚',
      title: passed ? 'Checkpoint passed!' : 'Not quite there yet',
      sub: passed
        ? (firstPass && nextUnit ? `Unit ${nextUnit.index + 1}: ${nextUnit.title} is now unlocked.` : nextUnit ? 'Great work!' : `You’ve finished the ${currentCourse.name} course!`)
        : `You need ${C.CHECKPOINT_PASS * 100}% to pass. Practise the words below, then try again.`,
      r, xp, goal,
      primary: passed
        ? (nextUnit && firstPass ? { label: `Start Unit ${nextUnit.index + 2}`, fn: () => startLesson(nextUnit.lessons[0]) } : { label: 'Continue', fn: showHome })
        : { label: 'Try again', fn: () => startCheckpoint(unit) },
      secondary: { label: 'Back to course', fn: showHome },
    });
  }

  function finishReview(r) {
    applySrs(r.itemResults);
    const xp = Math.max(1, r.correct * 2);
    const goal = award(xp);
    save();
    showResult({
      emoji: '🧠',
      title: 'Review complete!',
      sub: 'Words you got right will come back later; missed ones come back sooner.',
      r, xp, goal,
      primary: { label: 'Continue', fn: showHome },
    });
  }

  function showResult(o) {
    const { r } = o;
    const missed = r.missed.length
      ? `<div class="card missed"><strong>Words to practise</strong><ul>${r.missed.map((w) => `<li><span><strong>${esc(w.t)}</strong> <span class="muted">${esc(w.e)}</span></span>${speakButtons(w.t, true)}</li>`).join('')}</ul>
        <p class="muted small">These will show up in your reviews.</p></div>`
      : '';
    render(`${topBar()}
      <main class="wrap narrow result">
        <div class="result-emoji">${o.emoji}</div>
        <h1>${esc(o.title)}</h1>
        <p class="muted">${esc(o.sub)}</p>
        <div class="stats">
          <div class="stat"><span class="stat-value">${r.pct}%</span><span class="muted small">accuracy</span></div>
          <div class="stat"><span class="stat-value">${r.correct}/${r.total}</span><span class="muted small">right first try</span></div>
          <div class="stat"><span class="stat-value">+${o.xp}</span><span class="muted small">XP</span></div>
          <div class="stat"><span class="stat-value">🔥 ${C.currentStreak(state.stats)}</span><span class="muted small">day streak</span></div>
        </div>
        ${o.goal ? '<p class="goal-hit">🎯 Daily goal reached!</p>' : ''}
        ${missed}
        <div class="session-actions">
          ${o.secondary ? '<button class="btn ghost" id="secondary"></button>' : '<span></span>'}
          <button class="btn primary" id="primary"></button>
        </div>
      </main>`);
    wireTopBar();
    $('#primary').textContent = o.primary.label;
    on('#primary', o.primary.fn);
    if (o.secondary) {
      $('#secondary').textContent = o.secondary.label;
      on('#secondary', o.secondary.fn);
    }
    $('#primary').focus();
    keyHandler = (e) => { if (e.key === 'Enter' && document.activeElement === document.body) { e.preventDefault(); o.primary.fn(); } };
  }

  // ---------- Start ----------

  currentCourse = state.courseId ? getCourse(state.courseId) : null;
  if (currentCourse) showHome();
  else showCoursePicker();
})();
