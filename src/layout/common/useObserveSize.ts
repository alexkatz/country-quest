/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import useResizeObserver from 'use-resize-observer';

export const useObserveSize = <T extends HTMLElement>(props: {
  ref?: RefObject<T | undefined | null>;
  dimension: 'width' | 'height';
}) => {
  const ref = useRef<any>(null);
  const [size, setSize] = useState(0);

  useResizeObserver({
    ref: props.ref ?? ref,
    onResize: ({ width, height }) => {
      setSize((props.dimension === 'width' ? width : height) ?? 0);
    },
    box: 'border-box',
  });

  return { size, ref: props.ref ?? ref };
};

export const useObserveSizeSilently = <T extends HTMLElement>(props: {
  ref?: RefObject<T | undefined | null>;
  dimension: 'width' | 'height';
  onSizeChange: (size: number) => void;
}) => {
  const ref = useRef<any>(null);

  useResizeObserver({
    ref: props.ref ?? ref,
    onResize: ({ width, height }) => {
      props.onSizeChange((props.dimension === 'width' ? width : height) ?? 0);
    },
    box: 'border-box',
  });

  return props.ref ?? ref;
};
