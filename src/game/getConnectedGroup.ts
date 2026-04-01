import type { Country } from '../map/countries';
import { getNeighbors } from './getNeighbors';

// returns the subset of `countries` that are in the same contiguous group as `startCountry`
// includes `startCountry` itself in the result
export const getConnectedGroup = (
  startCountry: Country,
  countries: Country[],
): Country[] => {
  const countriesSet = new Set(countries);
  const group = new Set([startCountry]);
  const queue = [startCountry];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of getNeighbors(current)) {
      if (countriesSet.has(neighbor) && !group.has(neighbor)) {
        group.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return [...group];
};

export const areCountriesConnected = (countries: Country[]): boolean => {
  if (countries.length <= 1) return true;
  return getConnectedGroup(countries[0], countries).length === countries.length;
};
