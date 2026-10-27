import { useColorScheme } from 'react-native';

const light = {
  bg: '#faf7f5',
  surface: '#ffffff',
  surface2: '#f3eeea',
  text: '#2b2320',
  muted: '#7a6d67',
  border: '#e6ddd7',
  accent: '#f05f44',
  primary: '#2f8f6b',
  good: '#1f7a56',
  bad: '#c0392b',
  gold: '#e8a317',
};

const dark: typeof light = {
  bg: '#1b1716',
  surface: '#262120',
  surface2: '#322b29',
  text: '#f3ece8',
  muted: '#a89a93',
  border: '#3d3532',
  accent: '#f26d55',
  primary: '#3fae85',
  good: '#7fd8b1',
  bad: '#ff8a78',
  gold: '#ffc865',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const font = {
  title: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 16 },
  small: { fontSize: 14 },
};
