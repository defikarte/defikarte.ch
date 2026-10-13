import { createFileRoute } from '@tanstack/react-router';
import { Sponsors } from '../modules/sponsors/Sponsors';

function SponsorsRoute() {
  return <Sponsors />;
}

export const Route = createFileRoute('/sponsors')({
  component: SponsorsRoute,
});
