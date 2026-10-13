import { MapConfiguration } from '../../map-instance/configuration/map.configuration';

interface Props {
  activeBaseLayer: string;
}

export const AttributionControl = ({ activeBaseLayer }: Props) => {
  const isMaptilerLayerActive = activeBaseLayer === MapConfiguration.osmVectorBasemapId;
  const isSwisstopoLayerActive = activeBaseLayer === MapConfiguration.swisstopoImageryBaseMapId;
  return (
    <div className="z-30 absolute bottom-0 left-4 px-1 bg-primary-80-white rounded-t-sm flex items-center">
      <div className="flex items-center text-graustufen-grau-e">
        <a
          href="https://maplibre.org/"
          target="_blank"
          className="text-[8px] md:text-[10px] p-0 m-0 leading-[150%]"
        >
          MapLibre
        </a>
        <span className="text-[8px] md:text-[10px] mx-1">|</span>
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          className="text-[8px] md:text-[10px] leading-[150%]"
        >
          © OpenStreetMap contributors
        </a>
        {isMaptilerLayerActive && (
          <>
            <span className="text-[8px] md:text-[10px] mx-1">|</span>
            <a
              href="https://www.maptiler.com/copyright/"
              target="_blank"
              className="text-[8px] md:text-[10px] leading-[150%]"
            >
              © MapTiler
            </a>
          </>
        )}
        {isSwisstopoLayerActive && (
          <>
            <span className="text-[8px] md:text-[10px] mx-1">|</span>
            <a
              href="https://www.swisstopo.admin.ch/"
              target="_blank"
              className="text-[8px] md:text-[10px] leading-[150%]"
            >
              © swisstopo
            </a>
          </>
        )}
      </div>
    </div>
  );
};
