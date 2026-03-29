import { type Country, countries } from '../map/countries';
import type { borders } from './borders';

export const countryByName = new Map<string, Country>(
  countries.map((c) => [c.name as keyof typeof borders, c]),
);
