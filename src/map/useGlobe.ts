import { useRef, useState } from 'react';
import { geoCentroid, geoOrthographic, geoPath } from 'd3-geo';
import { useGesture } from '@use-gesture/react';
import type { CountryFeature } from './types';

export const GLOBE_SIZE = 600;
const INITIAL_SCALE = 250;
const MIN_SCALE = 100;
const MAX_SCALE = 800;
const ROTATION_SENSITIVITY = 0.3;
const ZOOM_SENSITIVITY = 0.5;

export const useGlobe = () => {
  const [rotation, setRotation] = useState<[number, number, number]>([
    0, -20, 0,
  ]);

  const [scale, setScale] = useState(INITIAL_SCALE);
  const rotationRef = useRef(rotation);
  const animationRef = useRef(0);

  const projection = geoOrthographic()
    .scale(scale)
    .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
    .rotate(rotation);

  const path = geoPath(projection);

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], memo, tap }) => {
        if (tap) return;
        const start = (memo as [number, number, number]) ?? rotationRef.current;
        const next: [number, number, number] = [
          (start[0] + mx * ROTATION_SENSITIVITY) % 360,
          Math.max(-90, Math.min(90, start[1] - my * ROTATION_SENSITIVITY)),
          start[2],
        ];
        rotationRef.current = next;
        setRotation(next);
        return start;
      },
      onWheel: ({ delta: [, dy] }) => {
        setScale((s) =>
          Math.max(MIN_SCALE, Math.min(MAX_SCALE, s - dy * ZOOM_SENSITIVITY)),
        );
      },
    },
    {
      drag: { filterTaps: true },
    },
  );

  const rotateTo = (feature: CountryFeature) => {
    cancelAnimationFrame(animationRef.current);
    const centroid = geoCentroid(feature);
    const target: [number, number, number] = [-centroid[0], -centroid[1], 0];
    const start = rotationRef.current;
    const startTime = performance.now();
    const duration = 600;

    const animate = (time: number) => {
      const t = Math.min(1, (time - startTime) / duration);
      const eased = t * (2 - t); // ease-out quad
      const next: [number, number, number] = [
        start[0] + (target[0] - start[0]) * eased,
        start[1] + (target[1] - start[1]) * eased,
        start[2] + (target[2] - start[2]) * eased,
      ];
      rotationRef.current = next;
      setRotation(next);
      if (t < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  return { projection, path, bind, rotateTo };
};
