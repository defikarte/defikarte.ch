---
name: defikarte-maplibre
description: How to change the MapLibre map of defikarte.ch (src/shared/src/map) with the fewest requests, best performance and the smallest diff. Use this skill for anything that touches the map - markers, layers, sources, clustering, overlays, filters, opening-hours status, highlighting or selecting AEDs, base layers / map styles, user location, search over AEDs, GeoJSON, the /v3/aed data, map controls, or "the map is slow / loads too much" - even if the user doesn't say "MapLibre".
---

# defikarte.ch MapLibre

The map shows ~15'000 AEDs, often on a phone with a weak connection, in an emergency. Every extra
request delays the moment someone sees the nearest defibrillator. Every extra abstraction makes the next
change slower. So there are two goals, in this order:

1. **No new network requests** unless there is truly no other way. Reuse what the map already loaded.
2. **The smallest diff** that fits the existing architecture. Extend what exists. Don't restructure.

Both apps (`src/app`, `src/web`) render the same `SharedMap`, so map code belongs in `src/shared` and
both apps get it for free. The library is maplibre-gl **5.x**, so `global-state` expressions and
`setGlobalStateProperty` are available.

## Architecture in 30 seconds

```
SharedMap.tsx (React state, hooks)          src/shared/src/map/
 └─ MapInstance (map-instance.ts)           wraps maplibre Map; registers overlays, images, base layers
     ├─ OpeningHoursController              opening-hours/: holds ALL AEDs in memory (getAllAeds),
     │                                      computes open/closed/unknown in a web worker, writes it to
     │                                      the map global state `oh_status` (no per-feature updates)
     └─ OverlayManager                      apply / remove / refresh overlays, re-adds them on style switch
         └─ OverlayStrategy (model/map.ts)  = getSourceId + createSource + createLayers
              ├─ sources/*.source.ts             + registerInteractions + cleanup
              ├─ layers/*.layer.ts          pure functions returning LayerSpecification[]
              └─ interactions/*.ts          on()/off() map event handlers (select, cluster-zoom, cursor, move)
configuration/map.configuration.ts          all source/layer ids, data URL, base-layer styles
configuration/constants.ts                  COLORS, FEATURE_STATE, OH_STATUS_STATE, marker image ids
opening-hours/expressions.ts                OH_STATUS_EXPRESSION + icon/colour expressions for layers
hooks/useOverlays.tsx                       FilterType[] (UI statuses + 24h) → aedAll | aedByStatus
```

Overlays today: `aedAll` (`AedOverlayStrategy`, clustered `aed-source`), `aedByStatus`
(`AedStatusOverlayStrategy`, its own source built in memory from `openingHours.getData(statuses)`),
`userLocation`, `aedCreate`. For the lifecycle and step-by-step checklists, read
[references/architecture.md](references/architecture.md).

## The minimal-change ladder

Climb only as far as you need. Say which rung you chose and why the lower ones were not enough.

| # | Change | Network cost | Typical files |
|---|---|---|---|
| 1 | A **paint/layout expression** on an existing layer (`case`, `match`, `step`, `interpolate`, `['zoom']`, `OH_STATUS_EXPRESSION`) | 0 | `layers/aed-point.layer.ts` |
| 2a | **`feature-state`** for runtime state of a *few* features (selected, nearby, editing, …). Add a key to `FEATURE_STATE` and read it in an existing expression | 0 | `constants.ts`, the layer, the hook that sets the state |
| 2b | **`global-state`** for runtime state that applies to *many* features at once (the `oh_status` pattern): one `setGlobalStateProperty` call, and layers read `['global-state', key]` | 0 | `constants.ts`, the layer, the controller/hook that sets it |
| 3 | A **filter on data already in memory**: a source `filter` passed to `AedOverlayStrategy(map, openingHours, filter)`, or a filter step in `OpeningHoursController.getData` / `AedStatusOverlayStrategy` | 0 (built from `getAllAeds()`) | the overlay, `model/map.ts`, `useOverlays.tsx` |
| 4 | A **new layer on an existing source** (for example a `heatmap` or `circle` layer on `aed-source`, return it from an existing `createLayers`) | 0 | new `layers/x.layer.ts`, one line in the overlay(s) |
| 5 | A **new OverlayStrategy** with a client-side GeoJSON source fed from data you already have | 0 | `overlays/x.overlay.ts`, register in `MapInstance` |
| 6 | A **new remote source or API call** | ≥1 | Needs justification (see below) |

Rungs 1–2 also cost nothing at render time. They don't re-tile the GeoJSON source. Prefer them over
`setData` every time.

## Request rules (with the existing code to copy)

