import { MapConfiguration } from '@defikarte/shared';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsOption } from '../app/layout/settings-page/SettingsOption';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import aerialViewImage from '../assets/images/map-preview-aerial-view.png';
import baseMapImage from '../assets/images/map-preview-base-map.png';
import openStreetImage from '../assets/images/map-preview-open-street.png';
import { useBaseLayer } from '../hooks/useBaseLayer';

export const Route = createFileRoute('/settings/mapdesign')({
  component: RouteComponent,
});

interface MapDesign {
  id: string;
  labelKey: string;
  image: string;
}

const mapDesigns: MapDesign[] = [
  { id: MapConfiguration.osmVectorBasemapId, labelKey: 'settings.basemap', image: baseMapImage },
  { id: MapConfiguration.osmBaseMapId, labelKey: 'settings.osm', image: openStreetImage },
  {
    id: MapConfiguration.swisstopoImageryBaseMapId,
    labelKey: 'settings.satellite',
    image: aerialViewImage,
  },
];

function RouteComponent() {
  const { t } = useTranslation();
  const [baseLayer, setBaseLayer] = useBaseLayer();

  return (
    <SettingsPage backTo="/settings" title={t('settings.mapdesign')}>
      <div role="radiogroup" aria-label={t('settings.mapdesign')} className="flex flex-col gap-3">
        {mapDesigns.map(design => (
          <SettingsOption
            key={design.id}
            selected={baseLayer === design.id}
            onSelect={() => setBaseLayer(design.id)}
            leading={
              <img src={design.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
            }
          >
            {t(design.labelKey)}
          </SettingsOption>
        ))}
      </div>
    </SettingsPage>
  );
}
