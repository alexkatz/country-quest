import { feature as topoFeature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import countriesData from './data/countries-simplified.json';
import type { CountriesGeoJSON } from './types';
import { useGesture } from '@use-gesture/react';
import { animated, useSpringValue, to } from '@react-spring/web';
import { geoCentroid, geoOrthographic, geoPath } from 'd3-geo';

const DEG = Math.PI / 180;

const GLOBE_SIZE = 600;
const MIN_SCALE = 100;
const MAX_SCALE = 1700;
const ROTATION_SENSITIVITY = 0.15;
const ZOOM_SENSITIVITY = 0.8;
const DEFAULT_SCALE = 250;

let cachedProjectionKey = '';
let cachedProjection: ReturnType<typeof geoOrthographic> | null = null;
const getProjection = (props: {
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}) => {
  const key = `${props.rotX}-${props.rotY}-${props.rotZ}-${props.scale}`;
  if (key !== cachedProjectionKey) {
    cachedProjection = geoOrthographic()
      .scale(props.scale)
      .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
      .rotate([props.rotX, props.rotY, props.rotZ]);
    cachedProjectionKey = key;
  }

  return cachedProjection!;
};

const COUNTRIES = topoFeature(
  countriesData as unknown as Topology,
  (countriesData as unknown as Topology).objects.countries,
) as unknown as CountriesGeoJSON;

const CENTROIDS = COUNTRIES.features.map((f) => {
  const [lon, lat] = geoCentroid(f);
  return [lon * DEG, lat * DEG] as [number, number];
});

export const WorldMap = () => {
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
        {COUNTRIES.features.map((feature, i) => {
          const [lonRad, latRad] = CENTROIDS[i];
          return (
            <animated.path
              className='fill-surface stroke-text/50 stroke-[0.4] cursor-pointer hover:fill-text/20'
              key={i}
              data-iso={String(feature.id ?? '')}
              display={to([rotX, rotY, rotZ], (rotX, rotY) => {
                const viewLonRad = -rotX * DEG;
                const viewLatRad = -rotY * DEG;
                const dot =
                  Math.sin(latRad) * Math.sin(viewLatRad) +
                  Math.cos(latRad) *
                    Math.cos(viewLatRad) *
                    Math.cos(lonRad - viewLonRad);
                return dot < -0.1 ? 'none' : 'inline';
              })}
              d={to(
                [rotX, rotY, rotZ, scale],
                (rotX, rotY, rotZ, scale) =>
                  geoPath(getProjection({ rotX, rotY, rotZ, scale }))(
                    feature,
                  ) ?? '',
              )}
            />
          );
        })}

        {COUNTRIES.features.map((feature, i) => {
          const [lonRad, latRad] = CENTROIDS[i];
          return (
            <animated.g
              key={i}
              display={to(
                [rotX, rotY, rotZ, scale],
                (rotX, rotY, rotZ, scale) => {
                  const viewLonRad = -rotX * DEG;
                  const viewLatRad = -rotY * DEG;
                  const dot =
                    Math.sin(latRad) * Math.sin(viewLatRad) +
                    Math.cos(latRad) *
                      Math.cos(viewLatRad) *
                      Math.cos(lonRad - viewLonRad);
                  if (dot < -0.1) return 'none';
                  const centroid = geoPath(
                    getProjection({ rotX, rotY, rotZ, scale }),
                  ).centroid(feature);
                  return isNaN(centroid[0]) || isNaN(centroid[1])
                    ? 'none'
                    : 'inline';
                },
              )}
              transform={to(
                [rotX, rotY, rotZ, scale],
                (rotX, rotY, rotZ, scale) => {
                  const centroid = geoPath(
                    getProjection({ rotX, rotY, rotZ, scale }),
                  ).centroid(feature);
                  if (isNaN(centroid[0]) || isNaN(centroid[1]))
                    return 'translate(0,0)';
                  return `translate(${centroid[0]},${centroid[1]})`;
                },
              )}
              scale={scale}
            >
              <text
                x={0}
                textAnchor='middle'
                className='fill-text text-sm font-medium pointer-events-none select-none'
                style={{ fontSize: '3px' }}
              >
                {feature.properties.name}
              </text>
            </animated.g>
          );
        })}
      </svg>
    </div>
  );
};
