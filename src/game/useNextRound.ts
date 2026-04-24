import { useSetAtom } from 'jotai';
import * as gameState from './state';
import { getRandomPath } from './getRandomPath';

export const useNextRound = () => {
  const setRevealedCountries = useSetAtom(gameState.revealedCountriesAtom);
  const setTargetPath = useSetAtom(gameState.targetPathAtom);
  return () => {
    setRevealedCountries([]);
    setTargetPath(
      getRandomPath({
        length:
          gameState.INITIAL_MIN_PATH_SIZE +
          Math.floor(
            Math.random() *
              (gameState.INITIAL_MAX_PATH_SIZE -
                gameState.INITIAL_MIN_PATH_SIZE +
                1),
          ),
      }),
    );
  };
};
