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

const OMITTED_COUNTRIES = new Set([
  // Caribbean islands
  'Anguilla',
  'Antigua and Barbuda',
  'Aruba',
  'Barbados',
  'Bermuda',
  'British Virgin Islands',
  'Cayman Islands',
  'Curaçao',
  'Dominica',
  'Grenada',
  'Montserrat',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Pierre and Miquelon',
  'Saint Vincent and the Grenadines',
  'Sint Maarten',
  'St-Barthélemy',
  'St-Martin',
  'Trinidad and Tobago',
  'Turks and Caicos Islands',
  'United States Virgin Islands',

  // Atlantic islands
  'Cabo Verde',
  'Saint Helena',
  'São Tomé and Principe',
  'South Georgia and the Islands',

  // Indian Ocean islands
  'British Indian Ocean Territory',
  'Indian Ocean Territory',
  'Maldives',
  'Seychelles',

  // Pacific islands
  'American Samoa',
  'Ashmore and Cartier Islands',
  'Cook Islands',
  'Fiji',
  'French Polynesia',
  'Guam',
  'Kiribati',
  'Marshall Islands',
  'Micronesia',
  'Nauru',
  'Niue',
  'Norfolk Island',
  'Northern Mariana Islands',
  'Palau',
  'Pitcairn Islands',
  'Samoa',
  'San Marino',
  'Tonga',
  'Vanuatu',
  'Wallis and Futuna Islands',

  // Remote/Antarctic territories
  'French Southern Antarctic Lands',
  'Heard Island and McDonald Islands',

  // European microstates too small to interact with
  'Liechtenstein',
]);

