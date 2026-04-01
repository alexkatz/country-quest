type Colors = {
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

    connected: `color-mix(in oklch, ${connected} 80%, transparent)`,
    connectedHover: `color-mix(in oklch, ${connected} 60%, transparent)`,

    terminal,
    terminalHover: `color-mix(in oklch, ${terminal} 50%, transparent)`,

    optimal: `color-mix(in oklch, ${optimal} 80%, transparent)`,
    optimalHover: `color-mix(in oklch, ${optimal} 60%, transparent)`,

    globeBorder: `color-mix(in oklch, ${text} 30%, transparent)`,
    countryBorder: `color-mix(in oklch, ${text} 50%, transparent)`,

    revealed: `color-mix(in oklch, ${text} 60%, transparent)`,
    revealedHover: `color-mix(in oklch, ${text} 40%, transparent)`,

    unrevealed: `color-mix(in oklch, ${text} 10%, transparent)`,
    unrevealedHover: `color-mix(in oklch, ${text} 30%, transparent)`,

    labelOutline: 'color-mix(in oklch, black 50%, transparent)',
  };

  return cached;
};
