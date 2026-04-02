import { useAtomValue } from 'jotai';
import { tw } from '../layout/tw';
import { useRef } from 'react';
import * as gameState from '../game/state';
import { useOnKeyDown } from './useOnKeyDown';
import { RoundSummary } from './RoundSummary';
import { ColorKey } from './ColorKey';
import { NavInput } from './NavInput';

export const NavBar = (props: { className?: string }) => {
  const isColorKeyOpen = useAtomValue(gameState.showColorKeyAtom);
  const isRoundComplete = useAtomValue(gameState.isRoundCompleteAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useOnKeyDown({ navRef, inputRef });

  return (
    <nav ref={navRef} className={tw('z-50', props.className)}>
      <div className='flex relative flex-col gap-2 p-2 w-full max-w-5xl sm:mx-auto sm:px-2'>
        {isRoundComplete && isColorKeyOpen && <ColorKey />}
        {isRoundComplete && <RoundSummary />}
        {!isRoundComplete && <NavInput ref={inputRef} />}
      </div>
    </nav>
  );
};
