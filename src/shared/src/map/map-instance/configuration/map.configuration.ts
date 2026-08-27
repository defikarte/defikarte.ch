import { type StyleSpecification } from 'maplibre-gl';
import { createOsmLayer } from '../layers/osm.layer';
import { createOsmSource } from '../sources/osm.source';
import imagerybasemap from '../styles/imagerybasemap.style.json';

export interface MapConfigurationOptions {
  baseUrl: string;
  backendApiKey: string;
  maptilerApiKey: string;
}

export class MapConfiguration {
  public static defaultCenter: [number, number] = [8.12, 46.75];
  public static defaultBounds: [[number, number], [number, number]] = [
    [5.98, 45.35],
    [10.2, 48.1],
  ];

  public static osmVectorBasemapId = 'osm-vector';
  public static osmBaseMapId = 'osm-common';
  public static swisstopoImageryBaseMapId = 'swisstopo-imagery-basemap';

  public static osmBaseMapLayerId = 'osm-common-layer';
  public static osmLayerSourceId = 'osm-common-source';

  public static aedPointLayerId = 'aed-layer';
  public static aedSourceId = 'aed-source';

  public static aedAvailabilityPointLayerId = 'aed-availability-layer';
  public static aedAvailabilitySourceId = 'aed-availability-source';

  public static userLocationLayerId = 'user-location-layer';
  public static userLocationSourceId = 'user-location-source';

  public static aedCreatePointLayerId = 'aed-create-layer';
  public static aedCreateSourceId = 'aed-create-source';

  public static aedGeoJsonUrl = '';

  public static baseLayers: Record<string, string | StyleSpecification> = {};

  public static init(options: MapConfigurationOptions) {
    this.aedGeoJsonUrl = `${options.baseUrl}v3/aed?code=${options.backendApiKey}`;

    this.baseLayers = {
      [this.osmVectorBasemapId]:
        `https://api.maptiler.com/maps/0197f0bb-e6c3-791b-bc7d-02b7b0afea60/style.json?key=${options.maptilerApiKey}`,
      [this.osmBaseMapId]: {
        version: 8,
        sources: {
          [this.osmLayerSourceId]: createOsmSource(),
        },
        glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${options.maptilerApiKey}`,
        layers: [createOsmLayer(this.osmBaseMapLayerId, this.osmLayerSourceId)],
      },
      [this.swisstopoImageryBaseMapId]: {
        ...imagerybasemap,
        glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${options.maptilerApiKey}`,
      } as StyleSpecification,
    };
  }
}
