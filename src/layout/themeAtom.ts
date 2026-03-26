import { atomWithStorage } from 'jotai/utils';

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

const init = (): Theme => {
  const currentTheme =
    (JSON.parse(localStorage.getItem(THEME_KEY) ?? 'null') as Theme | null) ??
    'light';

  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  return currentTheme;
};

export const themeAtom = atomWithStorage<Theme>(THEME_KEY, init());
