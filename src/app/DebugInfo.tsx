import { useAtomValue } from 'jotai';
import {
  endCountryAtom,
  guessedCountriesAtom,
  maxPathSizeAtom,
  roundAtom,
  showDebugInfoAtom,
  startCountryAtom,
} from '../game/state';
import type { ReactNode } from 'react';

const InfoItem = (props: {
  className?: string;
  label: string;
  value: ReactNode;
}) => {
  return (
    <div className='flex items-center gap-2'>
      <div className='opacity-50'>{props.label}:</div>
      <div>{props.value}</div>
    </div>
  );
};

export const DebugInfo = () => {
  const showDebInfo = useAtomValue(showDebugInfoAtom);

  const round = useAtomValue(roundAtom);
  const maxPathSize = useAtomValue(maxPathSizeAtom);

  const startCountry = useAtomValue(startCountryAtom);
  const endCountry = useAtomValue(endCountryAtom);

  const guessedCountries = useAtomValue(guessedCountriesAtom);

  return !showDebInfo ? null : (
    <div className='absolute top-2 left-2 rounded-lg backdrop-blur-2xl border border-text/30 shadow-sm/20 bg-text-10 p-2 z-50'>
      <InfoItem label='round' value={round} />
      <InfoItem label='maxPathSize' value={maxPathSize} />

      <InfoItem label='startCountry' value={startCountry.name} />
      <InfoItem label='endCountry' value={endCountry.name} />

      <InfoItem
        label='guessedCountries'
        value={guessedCountries.map((c) => c.name).join(', ')}
      />
    </div>
  );
};
