import { geoOrthographic, geoPath } from 'd3-geo';
import { useRef, useEffectEvent, type RefObject, useEffect } from 'react';
import {
  GLOBE_SIZE,
  hoveredIdAtom,
  lastCenteredCountriesAtom,
  DEG,
  CENTROIDS,
} from './state';
import { countryGeoData } from './countries';
import type { SpringValue } from '@react-spring/web';
import { useStore } from 'jotai';
import {
  guessedCountriesAtom,
  showAllCountriesAtom,
  showAllNamesAtom,
} from '../game/state';

const LAND_FILL = 'rgba(74, 166, 107, 0.69)';
const LAND_HOVER_FILL = 'rgba(74, 166, 107, 0.70)';
const LAND_CENTERED_FILL = 'rgba(74, 166, 107, 0.50)';

type Props = {
  scale: SpringValue<number>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  rotX: SpringValue<number>;
  rotY: SpringValue<number>;
  rotZ: SpringValue<number>;
};

export const useDrawMap = ({ rotX, rotY, rotZ, scale, canvasRef }: Props) => {
  const store = useStore();

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
    const guessed = store.get(guessedCountriesAtom);
    const showNames = store.get(showAllNamesAtom);
    const showAll = store.get(showAllCountriesAtom);
    const hoveredId = store.get(hoveredIdAtom);
    const centeredCountries = store.get(lastCenteredCountriesAtom);

    const viewLonRad = -rx * DEG;
    const viewLatRad = -ry * DEG;

    const labelFeatureIds = new Set<string>();

    if (hoveredId && (showNames || guessed.some((c) => c.id === hoveredId))) {
      labelFeatureIds.add(hoveredId);
    }

    if (showNames) {
      centeredCountries?.forEach((c) => labelFeatureIds.add(c.id));
    }

    ctx.strokeStyle = `color-mix(in oklch, ${colors.text} 50%, transparent)`;
    ctx.lineWidth = 0.4;

    for (let i = 0; i < countryGeoData.features.length; i++) {
      const feature = countryGeoData.features[i];
      const isGuessed = guessed.some((c) => c.id === feature.id);

      if (!showAll && !isGuessed) continue;

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

      if (isGuessed) {
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
};
