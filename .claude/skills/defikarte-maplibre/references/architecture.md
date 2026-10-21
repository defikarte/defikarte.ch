# Map architecture details

All paths are relative to `src/shared/src/map/`.

## Lifecycle

1. **Create.** The `SharedMap` effect builds `new MapInstance({ overlays: [defaultActiveOverlay (aedAll), userLocation] })`.
   The constructor creates the `OpeningHoursController` (with the AED URL + `aedSourceId`) and registers
   every strategy in the `OverlayManager`, keyed by `OverlayType`.
2. **First style load.** `styledata` → `loadOverlays()` (runs once) → for each overlay, `OverlayManager.applyOverlay`
   does: `createSource()` → `createLayers()` → `addSource` / `addLayer` if missing →
   `registerInteractions(map, onEvent)` → mark active. The AED source loads the URL in a maplibre worker.
   `load` → `init()` adds the marker images, then `openingHours.start()`.
3. **Opening status.** The controller reads the loaded `aed-source` data (no second request), collects the
   unique `opening_hours` values, and compiles them in `opening-hours.worker.ts` (cached in IndexedDB per week).
   It then calls `map.setGlobalStateProperty('oh_status', statusMap)`. Layers use `OH_STATUS_EXPRESSION`
   (`opening-hours/expressions.ts`) to pick icon and colour. A 60 s tick updates the global state only
   when a status flips.
4. **Filter change.** `useOverlays`: all statuses selected → `aedAll`, otherwise
   `setAedStatusFilter(statuses)` + `aedByStatus`. The `aedByStatus` source is built from
   `openingHours.getData(statuses)` (in memory) and follows changes via `subscribeData` → `setData`
   (only when its AEDs really changed). The filters are groups that never overlap (`availabilityGroup`):
   `ALWAYS_AVAILABLE` = open with `opening_hours=24/7`, `OH_STATUS.OPEN` = the other open ones, closed, unknown.
   Switching back to `aedAll` rebuilds its source from `openingHours.getAllAeds()`. Nothing is downloaded again.
5. **Base-layer switch.** `setActiveBaseLayer(id)` → fetch or reuse the style → `applyActiveOverlaysOnStyle`
   merges every active overlay's `createSource()` + `createLayers()` into the style →
   `setStyle(style, { diff: true })`. `createSource()` returns `source.serialize()` when the source exists.
6. **Refresh** (after create or edit). `refreshActiveOverlays()` → `refreshSourceData` → `openingHours.refresh()`
   reloads once, and the sources follow.
7. **Events to React.** Interactions emit `MapEvent`s (`item-select`, `item-move`, `map-state`) through
   `onEvent` → `SharedMap.onMapEvent` → React state. Opening status reaches React via
   `mapInstance.subscribeOpeningHoursStatus` / `getOpeningHoursStatusMap` (see `detail-view/useAedStatus.ts`).

## Existing building blocks

| Kind | Files | Notes |
|---|---|---|
| Overlays | `aed.overlay.ts` (clustered, optional source `filter`, reuses `getAllAeds`), `aed-status.overlay.ts` (in-memory source by status, `setStatuses`), `aed-create.overlay.ts` (draggable marker), `user-location.overlay.ts` (client GeoJSON) | Copy the closest one |
| Sources | `aed.source.ts` (clustered, `clusterRadius 75`, `clusterMaxZoom 14`, optional `filter`), `geojson.source.ts`, `osm.source.ts` (raster) | |
| Layers | `aed-point.layer.ts` + `aed-availability-point.layer.ts` (symbol + circle halo; status via `OH_STATUS_EXPRESSION`; feature-state `selected`/`nearby`/`editing`), `aed-cluster.layer.ts` (step on `point_count`), `aed-create-point.layer.ts`, `user-location.layer.ts`, `osm.layer.ts` | |
| Opening hours | `opening-hours/controller.ts`, `expressions.ts`, `feature-status.ts` (JS twin of the expression), `status.ts`, `compile*.ts`, worker files | Covered by `src/web/src/test/shared/opening-hours.test.ts` |
| Interactions | `item-select`, `cluster-zoom`, `cursor-clickable`, `item-move` | All implement `InteractionLayer { on, off }` |
| Hooks | `useOverlays`, `useFeatureSelection`, `useHandleCreateMode`, `useUserLocation`, `useMapEvents`, `create-aed-control/useNearbyAeds`, `detail-view/useAedStatus` | |
| Services | `aed-search.service.ts` (searches loaded source data), `nearby-aed.service.ts` (pure distance filter), `coordinate-calculation.service.ts` | Pure, so easy to test |

AED feature properties are raw OSM tags: `opening_hours`, `access`, `indoor`, `level`,
`defibrillator:location`, `description`, `operator`, `phone`, …

## Checklist: a new layer on the existing AED data (rung 4)

1. `layers/<name>.layer.ts`: `export const create<Name>Layers = (baseId, source) => LayerSpecification[]`.
   Set `minzoom`/`maxzoom`, and filter `['!', ['has','point_count']]` (points) or `['has','point_count']` (clusters).
2. Return it from `createLayers()` of **both** AED overlays (`aed.overlay.ts`, `aed-status.overlay.ts`). Place
   it in the array according to the draw order you want.
3. Make sure `cleanup()` removes it. Both overlays iterate stored layer arrays, so include the new layers in them.

## Checklist: an extra data filter (rung 3)

1. Write the expression once (for example next to the overlay, or in a small `filters` file).
2. `aedAll`: pass it as the source `filter` in `new AedOverlayStrategy(map, openingHours, filter)`, or
   register a second `OverlayType` with it.
3. `aedByStatus`: apply the same rule in JS when building the data (`featureStatus`-style), so both paths agree.
4. Toggle from `useOverlays` (state) → `FilterControl` / `FilterItem` (UI) + i18n keys (app + web, 4 locales each).
5. The data comes from `getAllAeds()`, so check that the Network tab shows no new AED request.

## Checklist: a new overlay strategy (rung 5)

1. `MapConfiguration`: add `<name>LayerId`, `<name>SourceId`.
2. `overlays/<name>.overlay.ts` implements `OverlayStrategy` (+ `RefreshableOverlayStrategy` if the data changes).
   `createSource()` reuses `map.getSource(id).serialize()` when present. `cleanup()` removes the layers,
   then the source, then calls `off()` on each interaction and unsubscribes.
3. `model/map.ts`: add an `OverlayType` key. `map-instance.ts`: `registerOverlay(...)`.
4. Activate it from React with `mapInstance.applyOverlay(...)` in an effect, and remove it in the cleanup.
5. Feed it with in-memory data (`getAllAeds()`, `getData()`, `setGeoJSONSourceData`), not a new fetch.
