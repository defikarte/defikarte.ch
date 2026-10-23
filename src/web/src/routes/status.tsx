import { createFileRoute } from '@tanstack/react-router';
import { Status } from '../modules/status/Status';

function StatusComponent() {
  return <Status />;
}

export const Route = createFileRoute('/status')({
  component: StatusComponent,
});