- **The AEDs are downloaded once.** Read them from memory, never fetch them again:
  - `OpeningHoursController.getAllAeds()` gives all AEDs (this is how `AedOverlayStrategy.createSource`
    avoids a re-download after a filter change). `getData(statuses)` and `subscribeData(...)` give the AEDs
    by status.
  - `mapInstance.getGeoJsonSourceData(sourceId)` reads a source's loaded data. `aed-search.service.ts`
    uses it, so search makes no request.
  - If React code needs all AEDs, expose `getAllAeds()` through `MapInstance` (as was done for
    `getOpeningHoursStatusMap`), and don't call `apiClient.requestAedData()`.
- **Cache the promise and fetch at most once per flow:** `ref.current ??= fetch()` (`useNearbyAeds.ts`,
  `controller.loadFeatures`). Reset it on error.
- **Abort superseded requests** with an `AbortController`, and pass `signal` through `RequestOptions`.
- **On a base-layer switch, don't refetch anything.** `setActiveBaseLayer` → `applyActiveOverlaysOnStyle` →
  `setStyle(style, { diff: true })`. `createSource()` must return `map.getSource(id).serialize()` when the
  source already exists (as both AED overlays do). Otherwise the style diff reloads the URL.
- **Time-dependent state is computed, not refetched.** Opening status changes over time through the
  controller's tick and global state. Never poll the backend for it.
- If a new request is really needed, give it a stable URL (so the browser can cache it), an abort signal and
  an empty-result fallback (`ApiClient` returns an empty `FeatureCollection`, it doesn't throw). Then tell
  the user how many requests it adds and when.

## Performance rules

- **Selection and highlighting use `setFeatureState`** for single features, or **`setGlobalStateProperty`**
  for a rule over all features. Never `setData` and never remove and re-add a layer for this.
- **Feature state is lost** when a source is removed and re-added (filter change, `aedAll` ↔ `aedByStatus`)
  and possibly on a style switch. If a highlight must survive, re-apply it from the hook that owns it, the
  way `useNearbyAeds` re-runs its effect. Global state survives, because it lives on the map, not on the source.
- **Keep one source per dataset.** Add layers to it. Every GeoJSON source re-tiles in a worker, so avoid a
  second copy of the same AEDs.
- **Use a source `filter` (not a layer filter)** when cluster counts have to match what's shown. Source
  filters run before clustering.
- **Heavy computation goes off the main thread.** Opening hours are compiled in `opening-hours.worker.ts`
  and cached in IndexedDB. Follow that pattern, don't loop over 15'000 features on every render.
- **Add images once** in `MapInstance.init` (4× scaled SVG, `IMAGE_SCALE`). Never inside handlers.
- **Interactions:** every `map.on(...)` in `on()` needs a matching `map.off(...)` with the *same function
  reference* in `off()`. Use arrow-function class fields. `cleanup()` calls `off()`.
- **Hot paths** (`move`, `zoom`, `mousemove`, GPS updates): no `queryRenderedFeatures` without a `layers`
  filter, no React state update per frame, and debounce or use `moveend`. Only recompute on GPS ticks when
  the position moved meaningfully.
- **React:** `MapInstance` is created once (ref in `SharedMap`). Never recreate it. Call its methods from an
  effect and undo the change in the cleanup (`useOverlays.tsx` is the template).
- Use **`minzoom`/`maxzoom`** on layers so they don't render at zoom levels where they're useless.

## Smallest-diff rules

- New ids go in `MapConfiguration`, colours in `COLORS`, per-feature keys in `FEATURE_STATE`, and global
  keys next to `OH_STATUS_STATE`. Don't scatter string literals.
- Layer factories are pure `(baseId, sourceId) => LayerSpecification[]`. Follow `aed-point.layer.ts`.
  Layer order in the returned array = draw order. Both AED overlays usually need the same layer change
  (`aed-point.layer.ts` and `aed-availability-point.layer.ts`).
- Status logic exists twice on purpose: `OH_STATUS_EXPRESSION` (style) and `featureStatus` (JS). Change both together.
  Rule: `access=no` or `private` → closed, else the `opening_hours` status (`24/7` = open until computed, otherwise unknown).
- Export from `src/shared/src/index.ts` only what app or web actually import.
- Don't rename, move or "clean up" neighbouring code as part of a map change. Mention issues instead.
- Known hotspots. Point them out when relevant, but only fix them if asked:
  - `useNearbyAeds` falls back to `apiClient.requestAedData()` when `aedByStatus` is active, although
    `getAllAeds()` has the data.
  - `osm.source.ts` uses a single tile host.
  - `ClusterZoomInteraction.off()` doesn't remove its click handler (it passes a new function).

## Verify

- `cd src/shared && npx tsc --noEmit`
- `cd src/web && pnpm test` (shared map logic is tested in `src/web/src/test/shared/`, e.g.
  `opening-hours.test.ts`). Add a test there for new pure services or filters.
- In the browser's Network tab, filter by `aed` and count the requests before and after the change. State the
  numbers in your summary. Switch the base layer and a status filter once each, and confirm that no AED
  request fires.
