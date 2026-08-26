import { createFileRoute } from '@tanstack/react-router';

export interface MapSearch {
  /** Set by the "create" nav button to start the create flow. */
  create?: boolean;
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): MapSearch => ({
    create: search.create === true || search.create === 'true' ? true : undefined,
  }),
  component: RouteComponent,
});

// The map itself is mounted by the root layout so it survives navigation - this route only owns
// the url (and its create search param) that makes the map the visible screen.
function RouteComponent() {
  return null;
}
