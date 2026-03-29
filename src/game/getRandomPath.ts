import { borders } from './borders';

const hasNeighbors = (country: string) =>
  borders[country as keyof typeof borders]?.length > 0;

const getStartingCountry = (startingCountry?: keyof typeof borders) => {
  if (startingCountry) {
    return startingCountry;
  }

  const allCountries = Object.keys(borders).filter(hasNeighbors);
  const randomIndex = Math.floor(Math.random() * allCountries.length);
  return allCountries[randomIndex] as keyof typeof borders;
};

const findPath = (currentPath: string[], length: number): string[] | null => {
  if (currentPath.length >= length) {
    return currentPath;
  }

  const lastCountry = currentPath[currentPath.length - 1];
  const neighbors = borders[lastCountry as keyof typeof borders].filter(
    (country) => !currentPath.includes(country) && hasNeighbors(country),
  );

  if (neighbors.length === 0) {
    return null;
  }

  // Shuffle so each attempt explores neighbors in a different order
  const shuffled = [...neighbors].sort(() => Math.random() - 0.5);

  for (const nextCountry of shuffled) {
    const result = findPath([...currentPath, nextCountry], length);
    if (result !== null) return result;
  }

  // All neighbors led to dead ends — backtrack
  return null;
};

type Props = {
  length: number;
  startingCountry?: keyof typeof borders;
};

export const getRandomPath = ({ length, startingCountry }: Props): string[] => {
  const start = getStartingCountry(startingCountry);
  const result = findPath([start], length);

  if (result === null) {
    // Start country is in a connected component smaller than length — retry with a different one
    return getRandomPath({ length });
  }

  return result;
};
