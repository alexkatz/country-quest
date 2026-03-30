import { useGesture } from '@use-gesture/react';
import { useStore } from 'jotai';
import {
  DEFAULT_SCALE,
  GLOBE_SIZE,
  hoveredCountryAtom,
  lastCenteredCountriesAtom,
  mouseGlobePosAtom,
  MAX_SCALE,
  MIN_SCALE,
  ROTATION_SENSITIVITY,
  ZOOM_SENSITIVITY,
} from './state';
import type { SpringValue } from '@react-spring/web';
import type { RefObject } from 'react';
import { geoContains, geoOrthographic } from 'd3-geo';
import { countryGeoData, type Country } from './countries';
import {
  endCountryAtom,
  guessedCountriesAtom,
  showAllCountriesAtom,
  startCountryAtom,
} from '../game/state';
import { countryByName } from '../game/countryByName';

type Props = {
  rotX: SpringValue<number>;
  rotY: SpringValue<number>;
  rotZ: SpringValue<number>;
  scale: SpringValue<number>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export const useMapGestures = ({
  rotX,
  rotY,
  rotZ,
  scale,
  canvasRef,
}: Props) => {
  const store = useStore();
  return useGesture(
    {
      onDrag({ movement: [mx, my], memo, tap, first }) {
        if (tap) return;

        store.set(lastCenteredCountriesAtom, undefined);
        store.set(hoveredCountryAtom, undefined);

        const start = first
          ? [rotX.get(), rotY.get(), rotZ.get()]
          : (memo as [number, number, number]);

        const scaledRotationSensitivity =
          ROTATION_SENSITIVITY * (DEFAULT_SCALE / scale.get());

        rotX.start(start[0] + mx * scaledRotationSensitivity);

        rotY.start(
          Math.max(
            -90,
            Math.min(90, start[1] - my * scaledRotationSensitivity),
          ),
        );

        rotZ.start(start[2]);

        return start;
      },

      onWheel({ delta: [, dy] }) {
        scale.start(
          Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, scale.get() - dy * ZOOM_SENSITIVITY),
          ),
        );
      },

      onMouseMove({ event }) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const cssWidth = rect.width;
        const cssHeight = rect.height;
        const displaySize = Math.min(cssWidth, cssHeight);
        const offsetX = (cssWidth - displaySize) / 2;
        const offsetY = (cssHeight - displaySize) / 2;
        const globeScale = GLOBE_SIZE / displaySize;

        const mx = (event.clientX - rect.left - offsetX) * globeScale;
        const my = (event.clientY - rect.top - offsetY) * globeScale;

        const rx = rotX.get();
        const ry = rotY.get();
        const rz = rotZ.get();
        const s = scale.get();

        const projection = geoOrthographic()
          .scale(s)
          .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
          .rotate([rx, ry, rz]);

        const lonLat = projection.invert?.([mx, my]);
        const guessed = store.get(guessedCountriesAtom);
        const showAll = store.get(showAllCountriesAtom);
        const startCountry = store.get(startCountryAtom);
        const endCountry = store.get(endCountryAtom);

        let found: Country | undefined;
        if (lonLat) {
          for (let i = countryGeoData.features.length - 1; i >= 0; i--) {
            const feature = countryGeoData.features[i];
            const isGuessed = guessed.some(c => c.id === feature.id);
            const isTerminal =
              feature.id === startCountry?.id || feature.id === endCountry?.id;
            if (!showAll && !isGuessed && !isTerminal) continue;
            if (geoContains(feature, lonLat)) {
              found = countryByName.get(feature.properties.name);
              break;
            }
          }
        }

        store.set(mouseGlobePosAtom, [mx, my]);

        if (found !== store.get(hoveredCountryAtom)) {
          store.set(hoveredCountryAtom, found);
          if (found) {
            store.set(lastCenteredCountriesAtom, undefined);
          }
        }
      },

      onMouseLeave() {
        store.set(hoveredCountryAtom, undefined);
        store.set(mouseGlobePosAtom, undefined);
      },
    },
    { drag: { filterTaps: true } },
  );
};
