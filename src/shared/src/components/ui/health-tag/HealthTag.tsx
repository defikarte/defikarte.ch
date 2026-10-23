import iconCheckWhite from '../../../assets/icons/icon-check-white.svg';
import iconTimeWhite from '../../../assets/icons/icon-time-white.svg';
import type { HealthStatus } from '../../../model/common';
import { Tag } from '../tag/Tag';

interface HealthTagProps {
  status: HealthStatus;
}

// Not translated on purpose: the label matches the backend status and the monitoring alerts.
const tags = {
  healthy: { variant: 'green', label: 'Healthy' },
  degraded: { variant: 'orange', label: 'Degraded' },
  unhealthy: { variant: 'red', label: 'Unhealthy' },
} as const;

/** The backend health as status pill, in the colours of the map markers. */
export const HealthTag = ({ status }: HealthTagProps) => {
  const { variant, label } = tags[status] ?? tags.unhealthy;

  return (
    <Tag variant={variant} icon={status === 'healthy' ? iconCheckWhite : iconTimeWhite}>
      {label}
    </Tag>
  );
};
