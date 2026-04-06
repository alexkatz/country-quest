import type { Country } from './countries';

export type CenterCountriesHandler = (countries: Country[]) => void;
export type ScaleHandler = (scale: number) => void;

const scaleHandlers = new Set<ScaleHandler>();
const centerHandlers = new Set<CenterCountriesHandler>();

export const globeEvents = {
  sub<TEvent extends 'center' | 'scale'>(
    event: TEvent,
    handler: TEvent extends 'center' ? CenterCountriesHandler : ScaleHandler,
  ) {
    if (event === 'center') {
      centerHandlers.add(handler as CenterCountriesHandler);
    }

    if (event === 'scale') {
      scaleHandlers.add(handler as ScaleHandler);
    }

    return () => {
      if (event === 'center') {
        centerHandlers.delete(handler as CenterCountriesHandler);
      }

      if (event === 'scale') {
        scaleHandlers.delete(handler as ScaleHandler);
      }
    };
  },

  emit<TEvent extends 'center' | 'scale'>(
    event: TEvent,
    payload: TEvent extends 'center' ? Country[] : number,
  ) {
    if (event === 'center') {
      centerHandlers.forEach(handle => handle(payload as Country[]));
    }

    if (event === 'scale') {
      scaleHandlers.forEach(handle => handle(payload as number));
    }
  },
};
