import { NavBar } from './NavBar';
import { WorldMap } from '../map/WorldMap';
import { tw } from '../layout/tw';

export const Landing = () => {
  return (
    <div className='bg-background h-screen w-screen relative'>
      <WorldMap />
      <NavBar className={tw('absolute bottom-0 left-0 right-0')} />
    </div>
  );
};
