import cn from 'classnames';
import { type Feature, type FeatureCollection } from 'geojson';
import { type Dispatch, type SetStateAction } from 'react';
import { type useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type ApiClient } from '../../../../api/api-client';
import { Button } from '../../../../components/ui/button/Button';
import { SelectField } from '../../../../components/ui/select-field/SelectField';
import { TextField } from '../../../../components/ui/text-field/TextField';
import { type AedData } from '../../../../model/aed';
import { type NotificationHandler } from '../../../../model/common';
import { CreateMode } from '../../../../model/map';
import {
  areOpeningHoursValid,
  formatPhoneNumber,
  isPhoneNumberValid,
} from '../../../../services/custom-validation.service';
import { type MapInstance } from '../../../map-instance/map-instance';

interface AedFormProps {
  map: MapInstance | null;
  apiClient: ApiClient;
  form: ReturnType<typeof useForm<AedData>>;
  setCreateMode: Dispatch<SetStateAction<CreateMode>>;
  onSuccess: (feature: Feature) => void;
  onNotify: NotificationHandler;
  compact?: boolean;
}

export const AedForm = ({
  map,
  apiClient,
  form,
  setCreateMode,
  onSuccess,
  onNotify,
  compact,
}: AedFormProps) => {
  const { t } = useTranslation();
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const handlePhoneNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const result = formatPhoneNumber(e.target.value);
    // Only validate if the result is valid; otherwise, focus cannot be changed from the input field.
    setValue('operatorPhone', result.value, { shouldValidate: result.isValid });
  };

  const onSubmit = async (data: AedData) => {
    try {
      let result: FeatureCollection | undefined = undefined;
      const {
        id,
        longitude,
        latitude,
        sourceFeature,
        location,
        openingHours,
        operatorPhone,
        ...otherProps
      } = data;
      const requestData: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id,
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            properties: {
              ...sourceFeature?.properties,
              'defibrillator:location': location,
              opening_hours: openingHours,
              phone: operatorPhone,
              ...otherProps,
            },
          },
        ],
      };
      if (id) {
        const response = await apiClient.putAedData(requestData);
        result = response.data;
      } else {
        const response = await apiClient.postAedData(requestData);
        result = response.data;
      }
      onNotify({
        type: 'success',
        title: id ? t('editAedSuccessTitle') : t('createAedSuccessTitle'),
        message: id ? t('editAedSuccessMessage') : t('createAedSuccessMessage'),
      });
      await map?.refreshActiveOverlays();
      setCreateMode(CreateMode.none);
      form.reset();
      onSuccess(result.features[0]);
    } catch (error) {
      onNotify({
        type: 'error',
        title: t('createAedErrorTitle'),
        message: error instanceof Error ? error.message : t('createAedErrorMessage'),
      });
    }
  };

  const longitude = watch('longitude');
  const latitude = watch('latitude');
  const title = watch('id') ? t('editAed') : t('createAed');

  const containerClass = cn(
    'absolute',
    'z-10',
    'h-auto',
    'rounded-2xl',
    'top-4',
    'right-4',
    'left-4',
    // bottom-16 keeps the sheet clear of the MapButtons row at bottom-5
    'bottom-16',
    'bg-primary-100-white',
    'shadow-custom-lg',
    'shadow-green-shadow-64',
    // In compact mode the phone layout is forced, so no breakpoint variants are applied.
    !compact && [
      'lg:w-[555px]',
      'md:max-h-[600px]',
      'lg:max-h-full',
      'lg:h-auto',
      'md:bottom-22',
      'lg:bottom-6',
      'md:top-6',
      'md:right-6',
      'md:left-6',
      'lg:left-auto',
    ]
  );

  return (
    <div className={containerClass}>
      <form
        className="flex flex-col h-[100%] justify-between"
        onSubmit={e => void handleSubmit(onSubmit)(e)}
      >
        <h1 className="border-b p-4 border-primary-05-green-05">{title}</h1>
        <div className="flex flex-col flex-grow justify-start px-4 pt-5 pb-4 gap-4 overflow-auto border-b border-primary-05-green-05">
          <TextField
            label={t('coordinates')}
            type="text"
            required
            tooltip={{
              title: t('coordinatesTooltipTitle'),
              content: t('coordinatesTooltipContent'),
            }}
            value={longitude && latitude && `${longitude.toFixed(7)}, ${latitude.toFixed(7)}`}
            readOnly
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
          <TextField
            autoComplete="off"
            label={t('location')}
            type="text"
            placeholder={t('locationPlaceholder')}
            required
            tooltip={{
              title: t('locationTooltipTitle'),
              content: t('locationTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Tag:emergency%3Ddefibrillator',
            }}
            error={errors.location?.message}
            {...register('location', {
              required: t('locationRequired'),
              maxLength: { value: 200, message: t('locationMaxLength') },
            })}
            disabled={isSubmitting}
          />
          <SelectField
            label={t('indoor')}
            options={['yes', 'no']}
            required
            tooltip={{
              title: t('indoorTooltipTitle'),
              content: t('indoorTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:indoor',
            }}
            error={errors.indoor?.message}
            {...register('indoor', { required: t('indoorRequired') })}
            disabled={isSubmitting}
          />
          <TextField
            autoComplete="off"
            label={t('level')}
            type="number"
            placeholder={t('levelPlaceholder')}
            tooltip={{
              title: t('levelTooltipTitle'),
              content: t('levelTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:level',
            }}
            error={errors.level?.message}
            {...register('level')}
            disabled={isSubmitting}
          />
          <TextField
            autoComplete="off"
            label={t('description')}
            type="text"
            placeholder={t('descriptionPlaceholder')}
            tooltip={{
              title: t('descriptionTooltipTitle'),
              content: t('descriptionTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:description',
            }}
            error={errors.description?.message}
            {...register('description', {
              required: false,
              maxLength: { value: 200, message: t('descriptionMaxLength') },
            })}
            disabled={isSubmitting}
          />
          <TextField
            autoComplete="off"
            label={t('openingHours')}
            type="text"
            placeholder={t('openingHoursPlaceholder')}
            tooltip={{
              title: t('openingHoursTooltipTitle'),
              content: t('openingHoursTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:opening_hours',
            }}
            error={errors.openingHours?.message}
            {...register('openingHours', { validate: value => areOpeningHoursValid(value, t) })}
            disabled={isSubmitting}
          />
          <TextField
            autoComplete="off"
            label={t('operator')}
            type="text"
            placeholder={t('operatorPlaceholder')}
            tooltip={{
              title: t('operatorTooltipTitle'),
              content: t('operatorTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:operator',
            }}
            error={errors.operator?.message}
            {...register('operator')}
            disabled={isSubmitting}
          />
          <TextField
            autoComplete="off"
            label={t('operatorPhone')}
            type="text"
            placeholder={t('operatorPhonePlaceholder')}
            tooltip={{
              title: t('operatorPhoneTooltipTitle'),
              content: t('operatorPhoneTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:phone',
            }}
            error={errors.operatorPhone?.message}
            {...register('operatorPhone', {
              validate: value => isPhoneNumberValid(value, t),
              onBlur: handlePhoneNumberBlur,
            })}
            disabled={isSubmitting}
          />
          <SelectField
            label={t('access')}
            options={['yes', 'permissive', 'private']}
            tooltip={{
              title: t('accessTooltipTitle'),
              content: t('accessTooltipContent'),
              link: 'https://wiki.openstreetmap.org/wiki/Key:access',
            }}
            {...register('access')}
            disabled={isSubmitting}
          />
        </div>
        <div className="pt-4 pb-4 px-4 flex-shrink flex w-full items-end self-end">
          <Button
            type="submit"
            variant="primary"
            size="large"
            className={cn('w-full', { 'md:w-fit': !compact })}
            disabled={isSubmitting}
          >
            {t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};
