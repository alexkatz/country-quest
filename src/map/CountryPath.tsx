import { memo } from "react";
import { pathGenerator } from "./projection";
import type { CountryFeature } from "./types";

interface CountryPathProps {
  feature: CountryFeature;
}

export const CountryPath = memo(function CountryPath({
  feature,
}: CountryPathProps) {
  const d = pathGenerator(feature) ?? undefined;

  return (
    <path
      d={d}
      data-iso={feature.properties.ISO_A3}
      className="fill-gray-200 stroke-gray-400 stroke-[0.1] dark:fill-gray-700 dark:stroke-gray-500"
    />
  );
});
