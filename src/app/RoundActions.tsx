import { atom, useAtom, useAtomValue } from 'jotai';
import { useState, type RefObject } from 'react';
import { fuzzy } from '../layout/common/fuzzy';
import { countries, type Country } from '../map/countries';
import * as gameState from '../game/state';
import { useGesture } from '@use-gesture/react';
import { tw } from '../layout/tw';
import { Info, Map, Type } from 'lucide-react';
import { CountryPill } from './CountryPill';
import { createCountryPillEvents } from './createCountryPillEvents';
import { Button } from '../layout/common/Button';
import { getIsMobileSafari } from '../layout/common/getIsMobileSafari';
import { Popover } from 'react-tiny-popover';

export const RoundActions = (props: {
  ref: RefObject<HTMLInputElement | null>;
}) => {
  const isMobileSafari = getIsMobileSafari();

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
  const [term, setTerm] = useAtom(gameState.termAtom);
  const [isHelpOpen, setHelpOpen] = useAtom(gameState.showHelpAtom);

  const [selectedSuggestionIndexAtom] = useState(() => atom(0));
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useAtom(
    selectedSuggestionIndexAtom,
  );

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
        if (suggestions.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setSelectedSuggestionIndex(prev =>
            Math.min(prev + 1, suggestions.length - 1),
          );
        }
      } else if (
        event.key === 'ArrowUp' ||
        (event.key === 'Tab' && event.shiftKey)
      ) {
        if (suggestions.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
        }
      }
    },
  });

  return (
    <Popover
      isOpen={suggestions.length > 0}
      padding={8}
      positions='top'
      align='start'
      content={
        <div className='bg-background/30 max-w-dvh rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm p-2'>
          {suggestions.map((country, i) => (
            <button
              key={country.id}
              className={tw(
                'p-1 w-full flex items-center justify-start hover:bg-text/20 rounded-lg cursor-pointer',
                i === selectedSuggestionIndex && 'bg-text/20',
              )}
              onClick={() => onRevealCountry(country)}
            >
              {country.name}
            </button>
          ))}
        </div>
      }
    >
      <div className='flex flex-col gap-2 bg-background/30 backdrop-blur-2xl rounded-lg border border-text/30 shadow-sm p-2'>
        <div className='flex items-center gap-1'>
          <form
            className='contents'
            onSubmit={e => {
              e.preventDefault();
              if (suggestions[selectedSuggestionIndex]) {
                onRevealCountry(suggestions[selectedSuggestionIndex]);
              }
            }}
          >
            <input
              {...props}
              className={tw(
                'flex-1 p-2 text-[16px] border border-text/30 rounded-lg bg-text/10 lg:border-none lg:focus:outline-none lg:bg-transparent cursor-default',
                term.length === 0 && 'lg:caret-transparent',
              )}
              placeholder={
                isMobileSafari
                  ? 'Search countries...'
                  : 'Type anywhere to reveal a country...'
              }
              aria-autocomplete='none'
              autoComplete='off'
              disabled={isRoundComplete}
              value={term}
              onChange={e => {
                setSelectedSuggestionIndex(0);
                setTerm(e.target.value);
              }}
              autoFocus
              {...bindInputGesture()}
            />
          </form>

          <Button
            className={tw(
              'border-transparent',
              showAllCountries && 'bg-text/30 border-text/30',
              !showAllCountries && 'shadow-transparent',
            )}
            onClick={() => {
              if (showAllCountries) {
                setShowAllNames(false);
              }

              setShowAllCountries(prev => !prev);
            }}
          >
            <Map />
          </Button>

          <Button
            disabled={!showAllCountries}
            className={tw(
              'border-transparent',
              showAllNames && 'bg-text/30 border-text/30',
              !showAllNames && 'shadow-transparent',
            )}
            onClick={() => setShowAllNames(prev => !prev)}
          >
            <Type />
          </Button>

          <Button
            className={tw(
              'border-transparent',
              isHelpOpen && 'bg-text/30 border-text/30',
              !isHelpOpen && 'shadow-transparent',
            )}
            onClick={() => setHelpOpen(prev => !prev)}
          >
            <Info />
          </Button>
        </div>

        <div data-pill-row className='flex gap-1 flex-wrap'>
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
    </Popover>
  );
};
