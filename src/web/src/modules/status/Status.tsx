import { Button, HealthTag, useServiceStatus } from '@defikarte/shared';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/backend';
import { ContentWrapper } from '../../components/ui/content-wrapper/ContentWrapper';
import { Text } from '../../components/ui/text/Text';
import AppConfiguration from '../../configuration/app.configuration';

export const Status = () => {
  const { t, i18n } = useTranslation();
  const { health, loading, unreachable, aedData, reload } = useServiceStatus(apiClient);
  const formatDate = (value: string | Date | null) =>
    value ? new Date(value).toLocaleString(i18n.language) : '–';

  return (
    <ContentWrapper variant="beige" paddingY="small" className="flex-col items-center gap-10">
      <Text size="large" weight="bold" center>
        {t('statusPage.title')}
      </Text>

      <StatusGroup title={t('statusPage.server')}>
        {loading && <StatusRow label={t('statusPage.loading')} />}
        {unreachable && <StatusRow label={t('statusPage.unreachable')} />}
        {health && (
          <>
            <StatusRow label={t('statusPage.title')}>
              <HealthTag status={health.status} />
            </StatusRow>
            <StatusRow label={t('statusPage.aedCount')}>{health.aedCount}</StatusRow>
            <StatusRow label={t('statusPage.lastSync')}>
              {formatDate(health.lastSuccessUtc)}
              {health.ageMinutes !== null &&
                ` (${t('statusPage.minutesAgo', { count: health.ageMinutes })})`}
            </StatusRow>
            <StatusRow label={t('statusPage.lastAttempt')}>
              {formatDate(health.lastAttemptUtc)}
            </StatusRow>
            <StatusRow label={t('statusPage.failures')}>{health.consecutiveFailures}</StatusRow>
            {health.reasons.length > 0 && (
              <StatusRow label={t('statusPage.reasons')}>{health.reasons.join(', ')}</StatusRow>
            )}
          </>
        )}
      </StatusGroup>
      {!loading && (
        <Button variant="secondary" onClick={() => void reload()}>
          {t('statusPage.reload')}
        </Button>
      )}

      <StatusGroup title={t('statusPage.device')}>
        {aedData ? (
          <>
            <StatusRow label={t('statusPage.dataTimestamp')}>
              {formatDate(aedData.timestamp)}
            </StatusRow>
            <StatusRow label={t('statusPage.aedCount')}>{aedData.aedCount}</StatusRow>
            <StatusRow label={t('statusPage.loadedAt')}>{formatDate(aedData.loadedAt)}</StatusRow>
          </>
        ) : (
          <StatusRow label={t('statusPage.notLoaded')} />
        )}
        <StatusRow label={t('statusPage.version')}>{AppConfiguration.appVersion}</StatusRow>
        <StatusRow label={t('statusPage.client')}>{AppConfiguration.clientId}</StatusRow>
      </StatusGroup>
    </ContentWrapper>
  );
};

const StatusGroup = ({ title, children }: React.PropsWithChildren<{ title: string }>) => (
  <section className="flex w-full flex-col gap-3 lg:max-w-[700px]">
    <Text size="medium" weight="bold">
      {title}
    </Text>
    <dl className="flex flex-col gap-3">{children}</dl>
  </section>
);

const StatusRow = ({ label, children }: React.PropsWithChildren<{ label: string }>) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary-100-white p-4 text-primary-100-green-04">
    <dt className="font-medium">{label}</dt>
    {children !== undefined && <dd className="break-all text-sm">{children}</dd>}
  </div>
);
