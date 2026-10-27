import AsyncStorage from '@react-native-async-storage/async-storage';
import { freshState, type AppState } from '../core/progress';

const KEY = 'lingua-voice-progress-v2';

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 2) {
        const fresh = freshState();
        return { ...fresh, ...s, settings: { ...fresh.settings, ...s.settings }, stats: { ...fresh.stats, ...s.stats } };
      }
    }
  } catch {
    /* corrupt or unavailable: start fresh */
  }
  return freshState();
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore; progress is kept in memory for this run */
  }
}
