import { geoNaturalEarth1, geoPath } from "d3-geo";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

export const projection = geoNaturalEarth1()
  .scale(155)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

export const pathGenerator = geoPath(projection);
