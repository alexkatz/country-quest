import { animated } from "@react-spring/web";
import { CountryPath } from "./CountryPath";
import countriesData from "./data/countries-110m.json";
import { MAP_HEIGHT, MAP_WIDTH } from "./projection";
import type { CountriesGeoJSON } from "./types";
import { useMapGestures } from "./useMapGestures";

const countries = countriesData as CountriesGeoJSON;

export const WorldMap = () => {
  const { style, bind } = useMapGestures();

  return (
    <div className="h-full w-full overflow-hidden touch-none" {...bind()}>
      <animated.svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-full w-full"
        style={style}
      >
        {countries.features.map((feature) => (
          <CountryPath
            key={feature.properties.ISO_A3}
            feature={feature}
          />
        ))}
      </animated.svg>
    </div>
  );
}
