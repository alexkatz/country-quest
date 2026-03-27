import { atom } from 'jotai';
import type { Country } from './countries';

export const revealedCountriesAtom = atom<Country[]>([]);
export const showAllCountriesAtom = atom(true);
