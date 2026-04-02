import { geoOrthographic, geoPath, geoCentroid } from 'd3-geo';
import { useEffectEvent, type RefObject, useEffect } from 'react';
import * as mapState from './state';
import * as gameState from '../game/state';
import { countryGeoData, type Country } from './countries';
import type { SpringValue } from '@react-spring/web';
import { useStore } from 'jotai';
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
    ctx.scale(
      displaySize / mapState.GLOBE_SIZE,
      displaySize / mapState.GLOBE_SIZE,
    );

    const rx = rotX.get();
    const ry = rotY.get();
    const rz = rotZ.get();
    const s = scale.get();

    const projection = geoOrthographic()
      .scale(s)
      .translate([mapState.GLOBE_SIZE / 2, mapState.GLOBE_SIZE / 2])
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
    const revealed = store.get(gameState.revealedCountriesAtom);
    const start = store.get(gameState.startCountryAtom);
    const end = store.get(gameState.endCountryAtom);
    const isRoundComplete = store.get(gameState.isRoundCompleteAtom);
    const winningPath = store.get(gameState.winningPathAtom);
    const missedOptimalPath = store.get(gameState.missedOptimalPathAtom);
    const revealedNonOptimal = store.get(gameState.revealedNonOptimalAtom);
    const showNames = isRoundComplete
      ? true
      : store.get(gameState.showAllNamesAtom);
    const showAllCountries = isRoundComplete
      ? true
      : store.get(gameState.showAllCountriesAtom);
    const hovered = store.get(mapState.hoveredCountryAtom);
    const centered = store.get(mapState.lastCenteredCountriesAtom);
    const mouseGlobePos = store.get(mapState.mouseGlobePosAtom);

    const connectedRevealedCountries = store.get(
      gameState.connectedRevealedCountriesAtom,
    );

    const viewLonRad = -rx * mapState.DEG;
    const viewLatRad = -ry * mapState.DEG;

    const labelCountries = new Set<Country>();

    if (
      hovered &&
      (showNames ||
        revealed.includes(hovered) ||
        hovered === start ||
        hovered === end)
    ) {
      labelCountries.add(hovered);
    }

    centered?.forEach(c => {
      if (showNames || revealed.length === 0) {
        labelCountries.add(c);
      }
    });

    ctx.strokeStyle = colors.countryBorder;
    ctx.lineWidth = 0.4;

    for (let i = 0; i < countryGeoData.features.length; i++) {
      const feature = countryGeoData.features[i];
      const country = countryByName.get(feature.properties.name)!;

      const isRevealed =
        revealed.includes(country) ||
        (isRoundComplete && winningPath.includes(country));

      const isStart = country === start;
      const isEnd = country === end;

      if (!showAllCountries && !isRevealed && !isStart && !isEnd) continue;

      const [lonRad, latRad] = country.centroid;
      const dot =
        Math.sin(latRad) * Math.sin(viewLatRad) +
        Math.cos(latRad) * Math.cos(viewLatRad) * Math.cos(lonRad - viewLonRad);
      if (dot < -0.1) continue;

      const isHovered = country === hovered;
      const isCentered = centered?.includes(country);
      const isMissedOptimal = missedOptimalPath.includes(country);
      const isConnectedRevealed = connectedRevealedCountries.includes(country);
      const isRevealedNonOptimal = revealedNonOptimal.includes(country);

      ctx.beginPath();
      pathGen(feature);

      if (isStart || isEnd) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.terminalHover : colors.terminal;
      } else if (isMissedOptimal) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.optimalHover : colors.optimal;
      } else if (isRevealedNonOptimal) {
        ctx.fillStyle =
          isHovered || isCentered ? colors.revealedHover : colors.revealed;
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

        if (country === hovered && mouseGlobePos) {
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
