# Lingua: learn a language by voice

Lingua teaches Spanish, French and German (from English) by voice, so learners don't have to stare at their phone.
They tap **Start** once. From then on, the coach talks, listens to spoken answers, grades them and moves on. Learners can go from one lesson to the next hands-free.

It's an [Expo](https://expo.dev) / React Native app for iPhone and Android, and it also runs in desktop Chrome.

## How a lesson works

1. **Teach.** "The word for *thank you* is: *gracias*." The coach repeats the word slowly, then the learner says it back.
   Each new word is recalled again straight after the next one is taught.
2. **Tip.** A short grammar or usage note, with the foreign words spoken in the right accent.
3. **Sentences.** Two short sentences are taught, repeat-after-me style.
4. **Quiz.** "How do you say *good night*?", "What does *por favor* mean?" and "How would you say *Thank you, goodbye*?"
   After a wrong answer, the coach gives the answer and the learner says it once. The question comes back at the end of the lesson.
5. **Results and next step.** "Lesson complete! You got 7 out of 8. Plus 10 XP. Say *next* for Lesson 2, *again* to repeat this lesson, *review* to practise 3 words, or *stop* to finish."

Each unit ends in a **checkpoint**: 12 spoken questions with one try each. Scoring 80% unlocks the next unit.
Words the learner learns go into **spaced-repetition review** (Leitner boxes: 1, 3, 7, 14, 30 days), and missed words come back the same day.
**XP**, a 30 XP **daily goal** and a **day streak** add motivation.
When six or more words are due, the coach suggests a review before new material.

### Voice commands

| When | Say |
|---|---|
| Any question | **repeat**, **slower**, **skip** / "I don't know", **pause**, **stop**, **help** |
| After a lesson | **next**, **again**, **review**, **checkpoint**, **stop** |
| Paused | **continue**, **stop** |

Commands also work in the course language ("repite", "plus lentement", "ich weiß nicht"…). Longer phrasings like "can you repeat that" work too.

### Built for not looking at the phone

- **Sound cues:** a short tone means "your turn", and there are distinct sounds for right, wrong and lesson finished. Right and wrong answers also vibrate.
- **Silence handling:** one silence repeats the question. Two silences pause the lesson, and the coach waits for "continue".
  After a few minutes of silence while paused, it stops to save battery.
- **Pocket mode** (on by default): the screen goes black and ignores touches, so the phone can go in a pocket. Holding the screen shows the controls.
  The screen stays awake during lessons so speech keeps working.
- **Forgiving grading:** accents never count against the learner, and digits from the recognizer ("2") count as words ("dos").
  Extra words like "it means the bread" are accepted, along with common English synonyms ("thanks" for "thank you") and near-misses ("close enough").

## Project layout

```
App.tsx                 screens and session lifecycle
src/content/            course data (courses.ts) and types
src/core/               all app logic, no React or device code; fully unit-tested
  text.ts               normalising and grading spoken answers
  commands.ts           voice commands per context
  plan.ts               turns a lesson/checkpoint/review into spoken steps
  session.ts            the voice engine (speak → listen → grade → respond, pause/stop)
  coach.ts              chains sessions together with the spoken menu
  progress.ts           unlocking, spaced repetition, streaks, XP
src/voice/nativeVoice.ts  device bridge: expo-speech, expo-speech-recognition, expo-audio
src/ui/                 course picker, home, session/pocket screen
src/state/storage.ts    saves progress on the device (AsyncStorage)
__tests__/              Jest tests, including whole lessons with a simulated learner
```

## Running it

Speech recognition is native code, so the app does **not** run in Expo Go. It needs a development build.

```sh
cd language-app
npm install

# Try it in desktop Chrome (quickest; uses the browser's speech services)
npx expo start --web

# On a phone: build a development build in the cloud with EAS (no Xcode or Android Studio needed)
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform ios      # or android
npx expo start --dev-client
```

Or build locally with `npx expo run:ios` (needs a Mac with Xcode) or `npx expo run:android` (needs Android Studio).

## Checks

```sh
npm test            # Jest: grading, commands, progress, full simulated lessons
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

## Adding content

Lessons live in `src/content/courses.ts`. Words are `[target, English, [accepted alternatives]]` and sentences are `[target, English]`.
Tips are spoken in English. Wrap target-language words in `{braces}` so the coach says them in the right accent, for example `"Say {buenos días} in the morning."`.
The tests check that every lesson has at least 4 words and a sentence, and that every answer is accepted when said correctly.
They also check that no lesson word is also a voice command.

To add a language, add a course with its `voice` locale (for example `it-IT`).
Then add its number words to `DIGIT_WORDS` in `src/core/text.ts`, and optionally its command phrases in `src/core/commands.ts`.

## Known limits (please test on real phones)

- **Screen locked:** iOS background audio is turned on, so lessons may keep going with the screen locked, but this hasn't been tested on a device yet.
  Android doesn't allow speech recognition from the background, so on Android use pocket mode (screen on, black).
- **Internet:** speech recognition usually uses the phone maker's online service. Offline recognition works on some phones if the language is downloaded in the phone's speech settings.
- **Recognition accuracy:** recognizers are tuned for native speakers, so a beginner's accent can be misheard. Grading is deliberately forgiving to make up for this.
  It checks that the right words were understood, not fine pronunciation.
- **Voices** come from the phone. "Enhanced" voices are used when installed and sound much better.
  On iPhone they can be downloaded under Settings → Accessibility → Spoken Content → Voices.
