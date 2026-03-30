import { useStore } from 'jotai';
import { useEffect } from 'react';
import {
  endCountryAtom,
  guessedCountriesAtom,
  startCountryAtom,
} from '../game/state';
import { emitCenterCountries } from './globeEvents';

export const useOnGuessCountry = () => {
  const store = useStore();

  useEffect(() => {
    return store.sub(guessedCountriesAtom, () => {
      const startCountry = store.get(startCountryAtom);
      const endCountry = store.get(endCountryAtom);
      const guessedCountries = store.get(guessedCountriesAtom);
      emitCenterCountries([startCountry, endCountry, ...guessedCountries]);
    });
  }, [store]);
};
