import { createFileRoute } from '@tanstack/react-router';
import { Project } from '../modules/project/Project';

function ProjectRoute() {
  return <Project />;
}

export const Route = createFileRoute('/project')({
  component: ProjectRoute,
});
