import { atom } from 'jotai';
import { type Country } from './countries';
import type { AnimationConfig } from '@react-spring/web';
import { getIsMobileSafari } from '../layout/common/getIsMobileSafari';

export const hoveredCountryAtom = atom<Country | undefined>();
export const lastCenteredCountriesAtom = atom<Country[] | undefined>();
export const mouseGlobePosAtom = atom<[number, number] | undefined>();

export const DEG = Math.PI / 180;
export const GLOBE_SIZE = 600;
export const MIN_SCALE = 100;
export const DEFAULT_SCALE = 250;

export const MAX_SCALE = 1700;
export const ROTATION_SENSITIVITY = getIsMobileSafari() ? 0.4 : 0.2;
export const ZOOM_SENSITIVITY = 100;
export const PINCH_ZOOM_SENSITIVITY = 10_000;
export const KEYBOARD_ZOOM_STEP = 200;

export const ROTATION_SPRING_CONFIG = {
  tension: 280,
  friction: 25,
} satisfies Partial<AnimationConfig>;

export const SCALE_SPRING_CONFIG = {
  tension: 280,
  friction: 60,
} satisfies Partial<AnimationConfig>;

export const VIEWPORT_OFFSET_SPRING_CONFIG = {
  tension: 200,
  friction: 30,
} satisfies Partial<AnimationConfig>;
