import { atom } from 'jotai';
import { getRandomPath } from './getRandomPath';
import type { Country } from '../map/countries';

const INITIAL_MAX_PATH_SIZE = 5;
const INITIAL_PATH = getRandomPath({ length: INITIAL_MAX_PATH_SIZE });

export const showDebugInfoAtom = atom(true);

export const roundAtom = atom(1);
export const maxPathSizeAtom = atom(INITIAL_MAX_PATH_SIZE);

export const startCountryAtom = atom(INITIAL_PATH.at(0)!);
export const endCountryAtom = atom(INITIAL_PATH.at(-1)!);

export const guessedCountriesAtom = atom<Country[]>([]);

export const showAllNamesAtom = atom(false);
export const showAllCountriesAtom = atom(false);
