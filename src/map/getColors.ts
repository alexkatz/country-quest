type Colors = {
  surface: string;
  text: string;
  terminal: string;
  terminalHover: string;
  connected: string;
  connectedHover: string;
  connectedSuperfluously: string;
  connectedSuperfluouslyHover: string;
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
  const text = style.getPropertyValue('--color-text').trim();
  const terminal = style.getPropertyValue('--color-terminal').trim();
  const connected = style.getPropertyValue('--color-connected').trim();

  cached = {
    surface: style.getPropertyValue('--color-surface').trim(),
    text,
    connected,
    connectedHover: `color-mix(in oklch, ${connected} 80%, transparent)`,
    connectedSuperfluously: `color-mix(in oklch, ${connected} 50%, transparent)`,
    connectedSuperfluouslyHover: `color-mix(in oklch, ${connected} 40%, transparent)`,
    terminal,
    terminalHover: `color-mix(in oklch, ${terminal} 50%, transparent)`,
    globeBorder: `color-mix(in oklch, ${text} 30%, transparent)`,
    countryBorder: `color-mix(in oklch, ${text} 50%, transparent)`,
    revealed: `color-mix(in oklch, ${text} 60%, transparent)`,
    revealedHover: `color-mix(in oklch, ${text} 40%, transparent)`,
    unrevealed: `color-mix(in oklch, ${text} 10%, transparent)`,
    unrevealedHover: `color-mix(in oklch, ${text} 20%, transparent)`,
    labelOutline: 'color-mix(in oklch, black 50%, transparent)',
  };

  return cached;
};
