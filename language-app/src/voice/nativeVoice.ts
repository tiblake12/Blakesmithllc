// Connects the voice engine to the phone: expo-speech for talking,
// expo-speech-recognition for listening, expo-audio for the cue tones.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';
import type { Cue, Heard, VoiceIO } from '../core/session';
import type { Segment } from '../core/text';

const ENGLISH = 'en-US';

/** Give up listening if nothing is said for this long. */
const NO_SPEECH_TIMEOUT_MS = 7000;
/** Hard cap on one answer. */
const MAX_LISTEN_MS = 15000;

const SOUNDS: Record<Cue, number> = {
  listening: require('../../assets/sounds/listen.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  done: require('../../assets/sounds/done.wav'),
};

const CUE_LENGTH_MS: Record<Cue, number> = { listening: 160, correct: 250, wrong: 320, done: 640 };

export async function configureAudio() {
  // Keep talking and listening when the screen locks (iOS background audio),
  // and pause music from other apps during lessons.
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    shouldPlayInBackground: true,
    allowsBackgroundRecording: true,
    interruptionMode: 'doNotMix',
  }).catch(() => {});
}

export interface MicCheck {
  ok: boolean;
  /** Shown to the learner when ok is false. */
  message?: string;
  canAskAgain?: boolean;
}

export async function ensureMicrophone(): Promise<MicCheck> {
  try {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      return { ok: false, message: 'Speech recognition is not available on this phone.' };
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      return {
        ok: false,
        canAskAgain: perm.canAskAgain,
        message: 'Lingua needs the microphone and speech recognition to hear your answers. Please allow them in Settings.',
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Speech recognition is not available on this phone.' };
  }
}

/** Picks the best installed voice for each language, preferring "enhanced" voices. */
async function loadVoices(): Promise<Record<string, string>> {
  try {
    // Some browsers never report voices; don't let that block speaking.
    const voices = await Promise.race([
      Speech.getAvailableVoicesAsync(),
      new Promise<Speech.Voice[]>((r) => setTimeout(() => r([]), 1500)),
    ]);
    const best: Record<string, Speech.Voice> = {};
    for (const v of voices) {
      const lang = v.language.replace('_', '-');
      const prefix = lang.slice(0, 2).toLowerCase();
      for (const k of [lang, prefix]) {
        const cur = best[k];
        if (!cur || (v.quality === Speech.VoiceQuality.Enhanced && cur.quality !== Speech.VoiceQuality.Enhanced)) best[k] = v;
      }
    }
    return Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.identifier]));
  } catch {
    return {};
  }
}

export class NativeVoice implements VoiceIO {
  private voices: Promise<Record<string, string>> = loadVoices();
  private players: Partial<Record<Cue, AudioPlayer>> = {};
  private generation = 0;
  private finishListen: ((h: Heard) => void) | null = null;
  private finishSpeak: (() => void) | null = null;

  constructor(private targetLang: string) {}

  private voiceFor(lang: string, voices: Record<string, string>) {
    return voices[lang] ?? voices[lang.slice(0, 2).toLowerCase()];
  }

  async speak(segments: Segment[], opts: { slow: boolean }) {
    const gen = this.generation;
    const voices = await this.voices;
    for (const seg of segments) {
      if (gen !== this.generation) return;
      const target = seg.lang === 'target';
      const language = target ? this.targetLang : ENGLISH;
      await new Promise<void>((resolve) => {
        this.finishSpeak = resolve;
        Speech.speak(seg.text, {
          language,
          voice: this.voiceFor(language, voices),
          rate: target ? (opts.slow ? 0.6 : 0.85) : 1.0,
          onDone: resolve,
          onStopped: resolve,
          onError: () => resolve(),
        });
      });
      this.finishSpeak = null;
    }
  }

  listen(opts: { lang: 'en' | 'target'; hints: string[] }): Promise<Heard> {
    const gen = this.generation;
    return new Promise<Heard>((resolve) => {
      let transcripts: string[] = [];
      let heardSpeech = false;
      let settled = false;
      const subs: { remove(): void }[] = [];
      const timers: ReturnType<typeof setTimeout>[] = [];

      const done = (h: Heard) => {
        if (settled) return;
        settled = true;
        subs.forEach((s) => s.remove());
        timers.forEach(clearTimeout);
        this.finishListen = null;
        resolve(h);
      };
      this.finishListen = done;
      if (gen !== this.generation) return done({ kind: 'cancelled' });

      subs.push(
        ExpoSpeechRecognitionModule.addListener('speechstart', () => {
          heardSpeech = true;
        }),
        ExpoSpeechRecognitionModule.addListener('result', (e) => {
          const ts = e.results.map((r) => r.transcript).filter(Boolean);
          if (ts.length) {
            heardSpeech = true;
            transcripts = ts;
          }
          if (e.isFinal && ts.length) done({ kind: 'speech', transcripts: ts });
        }),
        ExpoSpeechRecognitionModule.addListener('nomatch', () => done({ kind: 'silence' })),
        ExpoSpeechRecognitionModule.addListener('error', (e) => {
          if (e.error === 'aborted') return done(transcripts.length ? { kind: 'speech', transcripts } : { kind: 'cancelled' });
          if (e.error === 'no-speech' || e.error === 'speech-timeout') return done({ kind: 'silence' });
          done({ kind: 'error', code: e.error, message: e.message });
        }),
        ExpoSpeechRecognitionModule.addListener('end', () =>
          done(transcripts.length ? { kind: 'speech', transcripts } : { kind: 'silence' }),
        ),
      );

      timers.push(
        setTimeout(() => {
          if (!heardSpeech) ExpoSpeechRecognitionModule.stop();
        }, NO_SPEECH_TIMEOUT_MS),
        setTimeout(() => ExpoSpeechRecognitionModule.stop(), MAX_LISTEN_MS),
      );

      try {
        ExpoSpeechRecognitionModule.start({
          lang: opts.lang === 'target' ? this.targetLang : ENGLISH,
          interimResults: true,
          maxAlternatives: 5,
          continuous: false,
          addsPunctuation: false,
          contextualStrings: opts.hints.slice(0, 100),
          androidIntentOptions: {
            EXTRA_LANGUAGE_MODEL: 'free_form',
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
          },
          iosCategory: {
            category: 'playAndRecord',
            categoryOptions: ['defaultToSpeaker', 'allowBluetooth', 'allowBluetoothA2DP'],
            mode: 'default',
          },
        });
      } catch (e) {
        done({ kind: 'error', code: 'unknown', message: String(e) });
      }
    });
  }

  cancel() {
    this.generation++;
    Speech.stop().catch(() => {});
    this.finishSpeak?.();
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      /* not listening */
    }
    this.finishListen?.({ kind: 'cancelled' });
  }

  async cue(kind: Cue) {
    try {
      if (kind === 'correct') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (kind === 'wrong') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      let p = this.players[kind];
      if (!p) p = this.players[kind] = createAudioPlayer(SOUNDS[kind]);
      await p.seekTo(0);
      p.play();
      // Let the tone finish before the microphone opens, so it isn't heard as an answer.
      if (kind === 'listening') await this.sleep(CUE_LENGTH_MS.listening + (Platform.OS === 'ios' ? 60 : 0));
    } catch {
      /* sounds are a nicety */
    }
  }

  sleep(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  dispose() {
    this.cancel();
    Object.values(this.players).forEach((p) => p?.remove());
    this.players = {};
  }
}
