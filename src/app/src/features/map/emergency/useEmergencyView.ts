import { type MapInstance, type MapInteractionEvent, useBestAeds } from '@defikarte/shared';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useEmergencyDefault } from '../../../hooks/useEmergencyDefault';

interface UseEmergencyViewProps {
  map: MapInstance | null;
  // false during a create or edit flow: the view and its highlight make room for it
  isAvailable: boolean;
  userLocation: GeolocationPosition | null;
  isGpsActive: boolean;
  setIsGpsActive: Dispatch<SetStateAction<boolean>>;
  selectedFeature: MapInteractionEvent | null;
  deselectAll: () => void;
}

/**
 * State of the emergency view: on/off with its GPS request, the best AEDs around the user and the
 * one of them it shows. A tap on one of their markers selects it in the view instead of opening the
 * detail view, so the view behaves the same however an AED is chosen.
 */
export const useEmergencyView = ({
  map,
  isAvailable,
  userLocation,
  isGpsActive,
  setIsGpsActive,
  selectedFeature,
  deselectAll,
}: UseEmergencyViewProps) => {
  const [emergencyDefault] = useEmergencyDefault();
  // the setting turns the view on at app start, together with its GPS request (below)
  const [isActive, setIsActive] = useState(() => emergencyDefault === 'on');
  // Here, not in the control: it unmounts during a create flow, the FAB stays collapsed for the
  // session.
  const [isFabCollapsed, setIsFabCollapsed] = useState(false);
  const collapseFab = useCallback(() => setIsFabCollapsed(true), []);
  const gpsStartedRef = useRef(false);
  // null: the best AED
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const { bestAeds } = useBestAeds({
    map,
    isActive: isActive && isAvailable,
    userLocation,
    selectedId,
  });
  const selectedAed =
    bestAeds.find(({ feature }) => feature.id === selectedId) ?? bestAeds.at(0) ?? null;

  // The emergency view is useless without the user's position, so turning it on always starts the
  // location request right away (a no-op if GPS is already on).
  const toggle = () => {
    if (isActive) {
      // GPS stays on, the user keeps seeing their position
      setIsActive(false);
      return;
    }

    // a new search starts with the best AED again
    setSelectedId(null);
    setIsActive(true);
    setIsGpsActive(true);
  };

  // Right at start, not after the map is initialised: that only happens once every map source has
  // loaded, which can take long after the splash is gone (or never, e.g. offline). useUserLocation
  // waits for the map instance itself before it requests the permission and the position.
  useEffect(() => {
    if (gpsStartedRef.current) {
      return;
    }

    gpsStartedRef.current = true;
    if (isActive) {
      setIsGpsActive(true);
    }
  }, [isActive, setIsGpsActive]);

  // GPS turned off with the search bar button also ends the view: without a position its AEDs
  // would be stale. (A failed request turns GPS off too, but the view stays to offer a retry.)
  const setIsGpsActiveFromSearch: typeof setIsGpsActive = value => {
    const next = typeof value === 'function' ? value(isGpsActive) : value;
    if (!next) {
      setIsActive(false);
    }
    setIsGpsActive(next);
  };

  // Requests the position again. A fatal error has already turned GPS off; an inaccurate fix keeps
  // it on, so it is turned off first - in a later tick, or React would batch both into a no-op.
  const retryLocation = () => {
    setIsGpsActive(false);
    setTimeout(() => setIsGpsActive(true));
  };

  // A tap on one of the view's AEDs on the map: shown in the view, not in the detail view.
  const tappedId = selectedFeature?.data?.id;
  const isViewAedTapped =
    isActive && isAvailable && bestAeds.some(({ feature }) => feature.id === tappedId);
  // selected while rendering (React's "adjust state on a prop change"), so the detail view of the
  // tap never shows for a frame
  const [prevTappedId, setPrevTappedId] = useState(tappedId);
  if (tappedId !== prevTappedId) {
    setPrevTappedId(tappedId);
    if (isViewAedTapped && tappedId !== undefined) {
      setSelectedId(tappedId);
    }
  }
  // ...and the map selection it made is undone, the view draws its own
  useEffect(() => {
    if (isViewAedTapped) {
      deselectAll();
    }
    // not deselectAll: a new function on every render of SharedMap, the tap is what matters
  }, [isViewAedTapped, tappedId]);

  return {
    isActive,
    toggle,
    retryLocation,
    setIsGpsActiveFromSearch,
    isFabCollapsed,
    collapseFab,
    bestAeds,
    selectedAed,
    select: (id: string | number | undefined) => setSelectedId(id ?? null),
    // the map selection is about to be taken over by the view - no detail view for it
    isViewAedTapped,
  };
};
