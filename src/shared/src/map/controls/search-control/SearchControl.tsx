import className from 'classnames';
import {
  type Feature,
  type FeatureCollection,
  type GeoJsonProperties,
  type Geometry,
} from 'geojson';
import { type MapGeoJSONFeature } from 'maplibre-gl';
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type ApiClient } from '../../../api/api-client';
import { type FilterType, type MapEvent } from '../../../model/map';
import { searchAed } from '../../../services/aed-search.service';
import { type MapInstance } from '../../map-instance/map-instance';
import { MapIconButton } from '../../../components/ui/map-icon-button/MapIconButton';
import { useOnOutsideKeyDown } from '../../../hooks/useOnOutsideKeyDown';
import { useOnOutsidePointerDown } from '../../../hooks/useOnOutsidePointerDown';
import iconClose from './../../../assets/icons/icon-close-dark-green.svg';
import iconFilter from './../../../assets/icons/icon-filter-dark-green.svg';
import iconGpsOff from './../../../assets/icons/icon-gps-off-circle-green.svg';
import iconGpsOn from './../../../assets/icons/icon-gps-on-circle-green.svg';
import iconSearch from './../../../assets/icons/icon-search-dark-green.svg';
import { FilterControl } from './filter-control/FilterControl';
import { SearchResults } from './search-results/SearchResults';

interface Props {
  map: MapInstance | null;
  apiClient: ApiClient;
  isGpsActive: boolean;
  setIsGpsActive: Dispatch<SetStateAction<boolean>>;
  onFeatureSelect: (event: MapEvent) => void;
  activeOverlays: FilterType[];
  setActiveOverlays: Dispatch<SetStateAction<FilterType[]>>;
}

