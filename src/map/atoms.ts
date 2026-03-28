import { atom } from 'jotai';
import type { Country } from './countries';

export const revealedCountriesAtom = atom<Country[]>([]);
export const showAllNamesAtom = atom(false);
export const showAllCountriesAtom = atom(false);
