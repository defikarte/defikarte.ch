import { type PropsWithChildren } from 'react';

export const FullscreenWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-[calc(100dvh-(52px))] lg:h-[calc(100dvh-(--spacing(16)))] w-full flex flex-col overflow-hidden">
      {children}
    </div>
  );
};
