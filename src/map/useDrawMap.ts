import { geoOrthographic, geoPath } from 'd3-geo';
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
  endCountryAtom,
  revealedCountriesAtom,
  showAllCountriesAtom,
  showAllNamesAtom,
  startCountryAtom,
} from '../game/state';
import { getColors } from './getColors';

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
    const showNames = store.get(showAllNamesAtom);
    const showAllCountries = store.get(showAllCountriesAtom);
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
      const isRevealed = revealedCountries.some(c => c.id === feature.id);
      const isStart = feature.id === startCountry?.id;
      const isConnectedRevealed = connectedRevealedCountries.some(
        c => c.id === feature.id,
      );
      const isEnd = feature.id === endCountry?.id;

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
        ctx.fillStyle = colors.terminal;
      } else if (isConnectedRevealed) {
        ctx.fillStyle = colors.connected;
      } else if (isRevealed) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.landHover : colors.land;
      } else {
        ctx.fillStyle = isHovered ? colors.unrevealedHover : colors.unrevealed;
      }
      ctx.fill();
      ctx.stroke();
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
          const centroid = pathGen.centroid(feature);
          if (isNaN(centroid[0]) || isNaN(centroid[1])) continue;
          x = centroid[0];
          y = centroid[1];
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
