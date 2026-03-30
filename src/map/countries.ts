import { feature as topoFeature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import countriesData from './data/countries-simplified.json';
import type { CountriesGeoJSON } from './types';

const NAME_OVERRIDES: Record<string, string> = {
  'Antigua and Barb.': 'Antigua and Barbuda',
  'Ashmore and Cartier Is.': 'Ashmore and Cartier Islands',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Br. Indian Ocean Ter.': 'British Indian Ocean Territory',
  'British Virgin Is.': 'British Virgin Islands',
  'Cayman Is.': 'Cayman Islands',
  'Central African Rep.': 'Central African Republic',
  'Cook Is.': 'Cook Islands',
  'Dem. Rep. Congo': 'Democratic Republic of the Congo',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'Faeroe Is.': 'Faroe Islands',
  'Falkland Is.': 'Falkland Islands',
  'Fr. Polynesia': 'French Polynesia',
  'Fr. S. Antarctic Lands': 'French Southern Antarctic Lands',
  'Heard I. and McDonald Is.': 'Heard Island and McDonald Islands',
  'Indian Ocean Ter.': 'Indian Ocean Territory',
  'Marshall Is.': 'Marshall Islands',
  'N. Cyprus': 'Northern Cyprus',
  'N. Mariana Is.': 'Northern Mariana Islands',
  'Pitcairn Is.': 'Pitcairn Islands',
  'S. Geo. and the Is.': 'South Georgia and the Islands',
  'S. Sudan': 'South Sudan',
  'Solomon Is.': 'Solomon Islands',
  'St. Kitts and Nevis': 'Saint Kitts and Nevis',
  'St. Pierre and Miquelon': 'Saint Pierre and Miquelon',
  'St. Vin. and Gren.': 'Saint Vincent and the Grenadines',
  'Turks and Caicos Is.': 'Turks and Caicos Islands',
  'U.S. Virgin Is.': 'United States Virgin Islands',
  'W. Sahara': 'Western Sahara',
  'Wallis and Futuna Is.': 'Wallis and Futuna Islands',
};

export const countryGeoData = topoFeature(
  countriesData as unknown as Topology,
  (countriesData as unknown as Topology).objects.countries,
) as unknown as CountriesGeoJSON;

countryGeoData.features.forEach(feature => {
  feature.id = Math.random().toString(36).slice(2);
  feature.properties.name =
    NAME_OVERRIDES[feature.properties.name] || feature.properties.name;
});

// France's MultiPolygon includes overseas territories (French Guiana, etc.) which
// causes France to visually span the Atlantic. Extract South American polygons as
// a separate French Guiana feature.
const franceFeature = countryGeoData.features.find(
  f => f.properties.name === 'France',
);

if (franceFeature?.geometry.type === 'MultiPolygon') {
  const mainland: typeof franceFeature.geometry.coordinates = [];
  const guiana: typeof franceFeature.geometry.coordinates = [];

  for (const polygon of franceFeature.geometry.coordinates) {
    const outerRing = polygon[0];
    const avgLon =
      outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
    (avgLon < -40 ? guiana : mainland).push(polygon);
  }

  if (guiana.length > 0) {
    franceFeature.geometry.coordinates = mainland;
    countryGeoData.features.push({
      type: 'Feature',
      id: Math.random().toString(36).slice(2),
      geometry: { type: 'MultiPolygon', coordinates: guiana },
      properties: { name: 'French Guiana' },
    });
  }
}

export const countries = countryGeoData.features.map(feature => ({
  id: feature.id as string,
  name: feature.properties.name,
  feature,
}));

export type Country = (typeof countries)[number];
