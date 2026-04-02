import { CountryPill } from './CountryPill';

export const ColorKey = () => {
  return (
    <div className='absolute bottom-full right-2 bg-background/30 flex flex-col gap-2 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm/20 p-2'>
      <div className='opacity-60'>Color Key</div>

      <CountryPill className='bg-terminal/60 self-start' children='Start/End' />

      <CountryPill
        className='bg-connected/60 self-start'
        children='Revealed, on path'
      />

      <CountryPill
        className='bg-text/20 self-start'
        children='Revealed, but not on path'
      />

      <CountryPill
        className='bg-optimal/80 self-start'
        children='Optimal path, but not revealed'
      />
    </div>
  );
};
