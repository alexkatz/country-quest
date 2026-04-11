import { useSpringValue } from '@react-spring/web';
import { useRef } from 'react';
import {
  DEFAULT_SCALE,
  ROTATION_SPRING_CONFIG,
  SCALE_SPRING_CONFIG,
  VIEWPORT_OFFSET_SPRING_CONFIG,
} from './state';
import { useMapGestures } from './useMapGestures';
import { useDrawMap } from './useDrawMap';
import { useOnGlobeEvents } from './useOnGlobeEvents';
import { useOnRevealCountry } from './useOnRevealCountry';
import { tw } from '../layout/tw';

export const Map = (props: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInfo = {
    rotX: useSpringValue(0, { config: ROTATION_SPRING_CONFIG }),
    rotY: useSpringValue(-20, { config: ROTATION_SPRING_CONFIG }),
    rotZ: useSpringValue(0, { config: ROTATION_SPRING_CONFIG }),
    scale: useSpringValue(DEFAULT_SCALE, { config: SCALE_SPRING_CONFIG }),
    viewportOffsetTop: useSpringValue(0, {
      config: VIEWPORT_OFFSET_SPRING_CONFIG,
    }),
    canvasRef,
  };

  useDrawMap(mapInfo);
  useOnGlobeEvents(mapInfo);
  useOnRevealCountry();

  const bindGestures = useMapGestures(mapInfo);

  return (
    <div
      className={tw(
        'flex items-center justify-center overflow-hidden touch-none',
        props.className,
      )}
    >
      <canvas
        ref={canvasRef}
        className='h-full w-full touch-none'
        {...bindGestures()}
      />
    </div>
  );
};
