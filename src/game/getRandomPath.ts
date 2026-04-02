import type { Country } from '../map/countries';
import { borders } from './borders';
import { countryByName } from './countryByName';
import { getNeighbors } from './getNeighbors';

const hasNeighbors = (name: string) => borders[name]?.length > 0;

const ensureStartingCountry = (startingCountry?: Country) => {
  if (startingCountry) {
    return startingCountry;
  }

  const allCountries = Object.keys(borders).filter(hasNeighbors);
  const randomIndex = Math.floor(Math.random() * allCountries.length);
  return countryByName.get(allCountries[randomIndex])!;
};

export const getRandomPath = (props: {
  length: number;
  startingCountry?: Country;
}): Country[] => {
  const start = ensureStartingCountry(props.startingCountry);
  const visited = new Map<Country, Country | null>([[start, null]]);
  const endCandidates = [] as Country[];
  const queue = [[start, 0]] as [Country, number][];

  while (queue.length > 0) {
    const [current, distance] = queue.shift()!;

    // if we've reached the desired path length, add the current country to the list of potential end countries
    if (distance === props.length - 1) {
      endCandidates.push(current);
      continue;
    }

    // choose neighbors in random order, this is where the randomness of the path is introduced
    const neighbors = getNeighbors(current).toSorted(() => Math.random() - 0.5);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, current);
        queue.push([neighbor, distance + 1]);
      }
    }
  }

  // Start country's connected component is smaller than length — retry
  if (endCandidates.length === 0) {
    return getRandomPath({ length: props.length });
  }

  const end = endCandidates[Math.floor(Math.random() * endCandidates.length)];
  const path = [] as Country[];
  let current: Country | null = end;

  while (current) {
    path.unshift(current);
    current = visited.get(current) ?? null;
  }

  return path;
};
