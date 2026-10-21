import cn from 'classnames';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type ApiClient } from '../../../../api/api-client';
import iconWarningCircleOrangeM from '../../../../assets/icons/icon-warning-circle-orange-m.svg';
import { Button } from '../../../../components/ui/button/Button';
import { SelectField } from '../../../../components/ui/select-field/SelectField';
import { TextField } from '../../../../components/ui/text-field/TextField';
import { AED_REMOVAL_REASONS, type AedRemovalData } from '../../../../model/aed';
import { type NotificationHandler } from '../../../../model/common';

interface AedRemoveFormProps {
  id: string;
  apiClient: ApiClient;
  reporter: string;
  onCancel: () => void;
  onRemoved: () => Promise<void>;
  onNotify: NotificationHandler;
  compact?: boolean;
}

/**
 * The step of the edit form to report an AED as permanently gone, which deletes it in OSM.
 * Temporary failures are left to the operator, so the notice tells them apart.
 */
export const AedRemoveForm = ({
  id,
  apiClient,
  reporter,
  onCancel,
  onRemoved,
  onNotify,
  compact,
}: AedRemoveFormProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AedRemovalData>({
    shouldUseNativeValidation: true,
    reValidateMode: 'onChange',
    defaultValues: { reason: '', comment: '', reporter },
  });

  const onSubmit = async (data: AedRemovalData) => {
    try {
      await apiClient.deleteAedData(id, data);
      onNotify({
        type: 'success',
        title: t('removeAedSuccessTitle'),
        message: t('removeAedSuccessMessage'),
      });
      await onRemoved();
    } catch (error) {
      onNotify({
        type: 'error',
        title: t('removeAedErrorTitle'),
        message: error instanceof Error ? error.message : t('removeAedErrorMessage'),
      });
    }
  };

  return (
    <form
      className="flex flex-col h-[100%] justify-between"
      onSubmit={e => void handleSubmit(onSubmit)(e)}
    >
      <h1 className="border-b p-4 border-primary-05-green-05">{t('removeAed')}</h1>
      <div className="flex flex-col flex-grow justify-start px-4 pt-5 pb-4 gap-4 overflow-auto border-b border-primary-05-green-05">
        {/* the warning style of PositionHint */}
        <div className="flex items-start gap-2.5 px-3 py-2 rounded-2xl border-2 border-secondary-orange-02 text-xs leading-[150%] text-primary-100-green-04">
          <img src={iconWarningCircleOrangeM} alt="" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{t('removeAedNoticeTitle')}</span>
            <span>{t('removeAedNoticeContent')}</span>
          </div>
        </div>
        <SelectField
          label={t('removeAedReason')}
          options={AED_REMOVAL_REASONS}
          required
          error={errors.reason?.message}
          {...register('reason', { required: t('removeAedReasonRequired') })}
          disabled={isSubmitting}
        />
        <TextField
          autoComplete="off"
          label={t('removeAedComment')}
          type="text"
          placeholder={t('removeAedCommentPlaceholder')}
          error={errors.comment?.message}
          {...register('comment', {
            maxLength: { value: 200, message: t('descriptionMaxLength') },
          })}
          disabled={isSubmitting}
        />
        <TextField
          autoComplete="off"
          label={t('reporter')}
          type="text"
          placeholder={t('reporterPlaceholder')}
          required
          tooltip={{
            title: t('reporterTooltipTitle'),
            content: t('reporterTooltipContent'),
          }}
          error={errors.reporter?.message}
          {...register('reporter', { required: t('reporterRequired') })}
          disabled={isSubmitting}
        />
      </div>
      <div className="pt-4 pb-4 px-4 flex-shrink flex w-full gap-2 justify-end">
        <Button
          type="button"
          variant="secondary"
          size="large"
          className={cn('w-full', { 'md:w-fit': !compact })}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="large"
          className={cn('w-full', { 'md:w-fit': !compact })}
          disabled={isSubmitting}
        >
          {t('removeAedSubmit')}
        </Button>
      </div>
    </form>
  );
};
