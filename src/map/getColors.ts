export type Colors = {
  surface: string;
  text: string;
  terminal: string;
  target: string;
  targetFaded: string;
  connected: string;
  globeBorder: string;
  countryBorder: string;
  graticuleLine: string;
  revealed: string;
  unrevealed: string;
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
  const target = style.getPropertyValue('--color-target').trim();
  const revealed = `color-mix(in oklch, ${text} 50%, ${surface})`;
  const unrevealed = `color-mix(in oklch, ${text} 10%, ${surface})`;

  cached = {
    surface,
    text,
    connected,
    terminal,

    revealed,
    unrevealed,

    target: `color-mix(in srgb, ${target} 100%, ${revealed} 90%)`,
    targetFaded: `color-mix(in srgb, ${target} 60%, ${surface} 100%)`,

    globeBorder: `color-mix(in oklch, ${text} 30%, ${surface})`,
    countryBorder: `color-mix(in oklch, ${text} 80%, ${surface})`,
    graticuleLine: `color-mix(in oklch, ${text} 15%, ${surface})`,

    labelOutline: 'color-mix(in oklch, black 50%, transparent)',
  };

  return cached;
};
