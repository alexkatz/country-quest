import { atom } from 'jotai';
import type { Country } from './countries';

// TODO: remove this, now governed by game logic elsewhere
export const revealedCountriesAtom = atom<Country[]>([]);

export const showAllNamesAtom = atom(false);
export const showAllCountriesAtom = atom(false);

export const hoveredIdAtom = atom<string | undefined>();
export const lastCenteredCountriesAtom = atom<Country[] | undefined>();
