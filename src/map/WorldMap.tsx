import { useGesture } from '@use-gesture/react';
import { animated, useSpringValue, to } from '@react-spring/web';
import { geoBounds, geoCentroid, geoOrthographic, geoPath } from 'd3-geo';
import { tw } from '../layout/tw';
import {
  countryGeoData,
  visibleCountriesAtom,
  type Country,
} from './countries';
import { onCenterCountries, type CenterCountriesHandler } from './globeEvents';
import { useAtomValue } from 'jotai';
import { useEffect, useEffectEvent, useState } from 'react';

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

const CENTROIDS = countryGeoData.features.map((f) => {
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

  const [lastCenteredCountries, setLastCenteredCountries] = useState<
    Country[] | undefined
  >();

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

  const centerCountries = useEffectEvent(((countries) => {
    const indices = countries
      .map((c) => countryGeoData.features.findIndex((f) => f.id === c.id))
      .filter((i) => i >= 0);

    if (indices.length === 0) return;

    const centroids = indices.map((i) => CENTROIDS[i]);

    // 3D vector mean for a correct geographic center across the antimeridian
    let x = 0,
      y = 0,
      z = 0;
    for (const [lonRad, latRad] of centroids) {
      x += Math.cos(latRad) * Math.cos(lonRad);
      y += Math.cos(latRad) * Math.sin(lonRad);
      z += Math.sin(latRad);
    }
    const mag = Math.sqrt(x * x + y * y + z * z);
    const centerLon = Math.atan2(y, x) / DEG;
    const centerLat = Math.asin(z / mag) / DEG;

    rotX.start(-centerLon);
    rotY.start(-centerLat);

    // Fit scale using bounding box corners so country size is accounted for
    const centerLonRad = centerLon * DEG;
    const centerLatRad = centerLat * DEG;
    const boundaryPoints = indices.flatMap((i) => {
      const [[west, south], [east, north]] = geoBounds(
        countryGeoData.features[i],
      );
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
        ? Math.min(currentScale, fitScale) // stay zoomed in, but pull back if country overflows
        : Math.min(MAX_CENTER_SCALE, fitScale);

    scale.start(Math.max(MIN_SCALE, newScale));
  }) satisfies CenterCountriesHandler);

  useEffect(
    () =>
      onCenterCountries((countries) => {
        centerCountries(countries);
        setLastCenteredCountries(countries);
      }),
    [],
  );

  const visibleCountries = useAtomValue(visibleCountriesAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
          className='fill-surface stroke-text/30 stroke-[0.5]'
        />
        {countryGeoData.features.map((feature, i) => {
          if (!visibleCountries.some((c) => c.id === feature.id)) {
            return null;
          }

          const [lonRad, latRad] = CENTROIDS[i];

          return (
            <animated.path
              className={tw(
                'fill-land stroke-text/50 stroke-[0.4] cursor-pointer hover:fill-land/50',
              )}
              key={i}
              data-iso={String(feature.id ?? '')}
              onMouseEnter={() => setHoveredId(String(feature.id ?? ''))}
              onMouseLeave={() => setHoveredId(null)}
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

        {countryGeoData.features.map((feature, i) => {
          if (!visibleCountries.some((c) => c.id === feature.id)) {
            return null;
          }

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
              className={tw(
                'transition-opacity',
                hoveredId === feature.id ||
                  lastCenteredCountries?.find((c) => c.id === feature.id)
                  ? 'opacity-100'
                  : 'opacity-0',
              )}
            >
              <text
                x={0}
                textAnchor='middle'
                className='fill-text text-sm font-medium pointer-events-none select-none'
                style={{ fontSize: '5px' }}
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
