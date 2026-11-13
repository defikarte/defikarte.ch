import { createFileRoute } from '@tanstack/react-router';
import { Map } from '../modules/map/Map';
import { FullscreenWrapper } from '../components/ui/fullscreen-wrapper/FullscreenWrapper';

// `/map/aed/<OSM node id>` opens the detail view of that AED, e.g. from the change report mails of defi_data.
// Not nested in `/map` (trailing `_`), so `map.tsx` needs no <Outlet />.
function MapAedComponent() {
  const { aedId } = Route.useParams();

  return (
    <FullscreenWrapper>
      <Map isHash={true} aedId={/^\d+$/.test(aedId) ? aedId : undefined} />
    </FullscreenWrapper>
  );
}

export const Route = createFileRoute('/map_/aed/$aedId')({
  component: MapAedComponent,
});
