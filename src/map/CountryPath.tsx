import type { GeoPath, GeoPermissibleObjects } from 'd3-geo';
import type { CountryFeature } from './types';

type CountryPathProps = {
  feature: CountryFeature;
  path: GeoPath<unknown, GeoPermissibleObjects>;
  onClick: () => void;
};

export const CountryPath = ({ feature, path, onClick }: CountryPathProps) => {
  const d = path(feature) ?? undefined;

  return (
    <path
      d={d}
      data-iso={feature.properties.ISO_A3}
      className='fill-surface stroke-text/50 stroke-[0.1] cursor-pointer hover:fill-text/20'
      onClick={onClick}
    />
  );
};
