import { createFileRoute } from '@tanstack/react-router';
import { Map } from '../features/map/Map';

interface MapSearch {
  /** Set by the "create" nav button to start the create flow without unmounting the map. */
  create?: boolean;
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): MapSearch => ({
    create: search.create === true || search.create === 'true' ? true : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { create } = Route.useSearch();

  return (
    <div className="w-full h-full">
      <Map autoStartCreate={create} />
    </div>
  );
}
