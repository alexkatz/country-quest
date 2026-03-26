import { atom, useAtom } from "jotai";
import { useEffect } from "react";

export const darkModeAtom = atom(
  window.matchMedia("(prefers-color-scheme: dark)").matches,
);

export const useDarkMode = () => {
  const [dark, setDark] = useAtom(darkModeAtom);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return { dark, setDark, toggle } as const;
}
