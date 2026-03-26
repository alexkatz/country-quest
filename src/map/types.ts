import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type CountryProperties = {
  NAME: string;
  ISO_A3: string;
};

export type CountryFeature = Feature<Geometry, CountryProperties>;
export type CountriesGeoJSON = FeatureCollection<Geometry, CountryProperties>;
