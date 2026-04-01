import type { Country } from '../map/countries';
import { borders } from './borders';
import { countryByName } from './countryByName';

export const getNeighbors = (country: Country | string): Country[] => {
  return (
    borders[typeof country === 'string' ? country : country.name]?.map(
      name => countryByName.get(name)!,
    ) ?? []
  );
};
