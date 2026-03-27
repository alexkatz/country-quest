import { useAtom } from 'jotai';
import { themeAtom } from '../layout/themeAtom';
import { Button } from '../layout/common/Button';
import { Sun, Moon } from 'lucide-react';
import { tw } from '../layout/tw';
import { useEffect, useRef, useState } from 'react';
import {
  countries,
  visibleCountriesAtom,
  type Country,
} from '../map/countries';
import { emitCenterCountries } from '../map/globeEvents';
import { useGesture } from '@use-gesture/react';

const fuzzyMatch = (name: string, t: string) => {
  const n = name.toLowerCase();
  const q = t.toLowerCase();
  let qi = 0;
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++;
  }
  return qi === q.length;
};

export const NavBar = (props: { className?: string }) => {
  const [theme, setTheme] = useAtom(themeAtom);
  const [visibleCountries, setVisibleCountries] = useAtom(visibleCountriesAtom);
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions =
    term.length === 0
      ? []
      : countries.filter(
          ({ name }) =>
            fuzzyMatch(name, term) &&
            !visibleCountries.some((c) => c.name === name),
        );

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const onSelectCountry = (country: Country) => {
    if (!visibleCountries.some((c) => c.id === country.id)) {
      setVisibleCountries((prev) => [...prev, country]);
      setTerm('');
      inputRef.current?.focus();
      emitCenterCountries([country]);
    }
  };

  const Icon = theme === 'dark' ? Moon : Sun;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const bindGesture = useGesture({
    onKeyDown({ event }) {
      if (
        event.key === 'ArrowDown' ||
        (event.key === 'Tab' && !event.shiftKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, suggestions.length - 1),
        );
      } else if (
        event.key === 'ArrowUp' ||
        (event.key === 'Tab' && event.shiftKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const country = suggestions[selectedSuggestionIndex];
        if (country) {
          onSelectCountry(country);
        }
      }
    },
  });

  return (
    <nav className={tw('flex flex-col gap-2 p-2 z-50', props.className)}>
      {suggestions.length > 0 && (
        <div className='bg-background/30 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm/20 p-2'>
          {suggestions.map((country, i) => {
            return (
              <button
                key={country.name}
                className={tw(
                  'p-1 w-full flex items-center justify-start hover:bg-text/20 rounded-lg cursor-pointer',
                  i === selectedSuggestionIndex && 'bg-text/20',
                )}
                onClick={() => onSelectCountry(country)}
              >
                {country.name}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={
          'flex flex-col gap-2 p-2 justify-between bg-background/30 rounded-lg border border-text/30 backdrop-blur-2xl shadow-sm/20'
        }
      >
        <div className='flex items-center gap-2'>
          {/* <div className='text-xl opacity-60'>Path</div> */}
          <input
            className='bg-background/40 flex-1 p-2 border border-text/30 shadow-sm/20 rounded-lg'
            placeholder='search for a country...'
            value={term}
            onChange={(e) => {
              setSelectedSuggestionIndex(0);
              setTerm(e.target.value);
            }}
            ref={inputRef}
            autoFocus
            {...bindGesture()}
          />

          <Button className='self-stretch bg-background/40'>reveal</Button>

          <Button
            className='ml-auto border-none p-0 shadow-none self-stretch bg-none flex items-center gap-2'
            onClick={() => {
              setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
            }}
          >
            <Icon className='opacity-60' />
          </Button>
        </div>

        <div className='flex gap-2 flex-wrap'>
          {visibleCountries.map((country) => (
            <button
              key={country.id}
              className='flex items-center gap-1 cursor-pointer interactive-opacity rounded-lg py-1 px-2 bg-surface border border-text/30 shadow-sm/20'
              onMouseEnter={() => emitCenterCountries([country])}
              onClick={() => emitCenterCountries([country])}
            >
              {country.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
