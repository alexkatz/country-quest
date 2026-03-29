type Colors = {
  surface: string;
  text: string;
  land: string;
  landHover: string;
  landCentered: string;
  globeBorder: string;
  countryBorder: string;
  unguessed: string;
  unguessedHover: string;
  labelOutline: string;
};

let cached: Colors | null = null;

export const getColors = (): Colors => {
  if (cached) return cached;

  const style = getComputedStyle(document.documentElement);
  const text = style.getPropertyValue('--color-text').trim();
  const land = style.getPropertyValue('--color-land').trim();

  cached = {
    surface: style.getPropertyValue('--color-surface').trim(),
    text,
    land: `color-mix(in srgb, ${land} 69%, transparent)`,
    landHover: `color-mix(in srgb, ${land} 70%, transparent)`,
    landCentered: `color-mix(in srgb, ${land} 50%, transparent)`,
    globeBorder: `color-mix(in oklch, ${text} 30%, transparent)`,
    countryBorder: `color-mix(in oklch, ${text} 50%, transparent)`,
    unguessed: `color-mix(in oklch, ${text} 10%, transparent)`,
    unguessedHover: `color-mix(in oklch, ${text} 15%, transparent)`,
    labelOutline: 'color-mix(in oklch, black 50%, transparent)',
  };

  return cached;
};
