import { geoBounds } from 'd3-geo';
import { useEffectEvent, useEffect } from 'react';
import * as mapState from './state';
import { type CenterCountriesHandler, onCenterCountries } from './globeEvents';
import type { SpringValue } from '@react-spring/web';
import { useStore } from 'jotai';

type Props = {
  rotX: SpringValue<number>;
  rotY: SpringValue<number>;
  scale: SpringValue<number>;
};

export const useOnCenterCountries = ({ rotX, rotY, scale }: Props) => {
  const store = useStore();

  const centerCountries = useEffectEvent((countries => {
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

    const MAX_CENTER_SCALE = 400;
    const fitScale =
      maxAngDist > 0.01
        ? ((mapState.GLOBE_SIZE / 2) * 0.6) / Math.sin(maxAngDist)
        : 500;
    const currentScale = scale.get();
    const newScale =
      currentScale > MAX_CENTER_SCALE
        ? Math.min(currentScale, fitScale)
        : Math.min(MAX_CENTER_SCALE, fitScale);

    scale.start(Math.max(mapState.MIN_SCALE, newScale));

    store.set(mapState.lastCenteredCountriesAtom, countries);
  }) satisfies CenterCountriesHandler);

  useEffect(() => onCenterCountries(centerCountries), []);
};
