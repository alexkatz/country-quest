import { CountryPath } from './CountryPath';
import countriesData from './data/countries-110m.json';
import { GLOBE_SIZE, useGlobe } from './useGlobe';
import type { CountriesGeoJSON } from './types';

const countries = countriesData as CountriesGeoJSON;

export const WorldMap = () => {
  const { projection, path, bind, rotateTo } = useGlobe();

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden touch-none'>
      <svg
        viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
        className='h-full w-full touch-none'
        {...bind()}
      >
        <circle
          cx={GLOBE_SIZE / 2}
          cy={GLOBE_SIZE / 2}
          r={projection.scale()}
          className='fill-surface/40 stroke-text/30 stroke-[0.5]'
        />
        {countries.features.map((feature) => (
          <CountryPath
            key={feature.properties.ISO_A3}
            feature={feature}
            path={path}
            onClick={() => rotateTo(feature)}
          />
        ))}
      </svg>
    </div>
  );
};
