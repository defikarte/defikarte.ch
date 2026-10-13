import { createFileRoute } from '@tanstack/react-router';
import { Imprint } from '../modules/imprint/Imprint';

function ImprintComponent() {
  return <Imprint />;
}

export const Route = createFileRoute('/imprint')({
  component: ImprintComponent,
});
