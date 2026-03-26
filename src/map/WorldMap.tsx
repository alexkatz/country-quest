import countriesData from './data/countries-110m.json';
import type { CountriesGeoJSON } from './types';
import { useGesture } from '@use-gesture/react';
import { animated, useSpringValue, to } from '@react-spring/web';
import { geoOrthographic, geoPath } from 'd3-geo';
import { useState } from 'react';

const GLOBE_SIZE = 600;
const MIN_SCALE = 100;
const MAX_SCALE = 800;
const ROTATION_SENSITIVITY = 0.15;
const ZOOM_SENSITIVITY = 0.5;
const DEFAULT_SCALE = 250;

const COUNTRIES = countriesData as CountriesGeoJSON;

export const WorldMap = () => {
  const [focusedFeature, setFocusedFeature] = useState<
    CountriesGeoJSON['features'][number] | undefined
  >();

  const rotX = useSpringValue(0, {
    config: { tension: 280, friction: 30 },
  });

  const rotY = useSpringValue(-20, {
    config: { tension: 280, friction: 30 },
  });

  const rotZ = useSpringValue(0, {
    config: { tension: 280, friction: 30 },
  });

  const scale = useSpringValue(DEFAULT_SCALE, {
    config: { tension: 280, friction: 60 },
  });

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], memo, tap, first }) => {
        if (tap) return;
        const start = first
          ? [rotX.get(), rotY.get(), rotZ.get()]
          : (memo as [number, number, number]);

        const scaledRotationSensitivity =
          ROTATION_SENSITIVITY * (DEFAULT_SCALE / scale.get());

        const nextX = start[0] + mx * scaledRotationSensitivity;
        const nextY = Math.max(
          -90,
          Math.min(90, start[1] - my * scaledRotationSensitivity),
        );
        const nextZ = start[2];

        rotX.start(nextX);
        rotY.start(nextY);
        rotZ.start(nextZ);

        return start;
      },

      onWheel: ({ delta: [, dy] }) => {
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, scale.get() - dy * ZOOM_SENSITIVITY),
        );
        scale.start(newScale);
      },
    },
    {
      drag: { filterTaps: true },
    },
  );

  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden touch-none'>
      <svg
        viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
        className='h-full w-full touch-none'
        {...bind()}
      >
        <animated.circle
          cx={GLOBE_SIZE / 2}
          cy={GLOBE_SIZE / 2}
          r={scale}
          className='fill-surface/40 stroke-text/30 stroke-[0.5]'
        />
        {COUNTRIES.features.map((feature) => (
          <animated.path
            className='fill-surface stroke-text/50 stroke-[0.1] cursor-pointer hover:fill-text/20'
            key={feature.properties.ISO_A3}
            data-iso={feature.properties.ISO_A3}
            d={to([rotX, rotY, rotZ, scale], (rx, ry, rz, scl) => {
              const projection = geoOrthographic()
                .scale(scl)
                .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
                .rotate([rx, ry, rz]);
              return geoPath(projection)(feature) ?? '';
            })}
            onMouseEnter={() => {
              setFocusedFeature(feature);
            }}
            onMouseLeave={() => setFocusedFeature(undefined)}
            onClick={() => {
              setFocusedFeature(feature);
            }}
          />
        ))}

        {focusedFeature && (
          <animated.g
            transform={to([rotX, rotY, rotZ, scale], (rx, ry, rz, scl) => {
              const projection = geoOrthographic()
                .scale(scl)
                .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
                .rotate([rx, ry, rz]);

              const centroid = geoPath(projection).centroid(focusedFeature);
              return `translate(${centroid[0]},${centroid[1]})`;
            })}
            onMouseEnter={() => {
              setFocusedFeature(focusedFeature);
            }}
            onMouseLeave={() => setFocusedFeature(undefined)}
          >
            <rect
              x={-60}
              y={-30}
              width={120}
              height={24}
              rx={4}
              className='fill-text'
            />
            <text
              x={0}
              y={-12}
              textAnchor='middle'
              className='fill-surface text-sm font-medium pointer-events-none select-none'
              style={{ fontSize: '14px' }}
            >
              {focusedFeature.properties.NAME}
            </text>
          </animated.g>
        )}
      </svg>
    </div>
  );
};
