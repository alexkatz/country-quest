import { atom } from 'jotai';
import { getRandomPath } from './getRandomPath';
import { atomWithStorage } from 'jotai/utils';
import { getConnectedGroup } from './getConnectedGroup';
import type { Country } from '../map/countries';

const INITIAL_MAX_PATH_SIZE = 5;
const INITIAL_PATH = getRandomPath({ length: INITIAL_MAX_PATH_SIZE });

export const showDebugInfoAtom = atom(true);

export const roundAtom = atom(1);
export const maxPathSizeAtom = atom(INITIAL_MAX_PATH_SIZE);

export const startCountryAtom = atom(INITIAL_PATH.at(0)!);
export const endCountryAtom = atom(INITIAL_PATH.at(-1)!);
export const currentPathAtom = atom(INITIAL_PATH);
export const revealedCountriesAtom = atom<Country[]>([]);

// computes the set of revealed countries that are connected to either the start or end country
export const connectedRevealedCountriesAtom = atom(get => {
  const revealed = get(revealedCountriesAtom);
  const start = get(startCountryAtom);
  const end = get(endCountryAtom);

  if (revealed.length === 0) return [];

  return [
    ...new Set([
      ...getConnectedGroup(start, revealed),
      ...getConnectedGroup(end, revealed),
    ]),
  ];
});

// when start and end countries are contiguously connected via revealed countries, the round is complete
export const isRoundCompleteAtom = atom(get => {
  const start = get(startCountryAtom);
  const end = get(endCountryAtom);
  const connectedRevealed = get(connectedRevealedCountriesAtom);
  return getConnectedGroup(start, connectedRevealed).includes(end);
});

export const showAllNamesAtom = atomWithStorage(
  'show-all-names',
  false,
  undefined,
  { getOnInit: true },
);
export const showAllCountriesAtom = atomWithStorage(
  'show-all-countries',
  false,
  undefined,
  { getOnInit: true },
);
