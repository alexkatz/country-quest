import type { Country } from '../map/countries';
import { emitCenterCountries } from '../map/globeEvents';

export const createCountryPillEvents = (country: Country) => ({
  onMouseEnter: () => emitCenterCountries([country]),
  onFocus: () => emitCenterCountries([country]),
  onClick: () => emitCenterCountries([country]),
});
