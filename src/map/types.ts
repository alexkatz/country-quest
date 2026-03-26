import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type CountryProperties = {
  name: string;
};

export type CountryFeature = Feature<Geometry, CountryProperties> & { id?: string | number };
export type CountriesGeoJSON = FeatureCollection<Geometry, CountryProperties>;
