import { useAtom, useAtomValue, useStore } from 'jotai';
import { tw } from '../layout/tw';
import { useEffect, useRef, useState } from 'react';
import { countries, type Country } from '../map/countries';
import { emitCenterCountries } from '../map/globeEvents';
import { useGesture } from '@use-gesture/react';
import { Button } from '../layout/common/Button';
import { Dot, Map, Square, SquareCheck, Type } from 'lucide-react';
import {
  showAllCountriesAtom,
  showAllNamesAtom,
  revealedCountriesAtom,
  startCountryAtom,
  endCountryAtom,
  isRoundCompleteAtom,
  connectedRevealedCountriesAtom,
  winningPathAtom,
  currentPathAtom,
  connectedRevealedSuperfluouslyAtom,
} from '../game/state';
import { CountryPill } from './CountryPill';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const fuzzyMatch = (name: string, t: string) => {
  const n = normalize(name);
  const q = normalize(t);
  let qi = 0;
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++;
  }
  return qi === q.length;
};

const matchScore = (name: string, t: string) => {
  const n = normalize(name);
  const q = normalize(t);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  return 2;
};

export const NavBar = (props: { className?: string }) => {
  const store = useStore();

  const [revealedCountries, setRevealedCountries] = useAtom(
    revealedCountriesAtom,
  );

  const connectedRevealedCountries = useAtomValue(
    connectedRevealedCountriesAtom,
  );

  const startCountry = useAtomValue(startCountryAtom);
  const endCountry = useAtomValue(endCountryAtom);

  const [showAllCountries, setShowAllCountries] = useAtom(showAllCountriesAtom);
  const [showAllNames, setShowAllNames] = useAtom(showAllNamesAtom);

  const isRoundComplete = useAtomValue(isRoundCompleteAtom);
  const winningPath = useAtomValue(winningPathAtom);
  const currentPath = useAtomValue(currentPathAtom);
  const connectedRevealedSuperfluously = useAtomValue(
    connectedRevealedSuperfluouslyAtom,
  );

  const isWinningPathOptimal = winningPath.length === currentPath.length;

  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions =
    term.length === 0
      ? []
      : countries
          .filter(
            ({ name }) =>
              fuzzyMatch(name, term) &&
              !revealedCountries.some(c => c.name === name) &&
              name !== startCountry.name &&
              name !== endCountry.name,
          )
          .sort((a, b) => matchScore(a.name, term) - matchScore(b.name, term));

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const onRevealCountry = (country: Country) => {
    if (!revealedCountries.some(c => c.id === country.id)) {
      setRevealedCountries(prev => [...prev, country]);
      setTerm('');
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (store.get(isRoundCompleteAtom)) return;
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);

  const bindGesture = useGesture({
    onKeyDown({ event }) {
      if (
        event.key === 'ArrowDown' ||
        (event.key === 'Tab' && !event.shiftKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex(prev =>
          Math.min(prev + 1, suggestions.length - 1),
        );
      } else if (
        event.key === 'ArrowUp' ||
        (event.key === 'Tab' && event.shiftKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const country = suggestions[selectedSuggestionIndex];
        if (country) {
          onRevealCountry(country);
        }
      }
    },
  });

  const createCountryPillEvents = (country: Country) => ({
    onMouseEnter: () => emitCenterCountries([country]),
    onFocus: () => emitCenterCountries([country]),
    onClick: () => emitCenterCountries([country]),
  });

  return (
    <nav className={tw('z-50', props.className)}>
      <div className='flex flex-col gap-2 p-2 w-full max-w-5xl sm:mx-auto sm:px-2'>
        {!isRoundComplete && suggestions.length > 0 && (
          <div className='bg-background/30 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm/20 p-2'>
            {suggestions.map((country, i) => {
              return (
                <button
                  key={country.name}
                  className={tw(
                    'p-1 w-full flex items-center justify-start hover:bg-text/20 rounded-lg cursor-pointer',
                    i === selectedSuggestionIndex && 'bg-text/20',
                  )}
                  onClick={() => onRevealCountry(country)}
                >
                  {country.name}
                </button>
              );
            })}
          </div>
        )}

        {isRoundComplete && (
          <div className='bg-background/30 rounded-lg border border-text/30 backdrop-blur-2xl flex flex-col gap-2 shadow-sm/20 p-4'>
            <div className='text-4xl leading-12'>
              You connected{' '}
              <CountryPill
                className='font-bold bg-terminal/60 inline'
                country={startCountry}
                {...createCountryPillEvents(startCountry)}
              />{' '}
              to{' '}
              <CountryPill
                className='font-bold bg-terminal/60 inline'
                country={endCountry}
                {...createCountryPillEvents(endCountry)}
              />
            </div>

            <div className='text-lg'>
              <Dot />
              Your path is
              {isWinningPathOptimal ? (
                <span>
                  {' '}
                  <span className='font-bold'>optimal</span>, at
                </span>
              ) : (
                ' '
              )}{' '}
              <span className='font-bold'>{winningPath.length}</span> countries
              long:
            </div>

            <div className='flex gap-1 flex-wrap ml-8'>
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

            <div className='text-lg'>
              <Dot />
              You revealed{' '}
              <span className='font-bold'>{revealedCountries.length}</span>{' '}
              countries in total:
            </div>

            <div className='flex gap-1 flex-wrap ml-8'>
              {revealedCountries.map(country => (
                <CountryPill
                  key={country.id}
                  className={tw(
                    'bg-connected/60',
                    connectedRevealedSuperfluously.includes(country) &&
                      'bg-connected/20',
                    !connectedRevealedCountries.includes(country) &&
                      'bg-text/20',
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
                  The optimal path is{' '}
                  <span className='font-bold'>{currentPath.length}</span>{' '}
                  countries long:
                </div>

                <div className='flex gap-1 flex-wrap ml-8'>
                  {currentPath.map(country => (
                    <CountryPill
                      key={country.id}
                      className={tw(
                        'bg-connected/60',
                        (country === startCountry || country === endCountry) &&
                          'bg-terminal/60',
                        !winningPath.includes(country) && 'bg-text/20!',
                      )}
                      country={country}
                      {...createCountryPillEvents(country)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!isRoundComplete && (
          <div className='flex flex-col gap-2 bg-background/40 backdrop-blur-2xl rounded-lg border border-text/30 shadow-sm/20 p-2'>
            <div className='flex items-center gap-1'>
              <input
                className={tw(
                  'flex-1 p-2 focus:outline-none bg-transparent cursor-default',
                  term.length === 0 && 'caret-transparent',
                )}
                placeholder='Start typing to reveal a country...'
                tabIndex={-1}
                disabled={isRoundComplete}
                value={term}
                onChange={e => {
                  setSelectedSuggestionIndex(0);
                  setTerm(e.target.value);
                }}
                ref={inputRef}
                autoFocus
                {...bindGesture()}
              />

              <Button
                className='self-stretch items-center gap-2 flex border-none shadow-none'
                onClick={() => {
                  if (showAllCountries) {
                    setShowAllNames(false);
                  }

                  setShowAllCountries(prev => !prev);
                }}
              >
                {showAllCountries ? <SquareCheck /> : <Square />}{' '}
                <Map className='opacity-50' />
              </Button>

              <Button
                disabled={!showAllCountries}
                className='self-stretch items-center gap-2 flex border-none shadow-none'
                onClick={() => setShowAllNames(prev => !prev)}
              >
                {showAllNames ? <SquareCheck /> : <Square />}{' '}
                <Type className='opacity-50' />
              </Button>
            </div>

            <div className='flex gap-1 flex-wrap'>
              {[startCountry, ...revealedCountries, endCountry].map(country => (
                <CountryPill
                  key={country.id}
                  className={tw(
                    connectedRevealedCountries.some(c => c.id === country.id) &&
                      'bg-connected/60',
                    (country === startCountry || country === endCountry) &&
                      'bg-terminal/60',
                  )}
                  country={country}
                  {...createCountryPillEvents(country)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
