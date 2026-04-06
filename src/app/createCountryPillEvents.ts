import type { Country } from '../map/countries';
import { globeEvents } from '../map/globeEvents';

export const createCountryPillEvents = (country: Country) => ({
  onMouseEnter: () => globeEvents.emit('center', [country]),
  onFocus: () => globeEvents.emit('center', [country]),
  onClick: () => globeEvents.emit('center', [country]),
});
