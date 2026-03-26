import { useAtom } from 'jotai';
import { themeAtom } from '../layout/themeAtom';
import { Button } from '../layout/common/Button';
import { Sun, Moon } from 'lucide-react';
import { tw } from '../layout/tw';

export const NavBar = (props: { className?: string }) => {
  const [theme, setTheme] = useAtom(themeAtom);
  const Icon = theme === 'dark' ? Moon : Sun;
  return (
    <nav
      className={tw(
        'flex p-2 justify-between bg-surface/50 backdrop-blur-2xl shadow-sm/20',
        props.className,
      )}
    >
      <div className='text-xl opacity-60'>
        connect countries together and stuff
      </div>
      <Button
        className='ml-auto bg-surface flex items-center gap-2'
        onClick={() => {
          setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        }}
      >
        <Icon className='opacity-60' />
        {theme === 'dark' ? 'Dark' : 'Light'}
      </Button>
    </nav>
  );
};
