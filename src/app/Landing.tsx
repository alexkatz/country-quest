import { NavBar } from './NavBar';
import { Map } from '../map/Map';
import { tw } from '../layout/tw';
import { DebugInfo } from './DebugInfo';
import { useEffect } from 'react';
import { emitCenterCountries } from '../map/globeEvents';
import { useAtomValue } from 'jotai';
import * as gameState from '../game/state';

export const Landing = () => {
  const startCountry = useAtomValue(gameState.startCountryAtom);
  const endCountry = useAtomValue(gameState.endCountryAtom);

  useEffect(() => {
    emitCenterCountries([startCountry, endCountry]);
  }, [endCountry, startCountry]);

  return (
    <div className='bg-background h-screen w-screen relative'>
      <DebugInfo />
      <Map />
      <NavBar className={tw('absolute bottom-0 left-0 right-0')} />
    </div>
  );
};
