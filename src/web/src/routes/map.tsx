import { createFileRoute } from '@tanstack/react-router';
import { Map } from '../modules/map/Map';
import { FullscreenWrapper } from '../components/ui/fullscreen-wrapper/FullscreenWrapper';

function MapComponent() {
  return (
    <FullscreenWrapper>
      <Map isHash={true} />
    </FullscreenWrapper>
  );
}

export const Route = createFileRoute('/map')({
  component: MapComponent,
});
