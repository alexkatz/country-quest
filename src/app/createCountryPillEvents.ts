import type { Country } from '../map/countries';
import { globeEvents } from '../map/globeEvents';

export const createCountryPillEvents = (country: Country) => ({
  onMouseEnter: () => globeEvents.emit('center', { countries: [country] }),
  onFocus: () => globeEvents.emit('center', { countries: [country] }),
  onClick: () => globeEvents.emit('center', { countries: [country] }),
});
