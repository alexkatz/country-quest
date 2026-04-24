import { atom } from 'jotai';
import { getRandomPath } from './getRandomPath';
import { atomWithStorage } from 'jotai/utils';
import { getConnectedGroup } from './getConnectedGroup';
import type { Country } from '../map/countries';
import { getNeighbors } from './getNeighbors';

export const INITIAL_MIN_PATH_SIZE = 5;
export const INITIAL_MAX_PATH_SIZE = 5;

const INITIAL_PATH = getRandomPath({
  length:
    INITIAL_MIN_PATH_SIZE +
    Math.floor(
      Math.random() * (INITIAL_MAX_PATH_SIZE - INITIAL_MIN_PATH_SIZE + 1),
    ),
});

export const showDebugInfoAtom = atom(false);
export const showHelpAtom = atomWithStorage('show-help', true, undefined, {
  getOnInit: true,
});

export const roundAtom = atom(1);
export const maxPathSizeAtom = atom(INITIAL_MAX_PATH_SIZE);
export const termAtom = atom('');
export const startCountryAtom = atom(INITIAL_PATH.at(0)!);
export const endCountryAtom = atom(INITIAL_PATH.at(-1)!);
export const targetPathAtom = atom(INITIAL_PATH);
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

export const winningPathAtom = atom(get => {
  const isRoundComplete = get(isRoundCompleteAtom);
  if (!isRoundComplete) return [];

  // find shortest path between start and end within revealed using BFS

  const revealed = get(connectedRevealedCountriesAtom);
  const start = get(startCountryAtom);
  const end = get(endCountryAtom);

  const visited = new Map<Country, Country | null>([[start, null]]);
  const queue = [start];

  while (queue.length > 0) {
    let current = queue.shift()!;
    if (current === end) {
      const path = [] as Country[];
      while (current) {
        path.unshift(current);
        current = visited.get(current)!;
      }

      return path;
    }

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      // only consider neighbors that are revealed and haven't been visited yet
      if (!visited.has(neighbor) && revealed.includes(neighbor)) {
        visited.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return [];
});

export const currentRoundSummary = atom(get => {
  if (!get(isRoundCompleteAtom)) return null;
  const target = get(targetPathAtom).length - 2;
  const revealed = get(revealedCountriesAtom).length;
  return { revealed, target };
});

export const revealedOffWinningPathAtom = atom(get => {
  if (!get(isRoundCompleteAtom)) return [];
  const revealed = get(revealedCountriesAtom);
  const winningPath = get(winningPathAtom);
  return revealed.filter(c => !winningPath.includes(c));
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
