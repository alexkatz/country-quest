import type { Country } from '../map/countries';
import { borders } from './borders';
import { countryByName } from './countryByName';

const hasNeighbors = (name: string) => borders[name]?.length > 0;

const getStartingCountry = (name?: string) => {
  if (name) {
    return name;
  }

  const allCountries = Object.keys(borders).filter(hasNeighbors);
  const randomIndex = Math.floor(Math.random() * allCountries.length);
  return allCountries[randomIndex];
};

type Props = {
  length: number;
  startingCountry?: keyof typeof borders;
};

export const getRandomPath = ({
  length,
  startingCountry,
}: Props): Country[] => {
  const start = getStartingCountry(startingCountry);

  const parent = new Map<string, string | null>([[start, null]]);
  const queue: [string, number][] = [[start, 0]];
  const candidates: string[] = [];

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;

    if (dist === length - 1) {
      candidates.push(current);
      continue;
    }

    const neighbors = [
      ...(borders[current as keyof typeof borders] ?? []),
    ].sort(() => Math.random() - 0.5);

    for (const neighbor of neighbors) {
      if (!parent.has(neighbor)) {
        parent.set(neighbor, current);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  if (candidates.length === 0) {
    // Start country's connected component is smaller than length — retry
    return getRandomPath({ length });
  }

  const end = candidates[Math.floor(Math.random() * candidates.length)];

  const path: string[] = [];
  let node: string | null = end;
  while (node !== null) {
    path.unshift(node);
    node = parent.get(node) ?? null;
  }

  return path.map((name) => countryByName.get(name)!);
};
