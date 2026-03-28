// Generates src/map/data/countries-simplified.json from world-atlas 50m data.
// Adjust MIN_WEIGHT to tune detail: 0 = full 50m detail, 1 = maximum simplification.
// A value around 0.03–0.08 sits between 50m and 110m.

import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { presimplify, simplify } from 'topojson-simplify';

const require = createRequire(import.meta.url);
const MIN_WEIGHT = 0.01;

const topo = require('world-atlas/countries-50m.json');
const simplified = simplify(presimplify(topo), MIN_WEIGHT);

writeFileSync(
  new URL('../src/map/data/countries-simplified.json', import.meta.url),
  JSON.stringify(simplified),
);

const before = JSON.stringify(topo).length;
const after = JSON.stringify(simplified).length;
console.log(
  `50m: ${(before / 1024).toFixed(0)} kB → simplified: ${(after / 1024).toFixed(0)} kB (MIN_WEIGHT=${MIN_WEIGHT})`,
);
