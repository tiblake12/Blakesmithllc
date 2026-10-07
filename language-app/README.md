# Lingua

A language-learning web app: Spanish, French and German, taught from English.
It is plain HTML, CSS and JavaScript with no build step and no server, so any static host (including GitHub Pages) can serve it.

## How it teaches

- **Units → lessons → checkpoint.** Each lesson introduces about 6 words with audio and a grammar tip, then runs a short quiz.
  Lessons unlock in order. Each unit ends in a **checkpoint test** that gives one try per question.
  Scoring 80% unlocks the next unit.
- **Quiz types:** multiple choice (both directions), listening, typing (with accent buttons), sentence building from word tiles, and matching pairs.
  In lessons, a wrong answer comes back at the end of the quiz until you get it right.
  Answers that are only missing accents are accepted, and the correct spelling is shown.
- **Review:** every learned word goes into spaced repetition (Leitner boxes: 1, 3, 7, 14, 30 days).
  Missed words come back the same day.
- **Motivation:** XP, a 30 XP daily goal, a day streak and a 7-day activity row.
- **Audio** uses the browser's built-in speech (🔊 normal, 🐢 slow). If the browser has no speech support, listening questions become reading questions.

Progress is saved in the browser's `localStorage` on each device.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server --directory language-app 8000   # then visit http://localhost:8000
```

## Tests

```sh
node --test language-app/tests/*.test.js
```

The tests cover answer checking, spaced repetition and streaks.
They also check that every course is well formed and that every quiz it generates can be answered.

## Adding a language or lesson

Copy a file in `js/courses/` (for example `spanish.js`), change `id`, `name`, `native`, `flag`, `voice` (a BCP-47 speech code such as `it-IT`) and the content, and add a `<script>` tag for it in `index.html`.
To get accent buttons for typing questions, add the language's special characters to `SPECIAL_CHARS` in `js/app.js`.

Words are written as `[target, English, [accepted alternatives]]` and sentences as `[target, English]`.
Each lesson needs at least 4 words and 1 sentence. A word's English meaning should be unique within its unit, so quiz options are never ambiguous.
