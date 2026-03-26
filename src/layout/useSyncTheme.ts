import { useStore } from 'jotai';
import { useEffect } from 'react';
import { themeAtom } from './themeAtom';

export const useSyncTheme = () => {
  const store = useStore();

  useEffect(() => {
    return store.sub(themeAtom, () => {
      const theme = store.get(themeAtom);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    });
  });
};
