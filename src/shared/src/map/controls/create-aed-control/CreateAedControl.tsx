import { type Feature, type GeoJsonProperties, type Geometry, type Point } from 'geojson';
import { type MapGeoJSONFeature } from 'maplibre-gl';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type ApiClient } from '../../../api/api-client';
import { type AedAccess, type AedData, type AedIndoor } from '../../../model/aed';
import { type NotificationHandler } from '../../../model/common';
import { CreateMode, type MapInteractionEvent } from '../../../model/map';
import { deselectAllFeatures, getActiveAedOverlay, getMoveInteraction } from '../../helper';
import { FEATURE_STATE } from '../../map-instance/configuration/constants';
import { MapConfiguration } from '../../map-instance/configuration/map.configuration';
import { type MapInstance } from '../../map-instance/map-instance';
import { DetailView } from '../detail-view/DetailView';
import { AedForm } from './aed-form/AedForm';
import { MapButtons } from './map-buttons/MapButtons';
import { PositionHint } from './position-hint/PositionHint';
import { useNearbyAeds } from './useNearbyAeds';

const createDefaultValues = (feature: Feature | null): AedData | undefined => {
  if (!feature) {
    return {
      latitude: 0,
      longitude: 0,
      description: '',
      operator: '',
      operatorPhone: '',
      operatorEmail: '',
      openingHours: '',
      location: '',
      id: '',
      level: '',
      access: undefined,
      indoor: undefined,
      reporter: '',
      sourceFeature: undefined,
    };
  }

  const defaultValues: AedData = {
    latitude: (feature.geometry as Point).coordinates[1],
    longitude: (feature.geometry as Point).coordinates[0],
    description: (feature.properties?.description as string) || '',
    operator: (feature.properties?.operator as string) || '',
    operatorPhone: (feature.properties?.phone as string) || '',
    operatorEmail: feature.properties?.email || '',
    openingHours: (feature.properties?.opening_hours as string) || '',
    location: (feature.properties?.['defibrillator:location'] as string) || '',
    id: feature.id?.toString() ?? '',
    level: (feature.properties?.level as string) || '',
    access: (feature.properties?.access as AedAccess) || '',
    indoor: (feature.properties?.indoor as AedIndoor) || '',
    reporter: '',
    sourceFeature: feature,
  };

  return defaultValues;
};

interface CreateAedControlProps {
  map: MapInstance | null;
  apiClient: ApiClient;
  createMode: CreateMode;
  feature: MapInteractionEvent | null;
  createPosition: { lat: number; lon: number } | null;
  setEditFeature: Dispatch<SetStateAction<MapInteractionEvent | null>>;
  setCreateMode: Dispatch<SetStateAction<CreateMode>>;
  onFeatureSelect: (event: MapInteractionEvent) => void;
  onNotify: NotificationHandler;
  userLocation?: GeolocationPosition | null;
  compact?: boolean;
}

