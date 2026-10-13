import { Suspense } from 'react';
import { ContentWrapper } from '../content-wrapper/ContentWrapper';

const Loading = () => {
  return <ContentWrapper variant="green" className="h-screen"></ContentWrapper>;
};

export const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);