export const SearchControl = ({
  map,
  apiClient,
  isGpsActive,
  setIsGpsActive,
  onFeatureSelect,
  activeOverlays,
  setActiveOverlays,
}: Props) => {
  const { t } = useTranslation();
  const [searchResultsActiveIndex, setSearchResultsActiveIndex] = useState<number | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FeatureCollection | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const search = async () => {
      if (searchText.length > 2) {
        // Abort any ongoing search
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this search
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
          const results = await apiClient.searchAddress(searchText, { signal });
          const mapResults =
            (map && (await searchAed(searchText, map.getActiveOverlaySourceIds(), map))) ?? [];

          // Only update if not aborted
          if (!signal.aborted) {
            setSearchResults({
              type: 'FeatureCollection',
              features: [...results.features.slice(0, 4), ...mapResults.slice(0, 2)],
            });

            if (results.features.length >= 0) {
              setShowFilter(false);
              setShowSearchResults(true);
            }
          }
        } catch (error) {
          // Ignore abort errors
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Search error:', error);
          }
        }
      }
    };

    const timer = setTimeout(async () => {
      await search();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Abort search when component unmounts or searchText changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchText, map, apiClient]);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setSearchText('');
      setSearchResults(null);
      setSearchResultsActiveIndex(null);
      setShowSearchResults(false);
      return;
    }

    setSearchText(value);
  };

  const onItemSelect = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>) => {
      const mapGeoJSONFeature = {
        geometry: { ...feature.geometry, bbox: feature.bbox },
        properties: feature.properties,
        id: feature.id,
        type: feature.type,
        source: feature.properties?.source as string,
      } as MapGeoJSONFeature;

      onFeatureSelect({
        source: mapGeoJSONFeature.source,
        data: mapGeoJSONFeature,
        type: 'item-select',
      });
    },
    [onFeatureSelect]
  );

  const onReset = () => {
    setSearchText('');
    setSearchResults(null);
    setSearchResultsActiveIndex(null);
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const results = searchResults?.features;
      if (!results) {
        return;
      }
      switch (e.code) {
        case 'ArrowDown':
          setSearchResultsActiveIndex(s => (s === null || s === results.length - 1 ? 0 : s + 1));
          break;
        case 'ArrowUp':
          setSearchResultsActiveIndex(s => (s === null || s === 0 ? results.length - 1 : s - 1));
          break;
        case 'Enter':
          if (searchResultsActiveIndex !== null) {
            onItemSelect(results[searchResultsActiveIndex]);
          }
          break;
        default:
          break;
      }
    },
    [searchResults?.features, searchResultsActiveIndex, onItemSelect]
  );

  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const searchResultsContainerRef = useRef<HTMLDivElement | null>(null);
  useOnOutsidePointerDown({
    active: showSearchResults,
    refsToIgnore: [
      searchBarRef as RefObject<HTMLElement | null>,
      searchResultsContainerRef as RefObject<HTMLElement | null>,
    ],
    onOutsidePointerDown: () => {
      setShowSearchResults(false);
    },
  });

  useOnOutsideKeyDown({
    active: showSearchResults,
    keys: ['Escape'],
    refsToIgnore: [
      searchBarRef as RefObject<HTMLElement | null>,
      searchResultsContainerRef as RefObject<HTMLElement | null>,
    ],
    onOutsidePointerDown: () => {
      setShowSearchResults(false);
    },
  });

  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  useOnOutsidePointerDown({
    active: showFilter,
    refsToIgnore: [
      filterContainerRef as RefObject<HTMLElement | null>,
      toggleButtonRef as RefObject<HTMLElement | null>,
    ],
    onOutsidePointerDown: () => {
      setShowFilter(false);
    },
  });

  const dropdownOpen =
    showFilter ||
    (showSearchResults && searchResults?.features && searchResults.features.length > 0 === true);
  const mainClasses = className(
    'flex',
    'items-center',
    'bg-primary-100-white',
    'mx-4',
    'md:mx-0',
    'ps-4',
    'pe-2',
    'py-4',
    'md:p-4',
    'gap-2',
    'md:gap-4',
    'h-5',
    'md:h-7',
    'shadow-custom',
    'shadow-green-shadow',
    'box-content',
    {
      'rounded-[26px]': !dropdownOpen,
      'md:rounded-[30px]': !dropdownOpen,
      'rounded-t-[26px]': dropdownOpen,
      'md:rounded-t-[30px]': dropdownOpen,
      'border-b': dropdownOpen,
      'border-b-primary-10-green-05': dropdownOpen,
    }
  );

  return (
    <div className="z-5 absolute top-4 md:top-6 m-auto w-full flex flex-col items-center h-0">
      <div className="w-full md:w-[550px] lg:w-[650px]">
        <div
          className={mainClasses}
          onKeyDown={handleKeyDown}
          ref={searchBarRef}
          onFocus={() => setShowSearchResults(true)}
        >
          <img src={iconSearch} alt="search-icon" />
          <input
            onChange={onSearchChange}
            className="grow min-w-0 outline-hidden text-base font-normal text-primary-100-green-04 leading-6"
            type="search"
            id="search"
            placeholder={t('enterLocationOrAddress')}
            list="search-results"
            value={searchText}
            ref={searchInputRef}
            autoComplete="off"
          />
          <div className="flex justify-end items-center gap-2 ml-0">
            {searchText && (
              <MapIconButton
                title={t('clear')}
                active={false}
                icon={iconClose}
                onClick={() => onReset()}
              />
            )}
            <MapIconButton
              ref={toggleButtonRef}
              title={t('filter')}
              active={false}
              icon={iconFilter}
              onClick={() => setShowFilter(s => !s)}
            />
            <MapIconButton
              title={t('showLocation')}
              active={false}
              icon={isGpsActive ? iconGpsOn : iconGpsOff}
              variant={isGpsActive ? 'gps-on' : 'gps-off'}
              onClick={() => setIsGpsActive(s => !s)}
            />
          </div>
        </div>
        {showFilter && (
          <FilterControl
            ref={filterContainerRef}
            activeOverlays={activeOverlays}
            setActiveOverlays={setActiveOverlays}
          />
        )}
        {!showFilter && showSearchResults && (
          <SearchResults
            ref={searchResultsContainerRef}
            searchResults={searchResults}
            onItemSelect={onItemSelect}
            activeIndex={searchResultsActiveIndex}
            setActiveIndex={setSearchResultsActiveIndex}
          />
        )}
      </div>
    </div>
  );
};
