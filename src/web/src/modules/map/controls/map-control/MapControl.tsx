import {
  CreateMode,
  MapConfiguration,
  MapIconButton,
  type MapInstance,
  useOnOutsidePointerDown,
} from '@defikarte/shared';
import cn from 'classnames';
import { type RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import layerIconGreen from '../../../../assets/icons/icon-layers-dark-green.svg';
import layerIconWhite from '../../../../assets/icons/icon-layers-white.svg';
import iconMinus from '../../../../assets/icons/icon-minus-dark-green.svg';
import iconPlus from '../../../../assets/icons/icon-plus-dark-green.svg';
import swisstopoImageryImage from './../../../../assets/images/map-preview-aerial-view.png';
import swisstopoBaseMapImage from './../../../../assets/images/map-preview-base-map.png';
import osmImage from './../../../../assets/images/map-preview-open-street.png';
import { LayerSymbol } from './layer-symbol/LayerSymbol';

interface Props {
  map: MapInstance | null;
  setActiveBaseLayer: (id: string) => void;
  activeBaseLayer: string;
  createMode: CreateMode;
}

export const MapControl = (props: Props) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const isGreateOrEqualMedium = useMediaQuery({ minWidth: 768 });

  const setActiveBaseLayer = async (id: string) => {
    props.setActiveBaseLayer(id);
    await props.map?.setActiveBaseLayer(id);
  };

  const mainClasses = cn(
    'z-10',
    'absolute',
    'flex',
    'flex-col',
    'md:flex-row',
    'items-end',
    'md:items-start',
    'justify-end',
    'h-0',
    'mb-5',
    'mr-4',
    'md:mr-6',
    'mt-6',
    'bottom-0',
    'md:bottom-auto',
    'top-auto',
    'md:top-0',
    'right-0'
  );

  const { map, activeBaseLayer, createMode } = props;
  const layerContainerRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  useOnOutsidePointerDown({
    active: isActive,
    refsToIgnore: [
      layerContainerRef as RefObject<HTMLElement | null>,
      toggleButtonRef as RefObject<HTMLElement | null>,
    ],
    onOutsidePointerDown: () => setIsActive(false),
  });

  const isLayerButtonVisible = createMode !== CreateMode.form || isGreateOrEqualMedium;
  return (
    <div className={mainClasses}>
      {isActive && (
        <div ref={layerContainerRef} className="md:mr-3 flex flex-col md:flex-row gap-2">
          <LayerSymbol
            active={activeBaseLayer === MapConfiguration.osmVectorBasemapId}
            img={swisstopoBaseMapImage}
            label={t('basemap')}
            onClick={() => void setActiveBaseLayer(MapConfiguration.osmVectorBasemapId)}
          />
          <LayerSymbol
            active={activeBaseLayer === MapConfiguration.osmBaseMapId}
            img={osmImage}
            label={t('osm')}
            onClick={() => void setActiveBaseLayer(MapConfiguration.osmBaseMapId)}
          />
          <LayerSymbol
            active={activeBaseLayer === MapConfiguration.swisstopoImageryBaseMapId}
            img={swisstopoImageryImage}
            label={t('satellite')}
            onClick={() => void setActiveBaseLayer(MapConfiguration.swisstopoImageryBaseMapId)}
          />
        </div>
      )}
      <div className="flex flex-col gap-1 mt-2 md:mt-0">
        {isLayerButtonVisible && (
          <MapIconButton
            ref={toggleButtonRef}
            title={t('layers')}
            active={isActive}
            icon={isActive ? layerIconWhite : layerIconGreen}
            onClick={() => setIsActive(s => !s)}
            className="shadow-custom shadow-green-shadow rounded-full not-md:p-2"
          />
        )}
        {isGreateOrEqualMedium && (
          <>
            <MapIconButton
              title={t('zoomIn')}
              active={false}
              icon={iconPlus}
              onClick={() => map?.zoomIn()}
              className="shadow-custom shadow-green-shadow rounded-full"
            />
            <MapIconButton
              title={t('zoomOut')}
              active={false}
              icon={iconMinus}
              onClick={() => map?.zoomOut()}
              className="shadow-custom shadow-green-shadow rounded-full"
            />
          </>
        )}
      </div>
    </div>
  );
};
