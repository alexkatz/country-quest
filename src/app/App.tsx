import { Provider as JotaiProvider, createStore } from 'jotai';
import { Landing } from './Landing';

export const App = () => {
  return (
    <JotaiProvider store={createStore()}>
      <Landing />
    </JotaiProvider>
  );
};
