import { useEffect, useEffectEvent } from 'react';
import { globeEvents } from '../map/globeEvents';
import { KEYBOARD_ZOOM_STEP } from '../map/state';
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

    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.shiftKey) {
      e.preventDefault();
      globeEvents.emit(
        'scale',
        e.key === 'ArrowUp' ? KEYBOARD_ZOOM_STEP : -KEYBOARD_ZOOM_STEP,
      );
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const rows = Array.from(
        props.navRef.current?.querySelectorAll<HTMLElement>(
          '[data-pill-row]',
        ) ?? [],
      );
      if (rows.length === 0) return;
      e.preventDefault();
      const focused = document.activeElement as HTMLElement;
      if (!focused?.hasAttribute('data-country-pill')) {
        const edgeRow = rows[e.key === 'ArrowDown' ? 0 : rows.length - 1];
        const edgePills = Array.from(
          edgeRow.querySelectorAll<HTMLElement>('[data-country-pill]'),
        );
        edgePills[e.key === 'ArrowDown' ? 0 : edgePills.length - 1]?.focus();
        return;
      }
      const rowIndex = rows.findIndex(row => row.contains(focused));
      if (rowIndex === -1) return;
      const nextRowIndex = e.key === 'ArrowDown' ? rowIndex + 1 : rowIndex - 1;
      if (nextRowIndex < 0 || nextRowIndex >= rows.length) return;
      const pillIndexInRow = Array.from(
        rows[rowIndex].querySelectorAll<HTMLElement>('[data-country-pill]'),
      ).indexOf(focused);
      const nextPills = Array.from(
        rows[nextRowIndex].querySelectorAll<HTMLElement>('[data-country-pill]'),
      );
      nextPills[Math.min(pillIndexInRow, nextPills.length - 1)]?.focus();
      return;
    }

    if (e.key === 'Escape') {
      globeEvents.emit('center', [startCountry, endCountry]);
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
