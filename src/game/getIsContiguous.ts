import { borders } from './borders';

export const getIsContiguous = (
  a: keyof typeof borders,
  b: keyof typeof borders,
) => {
  return borders[a]?.includes(b as never) ?? false;
};