export const processGeoData = (countryGeoData: CountriesGeoJSON) => {
  countryGeoData.features = countryGeoData.features.filter(
    f =>
      !OMITTED_COUNTRIES.has(
        NAME_OVERRIDES[f.properties.name] ?? f.properties.name,
      ),
  );

  countryGeoData.features.forEach(feature => {
    feature.id = Math.random().toString(36).slice(2);
    feature.properties.name =
      NAME_OVERRIDES[feature.properties.name] || feature.properties.name;
  });

  // Strip Prince Edward Islands (~47°S) from South Africa's polygon.
  const southAfricaFeature = countryGeoData.features.find(
    f => f.properties.name === 'South Africa',
  );

  if (southAfricaFeature?.geometry.type === 'MultiPolygon') {
    southAfricaFeature.geometry.coordinates =
      southAfricaFeature.geometry.coordinates.filter(polygon => {
        const outerRing = polygon[0];
        const avgLat =
          outerRing.reduce((sum, p) => sum + p[1], 0) / outerRing.length;
        return avgLat > -40;
      });
  }

  // Strip Canary Islands from Spain's polygon; Balearic Islands (~1-4°E) are kept.
  const spainFeature = countryGeoData.features.find(
    f => f.properties.name === 'Spain',
  );

  if (spainFeature?.geometry.type === 'MultiPolygon') {
    spainFeature.geometry.coordinates =
      spainFeature.geometry.coordinates.filter(polygon => {
        const outerRing = polygon[0];
        const avgLon =
          outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
        return avgLon > -12;
      });
  }

  // Strip Atlantic island territories (Madeira, Azores) from Portugal's polygon.
  const portugalFeature = countryGeoData.features.find(
    f => f.properties.name === 'Portugal',
  );

  if (portugalFeature?.geometry.type === 'MultiPolygon') {
    portugalFeature.geometry.coordinates =
      portugalFeature.geometry.coordinates.filter(polygon => {
        const outerRing = polygon[0];
        const avgLon =
          outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
        return avgLon > -12;
      });
  }

  // Strip Caribbean special municipalities (Bonaire, Sint Eustatius, Saba) from the
  // Netherlands polygon — they're baked into its MultiPolygon but shouldn't appear.
  const netherlandsFeature = countryGeoData.features.find(
    f => f.properties.name === 'Netherlands',
  );

  if (netherlandsFeature?.geometry.type === 'MultiPolygon') {
    netherlandsFeature.geometry.coordinates =
      netherlandsFeature.geometry.coordinates.filter(polygon => {
        const outerRing = polygon[0];
        const avgLon =
          outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
        return avgLon > -20;
      });
  }

  // Extract Galápagos Islands (~-90°W) from Ecuador's polygon as a separate feature.
  const ecuadorFeature = countryGeoData.features.find(
    f => f.properties.name === 'Ecuador',
  );

  if (ecuadorFeature?.geometry.type === 'MultiPolygon') {
    const mainland: typeof ecuadorFeature.geometry.coordinates = [];
    const galapagos: typeof ecuadorFeature.geometry.coordinates = [];

    for (const polygon of ecuadorFeature.geometry.coordinates) {
      const outerRing = polygon[0];
      const avgLon =
        outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
      (avgLon < -83 ? galapagos : mainland).push(polygon);
    }

    ecuadorFeature.geometry.coordinates = mainland;

    if (galapagos.length > 0) {
      countryGeoData.features.push({
        type: 'Feature',
        id: Math.random().toString(36).slice(2),
        geometry: { type: 'MultiPolygon', coordinates: galapagos },
        properties: { name: 'Galápagos Islands' },
      });
    }
  }

  // France's MultiPolygon includes overseas territories which cause it to span
  // multiple continents. Extract French Guiana and Réunion as separate features;
  // drop Caribbean territories (Martinique, Guadeloupe, etc.).
  const franceFeature = countryGeoData.features.find(
    f => f.properties.name === 'France',
  );

  if (franceFeature?.geometry.type === 'MultiPolygon') {
    const mainland: typeof franceFeature.geometry.coordinates = [];
    const guiana: typeof franceFeature.geometry.coordinates = [];
    const mayotte: typeof franceFeature.geometry.coordinates = [];
    const reunion: typeof franceFeature.geometry.coordinates = [];
    const newCaledonia: typeof franceFeature.geometry.coordinates = [];

    for (const polygon of franceFeature.geometry.coordinates) {
      const outerRing = polygon[0];
      const avgLon =
        outerRing.reduce((sum, p) => sum + p[0], 0) / outerRing.length;
      if (avgLon < -40 && avgLon > -57) {
        guiana.push(polygon); // French Guiana (~-53°W)
      } else if (avgLon <= -57) {
        // Caribbean territories (~-61°W) — dropped
      } else if (avgLon > 100) {
        newCaledonia.push(polygon); // New Caledonia (~165°E)
      } else if (avgLon > 50) {
        reunion.push(polygon); // Réunion (~55.5°E)
      } else if (avgLon > 40) {
        mayotte.push(polygon); // Mayotte (~45°E)
      } else if (avgLon > -10) {
        mainland.push(polygon); // European mainland + Corsica
      }
      // anything else is dropped
    }

    franceFeature.geometry.coordinates = mainland;

    if (guiana.length > 0) {
      countryGeoData.features.push({
        type: 'Feature',
        id: Math.random().toString(36).slice(2),
        geometry: { type: 'MultiPolygon', coordinates: guiana },
        properties: { name: 'French Guiana' },
      });
    }

    if (mayotte.length > 0) {
      countryGeoData.features.push({
        type: 'Feature',
        id: Math.random().toString(36).slice(2),
        geometry: { type: 'MultiPolygon', coordinates: mayotte },
        properties: { name: 'Mayotte' },
      });
    }

    if (reunion.length > 0) {
      countryGeoData.features.push({
        type: 'Feature',
        id: Math.random().toString(36).slice(2),
        geometry: { type: 'MultiPolygon', coordinates: reunion },
        properties: { name: 'Réunion' },
      });
    }

    if (newCaledonia.length > 0) {
      countryGeoData.features.push({
        type: 'Feature',
        id: Math.random().toString(36).slice(2),
        geometry: { type: 'MultiPolygon', coordinates: newCaledonia },
        properties: { name: 'New Caledonia' },
      });
    }
  }

  return countryGeoData;
};
