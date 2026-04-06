import type { ReactNode } from 'react';
import { CountryPill } from './CountryPill';
import { createCountryPillEvents } from './createCountryPillEvents';
import * as gameState from '../game/state';
import { useAtomValue } from 'jotai';

const Step = (props: { n: number; children: ReactNode }) => (
  <div className='flex gap-2 items-start'>
    <span className='text-xs font-mono text-text/40 mt-0.5 shrink-0'>
      {props.n}.
    </span>
    <span className='text-xs text-text/70 leading-relaxed'>
      {props.children}
    </span>
  </div>
);

export const Help = () => {
  const start = useAtomValue(gameState.startCountryAtom);
  const end = useAtomValue(gameState.endCountryAtom);
  return (
    <div className='absolute bottom-full right-2 bg-background/30 flex flex-col gap-3 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm/20 p-3 w-72'>
      <div className='text-sm font-semibold opacity-60'>
        Uh... What even is this?
      </div>
      <div className='flex flex-col gap-2'>
        <Step n={1}>
          You're given a{' '}
          <CountryPill
            className='bg-terminal/60 inline text-xs px-1'
            country={start}
            children='start'
            {...createCountryPillEvents(start)}
          />{' '}
          and{' '}
          <CountryPill
            className='bg-terminal/60 inline text-xs px-1'
            country={end}
            children='end'
            {...createCountryPillEvents(end)}
          />{' '}
          country. Your goal is to connect them.
        </Step>
        <Step n={2}>
          Type any country name to reveal it on the globe. Revealed countries
          that share a border become{' '}
          <CountryPill className='bg-connected/60 inline text-xs px-1'>
            connected
          </CountryPill>
          .
        </Step>
        <Step n={3}>
          The round ends when start and end are joined by an unbroken chain of
          connected countries.
        </Step>
        <Step n={4}>
          After the round, your path is compared to the{' '}
          <CountryPill className='bg-optimal/80 inline text-xs px-1'>
            shortest possible route
          </CountryPill>
          . Fewer reveals is better.
        </Step>
        <Step n={5}>
          Inspired by{' '}
          <a
            href='https://travle.earth/'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity'
          >
            travle.earth
          </a>
          . Go play that first, honestly.
        </Step>
      </div>
    </div>
  );
};
