import { createFileRoute } from '@tanstack/react-router';
import { Knowledge } from '../modules/knowledge/Knowledge';

function KnowledgeRoute() {
  return <Knowledge />;
}

export const Route = createFileRoute('/knowledge')({
  component: KnowledgeRoute,
});
