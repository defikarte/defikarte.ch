import { createFileRoute } from '@tanstack/react-router';
import { Map } from '../modules/map/Map';
import { FullscreenWrapper } from '../components/ui/fullscreen-wrapper/FullscreenWrapper';

export interface MapSearch {
  /** OSM node id of an AED to open, e.g. from the change report mails of defi_data. */
  aed?: string;
}

function MapComponent() {
  const { aed } = Route.useSearch();

  return (
    <FullscreenWrapper>
      <Map isHash={true} aedId={aed} />
    </FullscreenWrapper>
  );
}

export const Route = createFileRoute('/map')({
  // the router parses `?aed=123` as a number, so both forms are accepted
  validateSearch: (search: Record<string, unknown>): MapSearch => {
    const aed = typeof search.aed === 'number' || typeof search.aed === 'string' ? String(search.aed) : '';
    return { aed: /^\d+$/.test(aed) ? aed : undefined };
  },
  component: MapComponent,
});
