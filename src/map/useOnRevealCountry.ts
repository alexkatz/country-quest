import { useStore } from 'jotai';
import { useEffect } from 'react';
import * as gameState from '../game/state';
import { revealedCountriesAtom } from '../game/state';
import { globeEvents } from './globeEvents';

export const useOnRevealCountry = () => {
  const store = useStore();

  useEffect(() => {
    return store.sub(revealedCountriesAtom, () => {
      const revealedCountries = store.get(revealedCountriesAtom);
      const lastRevealedCountry =
        revealedCountries[revealedCountries.length - 1];
      globeEvents.emit('center', { countries: [lastRevealedCountry] });

      const winningPath = store.get(gameState.winningPathAtom);
      const targetPath = store.get(gameState.targetPathAtom);
      const isRoundComplete = store.get(gameState.isRoundCompleteAtom);
      if (isRoundComplete && winningPath.length === targetPath.length) {
        store.set(gameState.targetPathAtom, winningPath);
      }
    });
  }, [store]);
};
