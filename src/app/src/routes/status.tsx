import { Button, HealthTag, useServiceStatus } from '@defikarte/shared';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/backend';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import AppConfiguration from '../configuration/app.configuration';

export const Route = createFileRoute('/status')({
  component: RouteComponent,
});

function RouteComponent() {
  const { t, i18n } = useTranslation();
  const { health, loading, unreachable, aedData, reload } = useServiceStatus(apiClient);
  const formatDate = (value: string | Date | null) =>
    value ? new Date(value).toLocaleString(i18n.language) : '–';

  return (
    <SettingsPage backTo="/about" title={t('statusPage.title')}>
      <StatusGroup title={t('statusPage.server')}>
        {unreachable && <StatusRow label={t('statusPage.unreachable')} />}
        <StatusRow label={t('statusPage.title')}>
          {health && <HealthTag status={health.status} />}
        </StatusRow>
        <StatusRow label={t('statusPage.aedCount')}>{health?.aedCount}</StatusRow>
        <StatusRow label={t('statusPage.lastSync')}>
          {health && formatDate(health.lastSuccessUtc)}
          {health?.ageMinutes != null &&
            ` (${t('statusPage.minutesAgo', { count: health.ageMinutes })})`}
        </StatusRow>
        <StatusRow label={t('statusPage.lastAttempt')}>
          {health && formatDate(health.lastAttemptUtc)}
        </StatusRow>
        <StatusRow label={t('statusPage.failures')}>{health?.consecutiveFailures}</StatusRow>
        <StatusRow label={t('statusPage.reasons')}>{health?.reasons.join(', ')}</StatusRow>
        <Button
          variant="white"
          loading={loading}
          aria-label={loading ? t('statusPage.loading') : undefined}
          onClick={() => void reload()}
        >
          {t('statusPage.reload')}
        </Button>
      </StatusGroup>

      <StatusGroup title={t('statusPage.device')}>
        <StatusRow label={t('statusPage.dataTimestamp')}>
          {aedData && formatDate(aedData.timestamp)}
        </StatusRow>
        <StatusRow label={t('statusPage.aedCount')}>{aedData?.aedCount}</StatusRow>
        <StatusRow label={t('statusPage.loadedAt')}>
          {aedData && formatDate(aedData.loadedAt)}
        </StatusRow>
        <StatusRow label={t('statusPage.version')}>{AppConfiguration.appVersion}</StatusRow>
        <StatusRow label={t('statusPage.client')}>{AppConfiguration.clientId}</StatusRow>
      </StatusGroup>
    </SettingsPage>
  );
}

const StatusGroup = ({ title, children }: React.PropsWithChildren<{ title: string }>) => (
  <section className="mb-6 flex flex-col gap-3">
    <h2 className="font-medium text-primary-100-green-01">{title}</h2>
    <dl className="flex flex-col gap-3">{children}</dl>
  </section>
);

const StatusRow = ({ label, children }: React.PropsWithChildren<{ label: string }>) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary-20-white bg-primary-10-white p-5 text-primary-100-white">
    <dt className="font-medium">{label}</dt>
    {children !== undefined && <dd className="break-all text-sm">{children}</dd>}
  </div>
);
