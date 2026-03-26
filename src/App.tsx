import { useDarkMode } from "./layout/useDarkMode";
import { WorldMap } from "./map/WorldMap";

export const App = () => {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="flex h-screen flex-col bg-background text-text">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Country Connector</h1>
        <button
          onClick={toggle}
          className="rounded-lg bg-surface px-3 py-1.5 text-sm"
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
      <div className="flex-1">
        <WorldMap />
      </div>
    </div>
  );
}
