import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Course } from '../content';
import {
  checkpointPassed,
  checkpointUnlocked,
  currentStreak,
  DAILY_GOAL,
  describe,
  dueWords,
  learnedWords,
  lessonDone,
  lessonUnlocked,
  percentComplete,
  recommend,
  todayXp,
  type AppState,
  type Settings,
} from '../core/progress';
import { font, useTheme } from './theme';

interface Props {
  state: AppState;
  course: Course;
  error: string | null;
  onStart: () => void;
  onChangeCourse: () => void;
  onSettings: (s: Partial<Settings>) => void;
  onOpenSettings: () => void;
}

export function Home({ state, course, error, onStart, onChangeCourse, onSettings, onOpenSettings }: Props) {
  const th = useTheme();
  const next = recommend(state, course);
  const xp = todayXp(state.stats);
  const goalPct = Math.min(100, Math.round((xp / DAILY_GOAL) * 100));
  const due = dueWords(state, course).length;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onChangeCourse} accessibilityRole="button" accessibilityLabel="Change language" style={styles.courseBtn}>
          <Text style={{ fontSize: 30 }}>{course.flag}</Text>
          <View>
            <Text style={[font.h2, { color: th.text }]}>{course.name} ▾</Text>
            <Text style={[font.small, { color: th.muted }]}>{percentComplete(state, course)}% complete</Text>
          </View>
        </Pressable>
        <View style={styles.stats}>
          <Chip th={th} label={`🔥 ${currentStreak(state.stats)}`} a11y="day streak" />
          <Chip th={th} label={`⚡ ${state.stats.xp}`} a11y="total XP" />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: th.surface, borderColor: th.border }]}>
        <View style={styles.row}>
          <Text style={[font.body, { color: th.text, fontWeight: '700' }]}>Today’s goal</Text>
          <Text style={[font.small, { color: th.muted }]}>
            {xp} / {DAILY_GOAL} XP
          </Text>
        </View>
        <View style={[styles.bar, { backgroundColor: th.surface2 }]}>
          <View style={[styles.barFill, { width: `${goalPct}%`, backgroundColor: th.primary }]} />
        </View>
      </View>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel={`Start talking. Next: ${describe(next)}`}
        style={({ pressed }) => [styles.start, { backgroundColor: th.accent, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.startIcon}>🎧</Text>
        <Text style={styles.startText}>Start</Text>
      </Pressable>
      <Text style={[font.body, styles.center, { color: th.text, fontWeight: '600' }]}>Next: {capitalise(describe(next))}</Text>
      <Text style={[font.small, styles.center, { color: th.muted }]}>
        Tap once, then everything happens by voice. Earphones work best.
        {due ? ` ${due} word${due === 1 ? '' : 's'} due for review.` : ''}
      </Text>

      {error ? (
        <View style={[styles.card, { backgroundColor: th.surface, borderColor: th.bad }]}>
          <Text style={[font.body, { color: th.bad }]}>{error}</Text>
          <Pressable onPress={onOpenSettings} accessibilityRole="button" style={styles.linkBtn}>
            <Text style={{ color: th.accent, fontWeight: '700' }}>Open phone settings</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: th.surface, borderColor: th.border }]}>
        <SettingRow
          th={th}
          title="Pocket mode"
          detail="Blacks out the screen during lessons and ignores touches, so the phone can go in your pocket. Hold the screen to show controls."
          value={state.settings.pocketMode}
          onChange={(v) => onSettings({ pocketMode: v })}
        />
        <View style={[styles.divider, { backgroundColor: th.border }]} />
        <SettingRow
          th={th}
          title="Slow speech"
          detail="Speak new words more slowly. You can also say “slower” during a lesson."
          value={state.settings.slow}
          onChange={(v) => onSettings({ slow: v })}
        />
      </View>

      <Text style={[font.h2, { color: th.text, marginTop: 8 }]}>Your course</Text>
      {course.units.map((unit) => (
        <View key={unit.index} style={[styles.card, { backgroundColor: th.surface, borderColor: th.border, gap: 8 }]}>
          <Text style={[font.small, { color: th.accent, fontWeight: '800', letterSpacing: 1 }]}>UNIT {unit.index + 1}</Text>
          <Text style={[font.body, { color: th.text, fontWeight: '700' }]}>{unit.title}</Text>
          {unit.lessons.map((l) => {
            const done = lessonDone(state, course, l);
            const open = lessonUnlocked(state, course, l);
            return (
              <Text key={l.key} style={[font.small, { color: open ? th.text : th.muted }]}>
                {done ? '✅' : open ? '⭕️' : '🔒'}  {l.title}
                {done ? `  ·  best ${state.courses[course.id]?.lessons[l.key]}%` : ''}
              </Text>
            );
          })}
          <Text style={[font.small, { color: checkpointUnlocked(state, course, unit) ? th.text : th.muted }]}>
            {checkpointPassed(state, course, unit) ? '🏆' : checkpointUnlocked(state, course, unit) ? '🏁' : '🔒'}  Checkpoint
          </Text>
        </View>
      ))}
      <Text style={[font.small, styles.center, { color: th.muted, marginBottom: 24 }]}>
        {learnedWords(state, course).length} words learned
      </Text>
    </ScrollView>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Chip({ th, label, a11y }: { th: ReturnType<typeof useTheme>; label: string; a11y: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: th.surface2 }]} accessibilityLabel={`${label.slice(2)} ${a11y}`}>
      <Text style={{ color: th.text, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function SettingRow(props: {
  th: ReturnType<typeof useTheme>;
  title: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { th } = props;
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={[font.body, { color: th.text, fontWeight: '600' }]}>{props.title}</Text>
        <Text style={[font.small, { color: th.muted }]}>{props.detail}</Text>
      </View>
      <Switch value={props.value} onValueChange={props.onChange} accessibilityLabel={props.title} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stats: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bar: { height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  barFill: { height: '100%', borderRadius: 6 },
  start: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  startIcon: { fontSize: 54 },
  startText: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  center: { textAlign: 'center' },
  linkBtn: { marginTop: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: 1, marginVertical: 12 },
});
