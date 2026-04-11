import { useGesture } from '@use-gesture/react';
import { useStore } from 'jotai';
import * as mapState from './state';
import type { SpringValue } from '@react-spring/web';
import type { RefObject } from 'react';
import { geoContains, geoOrthographic, geoPath, geoCentroid } from 'd3-geo';
import { countries, type Country } from './countries';

const smallCountryIds = new Set<string>(
  (() => {
    const pathGen = geoPath(
      geoOrthographic()
        .scale(mapState.DEFAULT_SCALE)
        .translate([mapState.GLOBE_SIZE / 2, mapState.GLOBE_SIZE / 2]),
    );
    return countries.filter(c => pathGen.area(c.feature) < 2).map(c => c.id);
  })(),
);
import * as gameState from '../game/state';
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
      onDrag({ movement: [mx, my], pinching, memo, tap, first }) {
        if (tap || pinching) return;

        store.set(mapState.lastCenteredCountriesAtom, undefined);
        store.set(mapState.hoveredCountryAtom, undefined);

        const start = first
          ? [rotX.get(), rotY.get(), rotZ.get()]
          : (memo as [number, number, number]);

        const scaledRotationSensitivity =
          mapState.ROTATION_SENSITIVITY *
          (mapState.DEFAULT_SCALE / scale.get());

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
            mapState.MIN_SCALE,
            Math.min(
              mapState.MAX_SCALE,
              scale.get() - dy * mapState.ZOOM_SENSITIVITY,
            ),
          ),
        );
      },

      onPinch({ delta: [dx] }) {
        scale.start(
          Math.max(
            mapState.MIN_SCALE,
            Math.min(
              mapState.MAX_SCALE,
              scale.get() + dx * mapState.PINCH_ZOOM_SENSITIVITY,
            ),
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
        const globeScale = mapState.GLOBE_SIZE / displaySize;

        const mx = (event.clientX - rect.left - offsetX) * globeScale;
        const my = (event.clientY - rect.top - offsetY) * globeScale;

        const rx = rotX.get();
        const ry = rotY.get();
        const rz = rotZ.get();
        const s = scale.get();

        const projection = geoOrthographic()
          .scale(s)
          .translate([mapState.GLOBE_SIZE / 2, mapState.GLOBE_SIZE / 2])
          .rotate([rx, ry, rz]);

        const lonLat = projection.invert?.([mx, my]);
        const isRoundComplete = store.get(gameState.isRoundCompleteAtom);
        const revealed = store.get(gameState.revealedCountriesAtom);
        const showAll = isRoundComplete
          ? true
          : store.get(gameState.showAllCountriesAtom);
        const startCountry = store.get(gameState.startCountryAtom);
        const endCountry = store.get(gameState.endCountryAtom);

        let found: Country | undefined;
        if (lonLat) {
          for (let i = countries.length - 1; i >= 0; i--) {
            const feature = countries[i].feature;
            const isRevealed = revealed.some(c => c.id === feature.id);
            const isTerminal =
              feature.id === startCountry?.id || feature.id === endCountry?.id;
            if (!showAll && !isRevealed && !isTerminal) continue;
            if (geoContains(feature, lonLat)) {
              found = countryByName.get(feature.properties.name);
              break;
            }
          }
        }

        // Fallback: hit-test small countries using the circle drawn around them
        if (!found) {
          for (let i = countries.length - 1; i >= 0; i--) {
            const feature = countries[i].feature;
            if (!smallCountryIds.has(feature.id as string)) continue;
            const isRevealed = revealed.some(c => c.id === feature.id);
            const isTerminal =
              feature.id === startCountry?.id || feature.id === endCountry?.id;
            if (!showAll && !isRevealed && !isTerminal) continue;
            const center = projection(geoCentroid(feature));
            if (center) {
              const dx = mx - center[0];
              const dy = my - center[1];
              if (dx * dx + dy * dy <= 36) {
                found = countryByName.get(feature.properties.name);
                break;
              }
            }
          }
        }

        store.set(mapState.mouseGlobePosAtom, [mx, my]);

        if (found !== store.get(mapState.hoveredCountryAtom)) {
          store.set(mapState.hoveredCountryAtom, found);
          if (found) {
            store.set(mapState.lastCenteredCountriesAtom, undefined);
          }
        }
      },

      onMouseLeave() {
        store.set(mapState.hoveredCountryAtom, undefined);
        store.set(mapState.mouseGlobePosAtom, undefined);
      },
    },
    { drag: { filterTaps: true } },
  );
};
