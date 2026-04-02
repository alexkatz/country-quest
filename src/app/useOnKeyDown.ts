import { useEffect, useEffectEvent } from 'react';
import { emitCenterCountries } from '../map/globeEvents';
import { useStore } from 'jotai';
import * as gameState from '../game/state';

export const useOnKeyDown = (props: {
  navRef: React.RefObject<HTMLElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) => {
  const store = useStore();

  const handleOnKeyDown = useEffectEvent((e: globalThis.KeyboardEvent) => {
    const startCountry = store.get(gameState.startCountryAtom);
    const endCountry = store.get(gameState.endCountryAtom);
    const isRoundComplete = store.get(gameState.isRoundCompleteAtom);

    // if user is currently typing in the input, only handle escape
    if (
      document.activeElement === props.inputRef.current &&
      props.inputRef.current &&
      props.inputRef.current.value.length > 0
    ) {
      if (e.key === 'Escape') {
        e.preventDefault();
        store.set(gameState.termAtom, '');
        props.inputRef.current?.blur();
      }

      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const pills = Array.from(
        props.navRef.current?.querySelectorAll<HTMLElement>(
          '[data-country-pill]',
        ) ?? [],
      );
      if (pills.length === 0) return;
      e.preventDefault();
      const focused = pills.indexOf(document.activeElement as HTMLElement);
      if (focused === -1) {
        pills[e.key === 'ArrowRight' ? 0 : pills.length - 1]?.focus();
      } else {
        const next = e.key === 'ArrowRight' ? focused + 1 : focused - 1;
        pills[Math.max(0, Math.min(next, pills.length - 1))]?.focus();
      }

      return;
    }

    if (e.key === 'Escape') {
      emitCenterCountries([startCountry, endCountry]);
      if (document.activeElement?.hasAttribute('data-country-pill')) {
        (document.activeElement as HTMLElement).blur();
      }
    }

    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isRoundComplete) return;
    props.inputRef.current?.focus();
  });

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener('keydown', handleOnKeyDown, controller);
    return () => controller.abort();
  }, []);
};
