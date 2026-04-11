import { useEffect, useState } from 'react';

export const useVisualViewportHeight = () => {
  const [state, setState] = useState(() => ({
    height: window.visualViewport?.height ?? window.innerHeight,
    offsetTop: window.visualViewport?.offsetTop ?? 0,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const controller = new AbortController();
    const handler = () =>
      setState({ height: vv.height, offsetTop: vv.offsetTop });

    vv.addEventListener('resize', handler, controller);
    vv.addEventListener('scroll', handler, controller);

    return () => controller.abort();
  }, []);

  return state;
};
