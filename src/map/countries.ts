import { feature as topoFeature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import countriesData from './data/countries-simplified.json';
import type { CountriesGeoJSON } from './types';
import { geoCentroid } from 'd3-geo';
import { DEG } from './state';
import { processGeoData } from './processGeoData';

const countryGeoData = processGeoData(
  topoFeature(
    countriesData as unknown as Topology,
    (countriesData as unknown as Topology).objects.countries,
  ) as unknown as CountriesGeoJSON,
);

export const countries = countryGeoData.features.map(feature => {
  const [lon, lat] = geoCentroid(feature);
  return {
    id: feature.id as string,
    name: feature.properties.name,
    feature,
    centroid: [lon * DEG, lat * DEG],
  };
});

export type Country = (typeof countries)[number];
