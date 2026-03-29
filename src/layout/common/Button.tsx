import type { ComponentProps } from 'react';
import { tw } from '../tw';

export const Button = (props: ComponentProps<'button'>) => {
  return (
    <button
      {...props}
      className={tw(
        'px-2 py-1 border border-text/30 shadow-sm/20 rounded-md interactive-opacity cursor-pointer',
        props.disabled && 'opacity-50 pointer-events-none',
        props.className,
      )}
    />
  );
};
