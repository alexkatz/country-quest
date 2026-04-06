import { useStore } from 'jotai';
import { useEffect } from 'react';
import { revealedCountriesAtom } from '../game/state';
import { globeEvents } from './globeEvents';

export const useOnRevealCountry = () => {
  const store = useStore();

  useEffect(() => {
    return store.sub(revealedCountriesAtom, () => {
      const revealedCountries = store.get(revealedCountriesAtom);
      const lastRevealedCountry =
        revealedCountries[revealedCountries.length - 1];
      globeEvents.emit('center', [lastRevealedCountry]);
    });
  }, [store]);
};
