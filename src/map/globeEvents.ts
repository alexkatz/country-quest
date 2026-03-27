import type { Country } from './countries';

export type CenterCountriesHandler = (countries: Country[]) => void;
const centerHandlers = new Set<CenterCountriesHandler>();

export const onCenterCountries = (handler: CenterCountriesHandler) => {
  centerHandlers.add(handler);
  return () => {
    centerHandlers.delete(handler);
  };
};

export const emitCenterCountries = (countries: Country[]) => {
  centerHandlers.forEach((h) => h(countries));
};
