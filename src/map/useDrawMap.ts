import { geoOrthographic, geoPath, geoCentroid } from 'd3-geo';
import { useEffectEvent, type RefObject, useEffect } from 'react';
import {
  GLOBE_SIZE,
  hoveredCountryAtom,
  lastCenteredCountriesAtom,
  mouseGlobePosAtom,
  DEG,
  CENTROIDS,
} from './state';
import { countryGeoData, type Country } from './countries';
import type { SpringValue } from '@react-spring/web';
import { useStore } from 'jotai';
import {
  connectedRevealedCountriesAtom,
  connectedRevealedSuperfluouslyAtom,
  currentPathAtom,
  endCountryAtom,
  isRoundCompleteAtom,
  revealedCountriesAtom,
  showAllCountriesAtom,
  showAllNamesAtom,
  startCountryAtom,
  winningPathAtom,
} from '../game/state';
import { getColors } from './getColors';
import { countryByName } from '../game/countryByName';

type Props = {
  scale: SpringValue<number>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  rotX: SpringValue<number>;
  rotY: SpringValue<number>;
  rotZ: SpringValue<number>;
};

export const useDrawMap = ({ rotX, rotY, rotZ, scale, canvasRef }: Props) => {
  const store = useStore();

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
    ctx.strokeStyle = colors.globeBorder;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Countries
    const revealedCountries = store.get(revealedCountriesAtom);
    const startCountry = store.get(startCountryAtom);
    const endCountry = store.get(endCountryAtom);
    const isRoundComplete = store.get(isRoundCompleteAtom);
    const winningPath = store.get(winningPathAtom);
    const currentPath = store.get(currentPathAtom);
    const revealedConnectedSuperfluously = store.get(
      connectedRevealedSuperfluouslyAtom,
    );

    const showNames = isRoundComplete ? true : store.get(showAllNamesAtom);
    const showAllCountries = isRoundComplete
      ? true
      : store.get(showAllCountriesAtom);
    const hoveredCountry = store.get(hoveredCountryAtom);
    const centeredCountries = store.get(lastCenteredCountriesAtom);
    const mouseGlobePos = store.get(mouseGlobePosAtom);

    const connectedRevealedCountries = store.get(
      connectedRevealedCountriesAtom,
    );

    const viewLonRad = -rx * DEG;
    const viewLatRad = -ry * DEG;

    const labelCountries = new Set<Country>();

    if (
      hoveredCountry &&
      (showNames ||
        revealedCountries.some(c => c.id === hoveredCountry.id) ||
        hoveredCountry.id === startCountry?.id ||
        hoveredCountry.id === endCountry?.id)
    ) {
      labelCountries.add(hoveredCountry);
    }

    centeredCountries?.forEach(c => {
      if (showNames || revealedCountries.length === 0) {
        labelCountries.add(c);
      }
    });

    ctx.strokeStyle = colors.countryBorder;
    ctx.lineWidth = 0.4;

    for (let i = 0; i < countryGeoData.features.length; i++) {
      const feature = countryGeoData.features[i];
      const country = countryByName.get(feature.properties.name)!;

      const isRevealed =
        revealedCountries.some(c => c.id === feature.id) ||
        (isRoundComplete && winningPath.some(c => c.id === feature.id));

      const isStart = feature.id === startCountry?.id;

      const isConnectedRevealed = connectedRevealedCountries.some(
        c => c.id === feature.id,
      );

      const isEnd = feature.id === endCountry?.id;

      const isConnectedRevealedSuperfluously =
        revealedConnectedSuperfluously.includes(country);

      if (!showAllCountries && !isRevealed && !isStart && !isEnd) continue;

      const [lonRad, latRad] = CENTROIDS[i];
      const dot =
        Math.sin(latRad) * Math.sin(viewLatRad) +
        Math.cos(latRad) * Math.cos(viewLatRad) * Math.cos(lonRad - viewLonRad);
      if (dot < -0.1) continue;

      const id = String(feature.id ?? '');
      const isHovered = hoveredCountry?.id === id;
      const isCentered = centeredCountries?.some(c => c.id === id) ?? false;

      ctx.beginPath();
      pathGen(feature);

      if (isStart || isEnd) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.terminalHover : colors.terminal;
      } else if (isConnectedRevealedSuperfluously) {
        ctx.fillStyle =
          isHovered || isCentered
            ? colors.connectedSuperfluouslyHover
            : colors.connectedSuperfluously;
      } else if (isConnectedRevealed) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.connectedHover : colors.connected;
      } else if (isRevealed) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.revealedHover : colors.revealed;
      } else {
        ctx.fillStyle =
          isHovered || isCentered ? colors.unrevealedHover : colors.unrevealed;
      }

      ctx.fill();
      ctx.stroke();

      // Countries too small to form a visible polygon — draw a dot with enclosing circle
      if (pathGen.area(feature) < 2) {
        const center = projection(geoCentroid(feature));
        if (center) {
          ctx.beginPath();
          ctx.arc(center[0], center[1], 1, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(center[0], center[1], 6, 0, Math.PI * 2);
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 0.75;
          ctx.stroke();

          ctx.strokeStyle = colors.countryBorder;
          ctx.lineWidth = 0.4;
        }
      }
    }

    // Labels for hovered / centered countries
    if (labelCountries.size > 0) {
      ctx.font = 'medium 5px Geist, system-ui, sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const country of labelCountries) {
        const feature = country.feature;

        let x: number;
        let y: number;

        if (country.id === hoveredCountry?.id && mouseGlobePos) {
          x = mouseGlobePos[0];
          y = mouseGlobePos[1] - 10;
        } else {
          const center = projection(geoCentroid(feature));
          if (!center || isNaN(center[0]) || isNaN(center[1])) continue;
          x = center[0];
          y = center[1];
        }

        const name = feature.properties.name;

        ctx.strokeStyle = colors.labelOutline;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(name, x, y);

        ctx.fillStyle = colors.text;
        ctx.fillText(name, x, y);
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
