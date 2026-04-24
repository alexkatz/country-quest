import { useAtom, useAtomValue } from 'jotai';
import * as gameState from '../game/state';
import { Info, Dot } from 'lucide-react';
import { tw } from '../layout/tw';
import { CountryPill } from './CountryPill';
import { createCountryPillEvents } from './createCountryPillEvents';

export const RoundSummary = () => {
  const winningPath = useAtomValue(gameState.winningPathAtom);
  const targetPath = useAtomValue(gameState.targetPathAtom);
  const revealedOffPath = useAtomValue(gameState.revealedOffWinningPathAtom);
  const isWinningPathTarget = winningPath.length === targetPath.length;
  const startCountry = useAtomValue(gameState.startCountryAtom);
  const endCountry = useAtomValue(gameState.endCountryAtom);
  const [isHelpOpen, setIsHelpOpen] = useAtom(gameState.showHelpAtom);
  const revealedCountries = useAtomValue(gameState.revealedCountriesAtom);
  return (
    <div className='bg-background/30 relative rounded-lg border border-text/30 flex gap-1 backdrop-blur-2xl shadow-sm/20 p-2 overflow-y-auto max-h-[40dvh]'>
      <button
        className={tw(
          'absolute size-7 grid place-items-center col-start-2 top-2 right-2 cursor-pointer interactive-opacity p-1 border border-transparent shadow-sm rounded-lg',
          isHelpOpen && 'bg-text/30 border-text/30',
          !isHelpOpen && 'shadow-transparent',
        )}
        onClick={() => setIsHelpOpen(prev => !prev)}
      >
        <Info />
      </button>

      <div className='grid gap-1 flex-1'>
        <div className='col-start-1 flex flex-col gap-1'>
          <div className='text-lg'>
            <Dot />
            Your path{' '}
            {isWinningPathTarget ? (
              <span>
                is <span className='font-bold'>target</span>, with
              </span>
            ) : (
              'has'
            )}{' '}
            <span className='font-bold'>{winningPath.length - 2}</span>{' '}
            connecting countries:
          </div>

          <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
            {winningPath.map(country => (
              <CountryPill
                key={country.id}
                className={tw(
                  'bg-connected/60',
                  targetPath.includes(country) && 'bg-target/60',
                  (country === startCountry || country === endCountry) &&
                    'bg-terminal/60',
                )}
                country={country}
                {...createCountryPillEvents(country)}
              />
            ))}
          </div>

          {!isWinningPathTarget && (
            <>
              <div className='text-lg'>
                <Dot />
                The target path has{' '}
                <span className='font-bold'>{targetPath.length - 2}</span>{' '}
                connecting countries:
              </div>

              <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
                {targetPath.map(country => (
                  <CountryPill
                    key={country.id}
                    className={tw(
                      'bg-target/60',
                      (country === startCountry || country === endCountry) &&
                        'bg-terminal/60',
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
                Of the{' '}
                <span className='font-bold'>
                  {revealedCountries.length}
                </span>{' '}
                total countries revealed,{' '}
                <span className='font-bold'>{revealedOffPath.length}</span>{' '}
                {revealedOffPath.length === 1 ? 'is' : 'are'} not part of your
                path:
              </div>

              <div data-pill-row className='flex gap-1 flex-wrap ml-8'>
                {revealedOffPath.map(country => (
                  <CountryPill
                    key={country.id}
                    className={tw(
                      'bg-text/20',
                      targetPath.includes(country) && 'bg-target/60',
                    )}
                    country={country}
                    {...createCountryPillEvents(country)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
