import type { PropsWithChildren, ReactNode } from 'react';
import {
  ArrowBigUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerDownLeft,
  Mouse,
  Plus,
} from 'lucide-react';
import { tw } from '../layout/tw';

const Key = (props: PropsWithChildren<{ className?: string }>) => (
  <div
    className={tw(
      'inline-flex items-center justify-center h-5 min-w-5 p-1',
      'rounded border border-text/30 bg-text/20 shadow-sm',
      'text-xs font-mono leading-none text-text/70',
      props.className,
    )}
  >
    {props.children}
  </div>
);

const MouseAction = (props: { label: string }) => (
  <span className='inline-flex items-center gap-1 text-xs text-text/70'>
    <Mouse className='text-lg' />
    <span className='opacity-70 font-bold italic text-[10px]'>
      {props.label}
    </span>
  </span>
);

const Row = (props: { children: ReactNode; description: string }) => (
  <>
    <div className='flex items-center gap-1 justify-end'>{props.children}</div>
    <span className='text-xs text-text/50 self-center'>
      {props.description}
    </span>
  </>
);

export const ShortcutGuide = (props: { className?: string }) => {
  return (
    <div
      className={tw(
        'grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 rounded-lg',
        props.className,
      )}
    >
      <Row description='Navigate revealed countries at any time'>
        <Key>
          <ArrowLeft />
        </Key>
        <Key>
          <ArrowUp />
        </Key>
        <Key>
          <ArrowRight />
        </Key>
        <Key>
          <ArrowDown />
        </Key>
      </Row>

      <Row description='Center globe on start & end countries'>
        <Key className='italic'>Esc</Key>
      </Row>

      <Row description='Search countries'>
        <Key className='italic'>A–z</Key>
      </Row>

      <Row description='Reveal selected country'>
        <Key>
          <CornerDownLeft />
        </Key>
      </Row>

      <Row description='Zoom in / out'>
        <Key>
          <ArrowBigUp />
          <Plus className='opacity-60 text-[10px]' />
          <ArrowUp />
        </Key>
        <Key>
          <ArrowBigUp />
          <Plus className='opacity-60 text-[10px]' />
          <ArrowDown />
        </Key>
      </Row>

      <Row description='Zoom in / out'>
        <MouseAction label='Scroll' />
      </Row>

      <Row description='Rotate globe'>
        <MouseAction label='Drag' />
      </Row>
    </div>
  );
};
