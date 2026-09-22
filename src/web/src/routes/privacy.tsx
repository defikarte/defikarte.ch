import { createFileRoute } from '@tanstack/react-router';
import { Privacy } from '../modules/privacy/Privacy';

function PrivacyComponent() {
  return <Privacy />;
}

export const Route = createFileRoute('/privacy')({
  component: PrivacyComponent,
});
