import { atom } from 'jotai';
import { type Country } from './countries';
import type { AnimationConfig } from '@react-spring/web';

export const hoveredCountryAtom = atom<Country | undefined>();
export const lastCenteredCountriesAtom = atom<Country[] | undefined>();
export const mouseGlobePosAtom = atom<[number, number] | undefined>();

export const DEG = Math.PI / 180;
export const GLOBE_SIZE = 600;
export const MIN_SCALE = 100;
export const DEFAULT_SCALE = 250;

export const MAX_SCALE = 1700;
export const ROTATION_SENSITIVITY = 0.15;
export const ZOOM_SENSITIVITY = 100;

export const ROTATION_SPRING_CONFIG = {
  tension: 280,
  friction: 25,
} satisfies Partial<AnimationConfig>;

export const SCALE_SPRING_CONFIG = {
  tension: 280,
  friction: 60,
} satisfies Partial<AnimationConfig>;
