import { NavBar } from './NavBar';
import { Map } from '../map/Map';
import { tw } from '../layout/tw';
import { DebugInfo } from './DebugInfo';

export const Landing = () => {
  return (
    <div className='bg-background h-screen w-screen relative'>
      <DebugInfo />
      <Map />
      <NavBar className={tw('absolute bottom-0 left-0 right-0')} />
    </div>
  );
};
