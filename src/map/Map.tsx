import { useGesture } from '@use-gesture/react';
import { useSpringValue, type AnimationConfig } from '@react-spring/web';
import {
  geoBounds,
  geoCentroid,
  geoContains,
  geoOrthographic,
  geoPath,
} from 'd3-geo';
import { countryGeoData } from './countries';
import { onCenterCountries, type CenterCountriesHandler } from './globeEvents';
import { useStore } from 'jotai';
import { useEffect, useEffectEvent, useRef } from 'react';
import {
  showAllCountriesAtom,
  revealedCountriesAtom,
  showAllNamesAtom,
  hoveredIdAtom,
  lastCenteredCountriesAtom,
} from './atoms';

const DEG = Math.PI / 180;
const GLOBE_SIZE = 600;
const MIN_SCALE = 100;
const MAX_SCALE = 1700;
const ROTATION_SENSITIVITY = 0.15;
const ZOOM_SENSITIVITY = 100;
const DEFAULT_SCALE = 250;

const CENTROIDS = countryGeoData.features.map((f) => {
  const [lon, lat] = geoCentroid(f);
  return [lon * DEG, lat * DEG] as [number, number];
});

const rotationConfig = {
  tension: 280,
  friction: 25,
} satisfies Partial<AnimationConfig>;

const scaleConfig = {
  tension: 280,
  friction: 60,
} satisfies Partial<AnimationConfig>;

const LAND_FILL = 'rgba(74, 166, 107, 0.69)';
const LAND_HOVER_FILL = 'rgba(74, 166, 107, 0.70)';
const LAND_CENTERED_FILL = 'rgba(74, 166, 107, 0.50)';

export const Map = () => {
  const store = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotX = useSpringValue(0, { config: rotationConfig });
  const rotY = useSpringValue(-20, { config: rotationConfig });
  const rotZ = useSpringValue(0, { config: rotationConfig });
  const scale = useSpringValue(DEFAULT_SCALE, { config: scaleConfig });

  // CSS colors read once
  const colorsRef = useRef<{ surface: string; text: string } | null>(null);
  const getColors = () => {
    if (!colorsRef.current) {
      const style = getComputedStyle(document.documentElement);
      colorsRef.current = {
        surface: style.getPropertyValue('--color-surface').trim(),
        text: style.getPropertyValue('--color-text').trim(),
      };
    }
    return colorsRef.current;
  };

  const draw = useEffectEvent(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center the square globe in the (possibly non-square) container
    const displaySize = Math.min(cssWidth, cssHeight);
    const offsetX = (cssWidth - displaySize) / 2;
    const offsetY = (cssHeight - displaySize) / 2;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(displaySize / GLOBE_SIZE, displaySize / GLOBE_SIZE);

    const rx = rotX.get();
    const ry = rotY.get();
    const rz = rotZ.get();
    const s = scale.get();

    const projection = geoOrthographic()
      .scale(s)
      .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
      .rotate([rx, ry, rz]);

    const pathGen = geoPath(projection, ctx);
    const colors = getColors();

    // Globe sphere
    ctx.beginPath();
    pathGen({ type: 'Sphere' });
    ctx.fillStyle = colors.surface;
    ctx.fill();
    ctx.strokeStyle = `color-mix(in oklch, ${colors.text} 30%, transparent)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Countries
    const revealed = store.get(revealedCountriesAtom);
    const showNames = store.get(showAllNamesAtom);
    const showAll = store.get(showAllCountriesAtom);
    const hoveredId = store.get(hoveredIdAtom);
    const centeredCountries = store.get(lastCenteredCountriesAtom);

    const viewLonRad = -rx * DEG;
    const viewLatRad = -ry * DEG;

    const labelFeatureIds = new Set<string>();

    if (hoveredId && showNames) {
      labelFeatureIds.add(hoveredId);
    }

    if (showNames) {
      centeredCountries?.forEach((c) => labelFeatureIds.add(c.id));
    }

    ctx.strokeStyle = `color-mix(in oklch, ${colors.text} 50%, transparent)`;
    ctx.lineWidth = 0.4;

    for (let i = 0; i < countryGeoData.features.length; i++) {
      const feature = countryGeoData.features[i];
      const isRevealed = revealed.some((c) => c.id === feature.id);

      if (!showAll && !isRevealed) continue;

      const [lonRad, latRad] = CENTROIDS[i];
      const dot =
        Math.sin(latRad) * Math.sin(viewLatRad) +
        Math.cos(latRad) * Math.cos(viewLatRad) * Math.cos(lonRad - viewLonRad);
      if (dot < -0.1) continue;

      const id = String(feature.id ?? '');
      const isHovered = hoveredId === id;
      const isCentered = centeredCountries?.some((c) => c.id === id) ?? false;

      ctx.beginPath();
      pathGen(feature);

      if (isRevealed) {
        ctx.fillStyle = isCentered
          ? LAND_CENTERED_FILL
          : isHovered
            ? LAND_HOVER_FILL
            : LAND_FILL;
      } else {
        ctx.fillStyle = isHovered
          ? `color-mix(in oklch, ${colors.text} 15%, transparent)`
          : `color-mix(in oklch, ${colors.text} 10%, transparent)`;
      }
      ctx.fill();
      ctx.stroke();
    }

    // Labels for hovered / centered countries
    if (labelFeatureIds.size > 0) {
      ctx.font = 'medium 5px Geist, system-ui, sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const id of labelFeatureIds) {
        const feature = countryGeoData.features.find(
          (f) => String(f.id ?? '') === id,
        );
        if (!feature) continue;
        const centroid = pathGen.centroid(feature);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) continue;
        ctx.fillText(feature.properties.name, centroid[0], centroid[1]);
      }
    }

    ctx.restore();
  });

  const centerCountries = useEffectEvent(((countries) => {
    const indices = countries
      .map((c) => countryGeoData.features.findIndex((f) => f.id === c.id))
      .filter((i) => i >= 0);

    if (indices.length === 0) return;

    const centroids = indices.map((i) => CENTROIDS[i]);

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
        ? Math.min(currentScale, fitScale)
        : Math.min(MAX_CENTER_SCALE, fitScale);

    scale.start(Math.max(MIN_SCALE, newScale));

    store.set(lastCenteredCountriesAtom, countries);
  }) satisfies CenterCountriesHandler);

  // Continuous RAF draw loop
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => onCenterCountries(centerCountries), []);

  const bind = useGesture(
    {
      onDrag({ movement: [mx, my], memo, tap, first }) {
        if (tap) return;

        store.set(lastCenteredCountriesAtom, undefined);
        store.set(hoveredIdAtom, undefined);

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
        const revealed = store.get(revealedCountriesAtom);
        const showAll = store.get(showAllCountriesAtom);

        let found: string | undefined;
        if (lonLat) {
          for (let i = countryGeoData.features.length - 1; i >= 0; i--) {
            const feature = countryGeoData.features[i];
            const isRevealed = revealed.some((c) => c.id === feature.id);
            if (!showAll && !isRevealed) continue;
            if (geoContains(feature, lonLat)) {
              found = String(feature.id ?? '');
              break;
            }
          }
        }

        if (found !== store.get(hoveredIdAtom)) {
          store.set(hoveredIdAtom, found);
          if (found) {
            store.set(lastCenteredCountriesAtom, undefined);
          }
        }
      },

      onMouseLeave() {
        store.set(hoveredIdAtom, undefined);
      },
    },
    { drag: { filterTaps: true } },
  );

  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden touch-none'>
      <canvas
        ref={canvasRef}
        className='h-full w-full touch-none'
        {...bind()}
      />
    </div>
  );
};
