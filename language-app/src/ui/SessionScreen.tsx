import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Status } from '../core/session';
import { font } from './theme';

interface Props {
  status: Status;
  pocketMode: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const PHASE: Record<Status['phase'], { icon: string; label: string; color: string }> = {
  speaking: { icon: '🔊', label: 'Coach is speaking', color: '#3f7fd9' },
  listening: { icon: '🎙️', label: 'Your turn: speak now', color: '#f05f44' },
  paused: { icon: '⏸', label: 'Paused', color: '#a89a93' },
  idle: { icon: '…', label: 'Getting ready', color: '#a89a93' },
};

/** The session is designed to be heard, not watched: big, glanceable, dark. */
export function SessionScreen({ status, pocketMode, onPause, onResume, onStop }: Props) {
  const [showControls, setShowControls] = useState(!pocketMode);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse] = useState(() => new Animated.Value(1));
  const phase = PHASE[status.phase];

  useEffect(() => {
    if (status.phase !== 'listening') {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status.phase, pulse]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const reveal = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (pocketMode) hideTimer.current = setTimeout(() => setShowControls(false), 8000);
  };

  if (pocketMode && !showControls) {
    // Black screen that ignores taps; a long press shows the controls.
    return (
      <Pressable
        style={styles.pocket}
        onLongPress={reveal}
        delayLongPress={800}
        accessibilityLabel="Pocket mode. Long press to show controls."
      >
        <Text style={styles.pocketText}>Pocket mode · hold to show controls</Text>
      </Pressable>
    );
  }

  const progress = status.progress;
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={[font.body, styles.title]} numberOfLines={1}>
          {status.title ?? 'Lingua'}
        </Text>
        {progress && progress.total > 0 ? (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${(progress.done / progress.total) * 100}%` }]} />
          </View>
        ) : null}
      </View>

      <View style={styles.middle}>
        <Animated.View style={[styles.orb, { borderColor: phase.color, transform: [{ scale: pulse }] }]}>
          <Text style={styles.orbIcon}>{phase.icon}</Text>
        </Animated.View>
        <Text style={[styles.phase, { color: phase.color }]} accessibilityLiveRegion="polite">
          {phase.label}
        </Text>
        <Text style={styles.caption}>{status.caption}</Text>
        {status.heard ? <Text style={styles.heard}>You said: “{status.heard}”</Text> : null}
      </View>

      <View style={styles.controls}>
        {status.phase === 'paused' ? (
          <Btn label="Resume" color="#2f8f6b" onPress={onResume} />
        ) : (
          <Btn label="Pause" color="#4a4240" onPress={onPause} />
        )}
        <Btn label="Stop" color="#c0392b" onPress={onStop} />
      </View>
      {pocketMode ? (
        <Pressable onPress={() => setShowControls(false)} style={styles.hide}>
          <Text style={styles.hideText}>Back to pocket mode</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Btn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { backgroundColor: color, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pocket: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  pocketText: { color: '#3a3a3a', fontSize: 13 },
  wrap: { flex: 1, backgroundColor: '#141110', padding: 20 },
  top: { gap: 10 },
  title: { color: '#a89a93', fontWeight: '700', textAlign: 'center' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#322b29', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#3fae85' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#201b1a',
  },
  orbIcon: { fontSize: 64 },
  phase: { fontSize: 22, fontWeight: '800' },
  caption: { color: '#f3ece8', fontSize: 22, lineHeight: 30, textAlign: 'center', fontWeight: '600' },
  heard: { color: '#a89a93', fontSize: 17, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 14 },
  btn: { flex: 1, paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hide: { alignItems: 'center', paddingTop: 14 },
  hideText: { color: '#7a6d67', fontSize: 14 },
});
