import { NavBar } from './NavBar';
import { useSyncTheme } from '../layout/useSyncTheme';
import { WorldMap } from '../map/WorldMap';

export const Landing = () => {
  useSyncTheme();

  return (
    <div className='bg-background h-screen w-screen relative'>
      <NavBar className='absolute top-0 left-0 right-0' />
      <WorldMap />
    </div>
  );
};
