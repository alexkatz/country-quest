import type { Country } from '../map/countries';
import { borders } from './borders';

export const getIsContiguous = (a: Country, b: Country) => {
  return borders[a.name]?.includes(b.name) ?? false;
};
