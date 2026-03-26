import { to, useSpring } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";

export const useMapGestures = () => {
  const [{ x, y, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: { tension: 200, friction: 30 },
  }));

  const bind = useGesture(
    {
      onDrag: ({ offset: [ox, oy] }) => {
        api.start({ x: ox, y: oy });
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        const factor = dy > 0 ? 0.95 : 1.05;
        const newScale = Math.max(0.5, Math.min(10, scale.get() * factor));
        api.start({ scale: newScale });
      },
      onPinch: ({ offset: [s] }) => {
        const newScale = Math.max(0.5, Math.min(10, s));
        api.start({ scale: newScale });
      },
    },
    {
      drag: {
        from: () => [x.get(), y.get()],
      },
      wheel: {
        eventOptions: { passive: false },
      },
    },
  );

  const style = {
    transform: to(
      [x, y, scale],
      (xv, yv, sv) => `translate(${xv}px, ${yv}px) scale(${sv})`,
    ),
  };

  return { style, bind };
}
