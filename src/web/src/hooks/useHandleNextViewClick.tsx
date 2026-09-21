import { useRef } from 'react';

export const useHandleNextViewClick = () => {
  const firstViewRef = useRef<HTMLDivElement>(null);

  const handleNextViewClick = () => {
    if (firstViewRef.current) {
      firstViewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return { onClick: handleNextViewClick, ref: firstViewRef };
};
