export type Colors = {
  surface: string;
  text: string;
  terminal: string;
  terminalHover: string;
  optimal: string;
  optimalHover: string;
  connected: string;
  connectedHover: string;
  globeBorder: string;
  countryBorder: string;
  graticuleLine: string;
  revealed: string;
  revealedHover: string;
  unrevealed: string;
  unrevealedHover: string;
  labelOutline: string;
};

let cached: Colors | null = null;

export const getColors = (): Colors => {
  if (cached) return cached;

  const style = getComputedStyle(document.documentElement);
  const surface = style.getPropertyValue('--color-surface').trim();
  const text = style.getPropertyValue('--color-text').trim();
  const terminal = style.getPropertyValue('--color-terminal').trim();
  const connected = style.getPropertyValue('--color-connected').trim();
  const optimal = style.getPropertyValue('--color-optimal').trim();

  cached = {
    surface,
    text,

    connected,
    connectedHover: `color-mix(in oklch, ${connected} 75%, transparent)`,

    terminal,
    terminalHover: `color-mix(in oklch, ${terminal} 75%, transparent)`,

    optimal: `color-mix(in oklch, ${optimal} 80%, ${surface})`,
    optimalHover: `color-mix(in oklch, ${optimal} 60%, ${surface})`,

    globeBorder: `color-mix(in oklch, ${text} 30%, ${surface})`,
    countryBorder: `color-mix(in oklch, ${text} 80%, ${surface})`,
    graticuleLine: `color-mix(in oklch, ${text} 15%, ${surface})`,

    revealed: `color-mix(in oklch, ${text} 60%, ${surface})`,
    revealedHover: `color-mix(in oklch, ${text} 40%, ${surface})`,

    unrevealed: `color-mix(in oklch, ${text} 10%, ${surface})`,
    unrevealedHover: `color-mix(in oklch, ${text} 30%, ${surface})`,

    labelOutline: 'color-mix(in oklch, black 50%, transparent)',
  };

  return cached;
};
