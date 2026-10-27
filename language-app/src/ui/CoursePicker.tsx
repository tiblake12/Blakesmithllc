import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COURSES, type Course } from '../content';
import { percentComplete, type AppState } from '../core/progress';
import { font, useTheme } from './theme';

export function CoursePicker({ state, onPick }: { state: AppState; onPick: (c: Course) => void }) {
  const th = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={[font.title, { color: th.text, textAlign: 'center' }]}>What do you want to learn?</Text>
      <Text style={[font.body, styles.lead, { color: th.muted }]}>
        Lessons happen by voice. Put in your earphones, tap Start, and keep your eyes free.
      </Text>
      {COURSES.map((c) => {
        const started = !!state.courses[c.id];
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Learn ${c.name}`}
            onPress={() => onPick(c)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: th.surface, borderColor: pressed ? th.accent : th.border },
            ]}
          >
            <Text style={styles.flag}>{c.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[font.h2, { color: th.text }]}>{c.name}</Text>
              <Text style={[font.small, { color: th.muted }]}>
                {started ? `${percentComplete(state, c)}% complete` : c.native}
              </Text>
            </View>
            <Text style={{ color: th.muted, fontSize: 24 }}>›</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 40, gap: 14 },
  lead: { textAlign: 'center', marginBottom: 12, lineHeight: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
  },
  flag: { fontSize: 40 },
});
