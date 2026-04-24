import { useAtomValue, useStore } from 'jotai';
import { tw } from '../layout/tw';
import { useRef } from 'react';
import * as gameState from '../game/state';
import * as layoutState from '../layout/state';
import { useOnKeyDown } from './useOnKeyDown';
import { RoundSummary } from './RoundSummary';
import { RoundActions } from './RoundActions';
import { Help } from './Help';
import { useObserveSizeSilently } from '../layout/common/useObserveSize';

export const NavBar = (props: { className?: string }) => {
  const store = useStore();
  const isHelpOpen = useAtomValue(gameState.showHelpAtom);
  const isRoundComplete = useAtomValue(gameState.isRoundCompleteAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useObserveSizeSilently({
    ref: navRef,
    dimension: 'height',
    onSizeChange(height) {
      store.set(layoutState.navBarHeightAtom, height);
    },
  });

  useOnKeyDown({ navRef, inputRef });

  return (
    <nav ref={navRef} className={tw('z-50', props.className)}>
      <div className='flex relative flex-col gap-2 p-2 w-full max-w-7xl sm:mx-auto sm:px-2'>
        {isHelpOpen && <Help />}
        {isRoundComplete && <RoundSummary />}
        {!isRoundComplete && <RoundActions ref={inputRef} />}
      </div>
    </nav>
  );
};
