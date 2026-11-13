export interface ApiConfiguration {
  baseUrl: string;
  apiKey: string;
  clientId?: string;
}

export type RequestOptions = {
  signal?: AbortSignal;
};

export interface TooltipData {
  title: string;
  content: string;
  link?: string; // Optional link for more information
}

export type NotificationType = 'success' | 'error';

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Lets a host application decide how notifications are presented (toast, banner, ...),
 * so shared components stay free of a notification library.
 */
export type NotificationHandler = (notification: Notification) => void;

/**
 * Minimal translation function, so shared code does not have to depend on i18next itself.
 */
export type Translate = (key: string) => string;

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Response of the backend /health endpoint.
 */
export interface HealthReport {
  status: HealthStatus;
  aedCount: number;
  lastSuccessUtc: string | null;
  lastAttemptUtc: string | null;
  ageMinutes: number | null;
  maxAgeMinutes: number;
  consecutiveFailures: number;
  reasons: string[];
}
