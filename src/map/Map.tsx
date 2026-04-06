import { useSpringValue } from '@react-spring/web';
import { useRef } from 'react';
import {
  DEFAULT_SCALE,
  ROTATION_SPRING_CONFIG,
  SCALE_SPRING_CONFIG,
} from './state';
import { useMapGestures } from './useMapGestures';
import { useDrawMap } from './useDrawMap';
import { useOnGlobeEvents } from './useOnGlobeEvents';
import { useOnRevealCountry } from './useOnRevealCountry';
import { useAtomValue } from 'jotai';
import { connectedRevealedCountriesAtom } from '../game/state';

export const Map = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInfo = {
    rotX: useSpringValue(0, { config: ROTATION_SPRING_CONFIG }),
    rotY: useSpringValue(-20, { config: ROTATION_SPRING_CONFIG }),
    rotZ: useSpringValue(0, { config: ROTATION_SPRING_CONFIG }),
    scale: useSpringValue(DEFAULT_SCALE, { config: SCALE_SPRING_CONFIG }),
    canvasRef,
  };

  useDrawMap(mapInfo);
  useOnGlobeEvents(mapInfo);
  useOnRevealCountry();

  useAtomValue(connectedRevealedCountriesAtom);

  const bindGestures = useMapGestures(mapInfo);

  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden touch-none'>
      <canvas
        ref={canvasRef}
        className='h-full w-full touch-none'
        {...bindGestures()}
      />
    </div>
  );
};
