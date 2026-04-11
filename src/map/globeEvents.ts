import type { Country } from './countries';

export type CenterCountriesHandler = (props: {
  countries: Country[];
  scaleToFit?: true;
}) => void;

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
    payload: TEvent extends 'center'
      ? Parameters<CenterCountriesHandler>[0]
      : Parameters<ScaleHandler>[0],
  ) {
    if (event === 'center') {
      centerHandlers.forEach(handle =>
        handle(payload as Parameters<CenterCountriesHandler>[0]),
      );
    }

    if (event === 'scale') {
      scaleHandlers.forEach(handle =>
        handle(payload as Parameters<ScaleHandler>[0]),
      );
    }
  },
};
