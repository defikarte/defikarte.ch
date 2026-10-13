import { type Dispatch, type SetStateAction, createContext, use } from 'react';

interface FullScreenContextType {
  isMapFullscreen: boolean;
  setIsMapFullscreen: Dispatch<SetStateAction<boolean>>;
}

export const FullScreenContext = createContext<FullScreenContextType | null>(null);

export const useFullscreenState = () => {
  const context = use(FullScreenContext);
  if (!context) throw new Error('useFullscreenState must be used within FullScreenContext');
  return context;
};