export const CreateAedControl = ({
  map,
  apiClient,
  createMode,
  feature,
  createPosition,
  setEditFeature,
  setCreateMode,
  onFeatureSelect,
  onNotify,
  userLocation,
  compact,
}: CreateAedControlProps) => {
  const form = useForm<AedData>({
    shouldUseNativeValidation: true,
    reValidateMode: 'onChange',
    defaultValues: createDefaultValues(feature?.data ?? null),
  });
  // Warn while the marker is placed, so a duplicate is noticed before the form is filled in.
  const { nearbyAeds, checkNow } = useNearbyAeds({
    map,
    apiClient,
    isActive: createMode === CreateMode.position && !feature,
    position: createPosition,
  });
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  // A nearby AED opened from the hint. It is shown without leaving the create flow, so closing
  // it returns to positioning with the marker where it was.
  const [previewAed, setPreviewAed] = useState<MapGeoJSONFeature | null>(null);

  useEffect(() => {
    if (nearbyAeds.length === 0) setIsHintExpanded(false);
  }, [nearbyAeds]);

  // The preview belongs to positioning; leaving it some other way (e.g. the app's back button
  // ending the flow) drops it, the move interaction is then handled by useHandleCreateMode.
  useEffect(() => {
    if (createMode !== CreateMode.position) setPreviewAed(null);
  }, [createMode]);

  useEffect(() => {
    if (!map || !previewAed) return;

    map.setFeatureState(previewAed.source, previewAed.id, { [FEATURE_STATE.SELECTED]: true });
    return () =>
      map.setFeatureState(previewAed.source, previewAed.id, { [FEATURE_STATE.SELECTED]: false });
  }, [map, previewAed]);

  const handleCancel = () => {
    form.reset();
    if (feature) {
      map?.setFeatureState(feature.source ?? '', feature.data?.id, {
        [FEATURE_STATE.EDITING]: false,
      });
    }
    setEditFeature(null);
    setCreateMode(CreateMode.none);
  };

  const handleConfirmPosition = async () => {
    // With potential duplicates close by, the regular button only opens the hint - the position
    // is confirmed from within it, so the message can't be skipped. checkNow waits for data that
    // may still be loading, so a fast confirm can't slip past the warning either.
    if ((await checkNow()).length > 0) {
      setIsHintExpanded(true);
      return;
    }

    await proceedToForm();
  };

  const proceedToForm = async () => {
    const data = await map?.getGeoJsonSourceData(MapConfiguration.aedCreateSourceId);
    if (!data) {
      setCreateMode(CreateMode.none);
      return;
    }

    const feature = data.features[0];
    const lat = (feature.geometry as Point).coordinates[1];
    const lng = (feature.geometry as Point).coordinates[0];
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    setCreateMode(CreateMode.form);
  };

  const centerOnFeature = (target: Feature) => {
    if (target.geometry.type !== 'Point') return;
    map?.easeTo(target.geometry.coordinates as [number, number], 18);
  };

  const handleShowNearbyAed = (nearbyFeature: Feature) => {
    const source = getActiveAedOverlay(map);
    if (!source) return;

    // taps on the map would otherwise move the create marker behind the detail view
    getMoveInteraction(map)?.off();
    setPreviewAed({ ...nearbyFeature, source } as MapGeoJSONFeature);
    centerOnFeature(nearbyFeature);
  };

  const handleClosePreview = () => {
    setPreviewAed(null);
    getMoveInteraction(map)?.on();
  };

  const handleChangePosition = () => {
    setCreateMode(CreateMode.position);
  };

  // the removed AED is gone from the map, so nothing stays selected or in edit mode
  const handleOnRemoved = () => {
    if (feature) {
      map?.setFeatureState(feature.source ?? '', feature.data?.id, {
        [FEATURE_STATE.EDITING]: false,
      });
    }
    setEditFeature(null);
    deselectAllFeatures(map);
  };

  const handleOnSuccess = (successFeature: Feature<Geometry, GeoJsonProperties>) => {
    if (feature) {
      map?.setFeatureState(feature.source ?? '', feature.data?.id, {
        [FEATURE_STATE.EDITING]: false,
      });
    }

    const activeSourceId = getActiveAedOverlay(map);
    const mapGeoJSONFeature = {
      geometry: successFeature.geometry,
      properties: successFeature.properties,
      id: successFeature.id,
      type: successFeature.type,
      source: feature?.source ?? activeSourceId,
    } as MapGeoJSONFeature;

    onFeatureSelect({
      source: mapGeoJSONFeature.source,
      data: mapGeoJSONFeature,
      type: 'item-select',
    });
  };

  return (
    <>
      {previewAed && (
        <DetailView
          map={map}
          feature={previewAed}
          userLocation={userLocation ?? null}
          onCenterFeature={() => centerOnFeature(previewAed)}
          onClose={handleClosePreview}
          compact={compact}
        />
      )}
      {!previewAed && (
        <MapButtons
          createMode={createMode}
          handleCancel={handleCancel}
          handleConfirmPosition={() => void handleConfirmPosition()}
          handleChangePosition={handleChangePosition}
          compact={compact}
        />
      )}
      {createMode === CreateMode.position && !previewAed && (
        <div className="absolute top-6 z-5 w-full flex flex-row justify-center items-start h-0">
          <PositionHint
            nearbyAeds={nearbyAeds}
            isExpanded={isHintExpanded}
            onToggle={() => setIsHintExpanded(expanded => !expanded)}
            onShowNearbyAed={handleShowNearbyAed}
            onConfirm={() => void proceedToForm()}
          />
        </div>
      )}
      {createMode === CreateMode.form && (
        <AedForm
          map={map}
          apiClient={apiClient}
          form={form}
          setCreateMode={setCreateMode}
          onSuccess={handleOnSuccess}
          onRemoved={handleOnRemoved}
          onNotify={onNotify}
          compact={compact}
        />
      )}
    </>
  );
};
