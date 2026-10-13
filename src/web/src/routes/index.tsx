import { createFileRoute } from '@tanstack/react-router';
import { Home } from '../modules/home/Home';
import { useFullscreenState } from '../context/FullScreenContext';

function HomeRoute() {
  const { isMapFullscreen, setIsMapFullscreen } = useFullscreenState();
  return <Home isMapFullscreen={isMapFullscreen} setIsMapFullscreen={setIsMapFullscreen} />;
}

export const Route = createFileRoute('/')({
  component: HomeRoute,
});
