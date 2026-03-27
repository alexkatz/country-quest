import { feature as topoFeature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import countriesData from './data/countries-simplified.json';
import type { CountriesGeoJSON } from './types';
import { atom } from 'jotai';

export const countryGeoData = topoFeature(
  countriesData as unknown as Topology,
  (countriesData as unknown as Topology).objects.countries,
) as unknown as CountriesGeoJSON;

countryGeoData.features.forEach((feature) => {
  feature.id = Math.random().toString(36).slice(2);
});

export const countries = countryGeoData.features.map((feature) => ({
  id: feature.id as string,
  name: feature.properties.name,
}));

export type Country = (typeof countries)[number];

export const visibleCountriesAtom = atom<Country[]>([]);
