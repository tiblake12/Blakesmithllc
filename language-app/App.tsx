import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getCourse, type Course } from './src/content';
import { runCoach } from './src/core/coach';
import type { AppState, Settings } from './src/core/progress';
import { Conversation, type Status } from './src/core/session';
import { loadState, saveState } from './src/state/storage';
import { CoursePicker } from './src/ui/CoursePicker';
import { Home } from './src/ui/Home';
import { SessionScreen } from './src/ui/SessionScreen';
import { useTheme } from './src/ui/theme';
import { configureAudio, ensureMicrophone, NativeVoice } from './src/voice/nativeVoice';

type Screen = 'loading' | 'pick' | 'home' | 'session';

const KEEP_AWAKE_TAG = 'lingua-session';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const th = useTheme();
  const [screen, setScreen] = useState<Screen>('loading');
  const [state, setStateRaw] = useState<AppState | null>(null);
  const [status, setStatus] = useState<Status>({ phase: 'idle', caption: '' });
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const convRef = useRef<Conversation | null>(null);

  const setState = useCallback((s: AppState) => {
    stateRef.current = s;
    setStateRaw(s);
    saveState(s);
  }, []);

  useEffect(() => {
    loadState().then((s) => {
      stateRef.current = s;
      setStateRaw(s);
      setScreen(getCourse(s.courseId) ? 'home' : 'pick');
    });
  }, []);

  // Android back button during a lesson asks before stopping.
  useEffect(() => {
    if (screen !== 'session') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Stop the lesson?', 'Progress in this lesson will be lost.', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => convRef.current?.stop() },
      ]);
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const course: Course | undefined = state ? getCourse(state.courseId) : undefined;

  const start = useCallback(async () => {
    if (!course || !stateRef.current) return;
    setError(null);
    const mic = await ensureMicrophone();
    if (!mic.ok) {
      setError(mic.message ?? 'The microphone is not available.');
      return;
    }
    await configureAudio();
    await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    const io = new NativeVoice(course.voice);
    const conv = new Conversation(course, io, setStatus, { slow: stateRef.current.settings.slow });
    convRef.current = conv;
    setStatus({ phase: 'idle', caption: '' });
    setScreen('session');
    try {
      const end = await runCoach(conv, course, {
        getState: () => stateRef.current!,
        setState,
      });
      if (end.kind === 'failed') setError(end.message);
    } catch (e) {
      setError(`Something went wrong: ${String(e)}`);
    } finally {
      io.dispose();
      convRef.current = null;
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
      setScreen('home');
    }
  }, [course, setState]);

  const updateSettings = (patch: Partial<Settings>) => {
    if (!stateRef.current) return;
    setState({ ...stateRef.current, settings: { ...stateRef.current.settings, ...patch } });
  };

  const pickCourse = (c: Course) => {
    if (!stateRef.current) return;
    setState({ ...stateRef.current, courseId: c.id });
    setScreen('home');
  };

  if (screen === 'session') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar style="light" hidden={!!state?.settings.pocketMode} />
        <SafeAreaView style={{ flex: 1 }}>
          <SessionScreen
            status={status}
            pocketMode={!!state?.settings.pocketMode}
            onPause={() => convRef.current?.pause()}
            onResume={() => convRef.current?.resume()}
            onStop={() => convRef.current?.stop()}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: th.bg }]}>
      <StatusBar style="auto" />
      {screen === 'loading' || !state ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : screen === 'pick' || !course ? (
        <CoursePicker state={state} onPick={pickCourse} />
      ) : (
        <Home
          state={state}
          course={course}
          error={error}
          onStart={start}
          onChangeCourse={() => setScreen('pick')}
          onSettings={updateSettings}
          onOpenSettings={() => Linking.openSettings()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
