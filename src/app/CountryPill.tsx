import type { ReactNode } from 'react';
import { tw } from '../layout/tw';
import type { Country } from '../map/countries';

export const CountryPill = (props: {
  className?: string;
  country?: Country;
  children?: ReactNode;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onClick?: () => void;
}) => {
  return (
    <button
      className={tw(
        'flex items-center gap-1 cursor-pointer interactive-opacity rounded-lg px-2 border border-text/10 shadow-sm/20 bg-text/20',
        props.className,
      )}
      onMouseEnter={props.onMouseEnter}
      onFocus={props.onFocus}
      onClick={props.onClick}
    >
      {props.country?.name ?? props.children}
    </button>
  );
};
