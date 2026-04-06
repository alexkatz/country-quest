import { geoBounds } from 'd3-geo';
import { useEffectEvent, useEffect } from 'react';
import * as mapState from './state';
import { type CenterCountriesHandler, globeEvents } from './globeEvents';
import type { SpringValue } from '@react-spring/web';
import { useStore } from 'jotai';

type Props = {
  rotX: SpringValue<number>;
  rotY: SpringValue<number>;
  scale: SpringValue<number>;
};

export const useOnGlobeEvents = ({ rotX, rotY, scale }: Props) => {
  const store = useStore();

  const centerCountries = useEffectEvent((({ countries, scaleToFit }) => {
    let x = 0,
      y = 0,
      z = 0;
    for (const country of countries) {
      const [lonRad, latRad] = country.centroid;
      x += Math.cos(latRad) * Math.cos(lonRad);
      y += Math.cos(latRad) * Math.sin(lonRad);
      z += Math.sin(latRad);
    }

    const mag = Math.sqrt(x * x + y * y + z * z);
    const centerLon = Math.atan2(y, x) / mapState.DEG;
    const centerLat = Math.asin(z / mag) / mapState.DEG;

    rotX.start(-centerLon);
    rotY.start(-centerLat);

    if (scaleToFit) {
      const centerLonRad = centerLon * mapState.DEG;
      const centerLatRad = centerLat * mapState.DEG;
      const boundaryPoints = countries.flatMap(country => {
        const [[west, south], [east, north]] = geoBounds(country.feature);
        return [
          [west * mapState.DEG, south * mapState.DEG],
          [east * mapState.DEG, north * mapState.DEG],
          [west * mapState.DEG, north * mapState.DEG],
          [east * mapState.DEG, south * mapState.DEG],
        ] as [number, number][];
      });

      let maxAngDist = 0;
      for (const [lonRad, latRad] of boundaryPoints) {
        const dot = Math.max(
          -1,
          Math.min(
            1,
            Math.sin(latRad) * Math.sin(centerLatRad) +
              Math.cos(latRad) *
                Math.cos(centerLatRad) *
                Math.cos(lonRad - centerLonRad),
          ),
        );
        maxAngDist = Math.max(maxAngDist, Math.acos(dot));
      }

      const fitScale =
        maxAngDist > 0.01
          ? ((mapState.GLOBE_SIZE / 2) * 0.6) / Math.sin(maxAngDist)
          : mapState.MAX_SCALE;

      scale.start(
        Math.max(mapState.MIN_SCALE, Math.min(scale.get(), fitScale)),
      );
    }

    store.set(mapState.lastCenteredCountriesAtom, countries);
  }) satisfies CenterCountriesHandler);

  const zoomStep = useEffectEvent((delta: number) => {
    scale.start(
      Math.max(
        mapState.MIN_SCALE,
        Math.min(mapState.MAX_SCALE, scale.get() + delta),
      ),
    );
  });

  useEffect(() => globeEvents.sub('center', centerCountries), []);
  useEffect(() => globeEvents.sub('scale', zoomStep), []);
};
