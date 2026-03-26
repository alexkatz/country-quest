import { useDarkMode } from "./layout/useDarkMode";

export default function App() {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <button
          onClick={toggle}
          className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-800"
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}
