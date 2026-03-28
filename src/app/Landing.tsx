import { NavBar } from './NavBar';
import { WorldMapCanvas } from '../map/WorldMapCanvas';
import { tw } from '../layout/tw';

export const Landing = () => {
  return (
    <div className='bg-background h-screen w-screen relative'>
      <WorldMapCanvas />
      <NavBar className={tw('absolute bottom-0 left-0 right-0')} />
    </div>
  );
};
