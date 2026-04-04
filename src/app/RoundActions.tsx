import { atom, useAtom, useAtomValue } from 'jotai';
import { useState, type RefObject } from 'react';
import { fuzzy } from '../layout/common/fuzzy';
import { countries, type Country } from '../map/countries';
import * as gameState from '../game/state';
import { useGesture } from '@use-gesture/react';
import { tw } from '../layout/tw';
import { Info, Map, Square, SquareCheck, Type } from 'lucide-react';
import { Button } from '../layout/common/Button';
import { CountryPill } from './CountryPill';
import { createCountryPillEvents } from './createCountryPillEvents';

export const RoundActions = (props: {
  ref: RefObject<HTMLInputElement | null>;
}) => {
  const [revealedCountries, setRevealedCountries] = useAtom(
    gameState.revealedCountriesAtom,
  );
  const connectedRevealedCountries = useAtomValue(
    gameState.connectedRevealedCountriesAtom,
  );
  const [showAllNames, setShowAllNames] = useAtom(gameState.showAllNamesAtom);
  const startCountry = useAtomValue(gameState.startCountryAtom);
  const endCountry = useAtomValue(gameState.endCountryAtom);
  const [showAllCountries, setShowAllCountries] = useAtom(
    gameState.showAllCountriesAtom,
  );
  const isRoundComplete = useAtomValue(gameState.isRoundCompleteAtom);
  const [selectedSuggestionIndexAtom] = useState(() => atom(0));
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useAtom(
    selectedSuggestionIndexAtom,
  );
  const [term, setTerm] = useAtom(gameState.termAtom);

  const [isHelpOpen, setHelpOpen] = useAtom(gameState.showHelpAtom);

  const suggestions =
    term.length === 0
      ? []
      : countries
          .filter(
            ({ name }) =>
              fuzzy.match(name, term) &&
              !revealedCountries.some(c => c.name === name) &&
              name !== startCountry.name &&
              name !== endCountry.name,
          )
          .sort(
            (a, b) => fuzzy.score(a.name, term) - fuzzy.score(b.name, term),
          );

  const onRevealCountry = (country: Country) => {
    if (!revealedCountries.includes(country)) {
      setRevealedCountries(prev => [...prev, country]);
      setTerm('');
      props.ref.current?.focus();
    }
  };

  const bindInputGesture = useGesture({
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

  return (
    <>
      {suggestions.length > 0 && (
        <div className='bg-background/30 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm p-2'>
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

      <div className='flex flex-col gap-2 bg-background/30 backdrop-blur-2xl rounded-lg border border-text/30 shadow-sm p-2'>
        <div className='flex items-center gap-1'>
          <input
            {...props}
            className={tw(
              'flex-1 p-2 focus:outline-none bg-transparent cursor-default',
              term.length === 0 && 'caret-transparent',
            )}
            placeholder='Type anywhere to reveal a country...'
            tabIndex={-1}
            disabled={isRoundComplete}
            value={term}
            onChange={e => {
              setSelectedSuggestionIndex(0);
              setTerm(e.target.value);
            }}
            autoFocus
            {...bindInputGesture()}
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

          <button
            className={tw(
              'cursor-pointer interactive-opacity p-1 border border-transparent shadow-sm rounded-lg',
              isHelpOpen && 'bg-text/30 border-text/30',
              !isHelpOpen && 'shadow-transparent',
            )}
            onClick={() => setHelpOpen(prev => !prev)}
          >
            <Info />
          </button>
        </div>

        <div className='flex gap-1 flex-wrap'>
          {[startCountry, ...revealedCountries, endCountry].map(country => (
            <CountryPill
              key={country.id}
              className={tw(
                connectedRevealedCountries.includes(country) &&
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
    </>
  );
};
