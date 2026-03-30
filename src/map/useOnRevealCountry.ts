import { useStore } from 'jotai';
import { useEffect } from 'react';
import {
  endCountryAtom,
  revealedCountriesAtom,
  startCountryAtom,
} from '../game/state';
import { emitCenterCountries } from './globeEvents';

export const useOnRevealCountry = () => {
  const store = useStore();

  useEffect(() => {
    return store.sub(revealedCountriesAtom, () => {
      const startCountry = store.get(startCountryAtom);
      const endCountry = store.get(endCountryAtom);
      emitCenterCountries([startCountry, endCountry]);
    });
  }, [store]);
};
