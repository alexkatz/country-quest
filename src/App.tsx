import { useDarkMode } from "./layout/useDarkMode";
import { WorldMap } from "./map/WorldMap";

export default function App() {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Country Connector</h1>
        <button
          onClick={toggle}
          className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-800"
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
