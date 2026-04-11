import { useAtom, useAtomValue } from 'jotai';
import * as gameState from '../game/state';
import { Info, Dot } from 'lucide-react';
import { tw } from '../layout/tw';
import { CountryPill } from './CountryPill';
import { createCountryPillEvents } from './createCountryPillEvents';

export const RoundSummary = () => {
  const winningPath = useAtomValue(gameState.winningPathAtom);
  const optimalPath = useAtomValue(gameState.optimalPathAtom);
  const missedOptimalPath = useAtomValue(gameState.missedOptimalPathAtom);
  const revealedOffPath = useAtomValue(gameState.revealedOffPathAtom);
  const isWinningPathOptimal = winningPath.length === optimalPath.length;
  const startCountry = useAtomValue(gameState.startCountryAtom);
  const endCountry = useAtomValue(gameState.endCountryAtom);
  const [isHelpOpen, setIsHelpOpen] = useAtom(gameState.showHelpAtom);
  const revealedCountries = useAtomValue(gameState.revealedCountriesAtom);

  const scoreSummary = useAtomValue(gameState.roundScoreSummary)!;

  return (
    <div className='bg-background/30 relative rounded-lg border border-text/30 backdrop-blur-2xl flex flex-col gap-1 shadow-sm/20 p-2'>
      <button
        className={tw(
          'absolute top-2 right-2 cursor-pointer interactive-opacity p-1 border border-transparent shadow-sm rounded-lg',
          isHelpOpen && 'bg-text/30 border-text/30',
          !isHelpOpen && 'shadow-transparent',
        )}
        onClick={() => setIsHelpOpen(prev => !prev)}
      >
        <Info />
      </button>

      <div className='text-lg'>
        <Dot />
        Your path{' '}
        {isWinningPathOptimal ? (
          <span>
            is <span className='font-bold'>optimal</span>, with
          </span>
        ) : (
          'has'
        )}{' '}
        <span className='font-bold'>{winningPath.length - 2}</span> connecting
        countries:
      </div>

      <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
        {winningPath.map(country => (
          <CountryPill
            key={country.id}
            className={tw(
              'bg-connected/60',
              (country === startCountry || country === endCountry) &&
                'bg-terminal/60',
            )}
            country={country}
            {...createCountryPillEvents(country)}
          />
        ))}
      </div>

      {!isWinningPathOptimal && (
        <>
          <div className='text-lg'>
            <Dot />
            The optimal path has{' '}
            <span className='font-bold'>{optimalPath.length - 2}</span>{' '}
            connecting countries:
          </div>

          <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
            {optimalPath.map(country => (
              <CountryPill
                key={country.id}
                className={tw(
                  'bg-connected/60',
                  (country === startCountry || country === endCountry) &&
                    'bg-terminal/60',
                  !winningPath.includes(country) && 'bg-text/20!',
                  missedOptimalPath.includes(country) && 'bg-optimal/80!',
                )}
                country={country}
                {...createCountryPillEvents(country)}
              />
            ))}
          </div>
        </>
      )}

      {revealedOffPath.length > 0 && (
        <>
          <div className='text-lg'>
            <Dot />
            You revealed{' '}
            <span className='font-bold'>{revealedCountries.length}</span>{' '}
            countries. The remaining are:
          </div>

          <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
            {revealedOffPath.map(country => (
              <CountryPill
                key={country.id}
                className='bg-text/20'
                country={country}
                {...createCountryPillEvents(country)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
