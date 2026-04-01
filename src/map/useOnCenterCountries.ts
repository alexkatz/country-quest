import { geoBounds } from 'd3-geo';
import { useEffectEvent, useEffect } from 'react';
import { DEG, GLOBE_SIZE, MIN_SCALE, lastCenteredCountriesAtom } from './state';
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
    const centerLon = Math.atan2(y, x) / DEG;
    const centerLat = Math.asin(z / mag) / DEG;

    rotX.start(-centerLon);
    rotY.start(-centerLat);

    const centerLonRad = centerLon * DEG;
    const centerLatRad = centerLat * DEG;
    const boundaryPoints = countries.flatMap(country => {
      const [[west, south], [east, north]] = geoBounds(country.feature);
      return [
        [west * DEG, south * DEG],
        [east * DEG, north * DEG],
        [west * DEG, north * DEG],
        [east * DEG, south * DEG],
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
      maxAngDist > 0.01 ? ((GLOBE_SIZE / 2) * 0.6) / Math.sin(maxAngDist) : 500;
    const currentScale = scale.get();
    const newScale =
      currentScale > MAX_CENTER_SCALE
        ? Math.min(currentScale, fitScale)
        : Math.min(MAX_CENTER_SCALE, fitScale);

    scale.start(Math.max(MIN_SCALE, newScale));

    store.set(lastCenteredCountriesAtom, countries);
  }) satisfies CenterCountriesHandler);

  useEffect(() => onCenterCountries(centerCountries), []);
};
