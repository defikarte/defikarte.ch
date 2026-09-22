# Figma design source

Reference for pulling designs out of the defikarte.ch Figma file into this repo.

- **File**: [defikarte.ch - designfile](https://www.figma.com/design/21rVZr7QOMnS6jsNZexKa9/defikarte.ch---designfile)
- **File key**: `21rVZr7QOMnS6jsNZexKa9`
- **Only page**: `877:679` — `01_Intro`. Everything else is a section under it.
- **Plan**: the Defikarte.ch team is on Figma **Pro**. Code Connect requires Organization/Enterprise, so there is
  deliberately no `figma.config.json` and no `.figma.ts` template in this repo. The workflow below is read-only.
- **No subscribed libraries** (`libraries_added_to_file` is empty). Every component is local to the file, so
  `search_design_system` / `get_libraries` are not useful here — use `get_metadata` and `get_design_context`
  against concrete node ids instead.

## Screen index

Section `3014:169324` — **Phase 02 - Variante 01** (3945x1939), the current mobile design. All nine child
frames are named `App - media md 320x568`, so use the node id, not the name, to pick one.

| Node id | Screen | Code |
|---|---|---|
| `3010:161138` | Map, default — search bar + nav bar | [index.tsx](../src/app/src/routes/index.tsx), [SearchControl.tsx](../src/shared/src/map/controls/search-control/SearchControl.tsx) |
| `3010:161206` | Map, marker selected — collapsed `Defi_Details` peek + `Hand` tap gesture | [DetailView.tsx](../src/shared/src/map/controls/detail-view/DetailView.tsx) |
| `3010:161277` | Map + expanded AED detail sheet (all property rows) | [DetailView.tsx](../src/shared/src/map/controls/detail-view/DetailView.tsx), [FeaturePropsList.tsx](../src/shared/src/map/controls/detail-view/property-list/FeaturePropsList.tsx) |
| `3010:132965` | Settings menu — *Sprache* + *Kartendesign* | [settings.index.tsx](../src/app/src/routes/settings.index.tsx) |
| `3010:133056` | Settings menu variant — *Kartendesign* only | [settings.index.tsx](../src/app/src/routes/settings.index.tsx) |
| `3010:133413` | Settings > Sprache — Deutsch / Français / Italiano / English, check mark on active | [settings.language.tsx](../src/app/src/routes/settings.language.tsx) |
| `3010:133704` | Settings > Kartendesign — Base Map / Open Street / Satellit, 48x48 thumbnails | [settings.mapdesign.tsx](../src/app/src/routes/settings.mapdesign.tsx) |
| `2969:138820` | Create AED step 1 — tap position on map, hint banner, confirm/cancel | [CreateAedControl.tsx](../src/shared/src/map/controls/create-aed-control/CreateAedControl.tsx), [MapButtons.tsx](../src/shared/src/map/controls/create-aed-control/map-buttons/MapButtons.tsx) |
| `3010:63970` | Infos — *Das Projekt*, *Sponsoren* (tall, 320x1739) | [about.tsx](../src/app/src/routes/about.tsx) |

All nine were confirmed to resolve with `get_metadata`. `3010:63970` is by far the largest at ~65KB — it comes
back as a persisted file rather than inline, which is fine; drill into its child frames if you only need part.

## Component mapping

| Figma instance / frame | Code |
|---|---|
| `Button Primary XS`, `Button Primary Small White` | [Button.tsx](../src/shared/src/components/ui/button/Button.tsx) |
| `map-icons-round` | [MapIconButton.tsx](../src/shared/src/components/ui/map-icon-button/MapIconButton.tsx) |
| `textfield` | [TextField.tsx](../src/shared/src/components/ui/text-field/TextField.tsx) |
| `Search bar Mobile` | [SearchControl.tsx](../src/shared/src/map/controls/search-control/SearchControl.tsx) |
| `Defi_Details` | [DetailView.tsx](../src/shared/src/map/controls/detail-view/DetailView.tsx) |
| `app-menu`, `app-menu-single` | [NavBar.tsx](../src/app/src/app/layout/nav-bar/NavBar.tsx), [IconLink.tsx](../src/app/src/app/layout/nav-bar/IconLink.tsx) |
| `Settings-rechts` | [SettingsPage.tsx](../src/app/src/app/layout/settings-page/SettingsPage.tsx) |
| `map-marker-einzel`, `map-marker-einzel-aktiv` | `defi-map-marker-*.svg` in [assets/icons/](../src/shared/src/assets/icons/) |
| `icon-*-NNxNN` | `icon-*.svg` in [shared assets/icons/](../src/shared/src/assets/icons/) or [app assets/icons/](../src/app/src/assets/icons/) |

**No code counterpart yet**: `arrow-down` (15 uses in the section) and `Textlink`. Build these as shared
primitives rather than one-off markup when a screen first needs them.

### Icon naming

Figma encodes **size** in the name, the repo encodes **colour**:

```
Figma   icon-close-20x20        icon-access-16x16
repo    icon-close-dark-green   icon-access-dark-green / icon-access-grey
```

Match on the middle token. Resolve the size from the frame dimensions in the design and the colour from the
surrounding context (active vs. disabled). Do not add a size-suffixed duplicate to `assets/icons/`.

There are **two** icon directories. [src/shared/src/assets/icons/](../src/shared/src/assets/icons/) holds map
and detail-view icons used by both app and web; [src/app/src/assets/icons/](../src/app/src/assets/icons/)
holds app chrome (nav bar, settings, back arrow). Put a new icon where its consumer lives — shared only if
both apps use it. Note `icon-close-dark-green.svg` and `icon-external-link-middle-green.svg` already exist in
both; don't add a third copy.

## Variables to Tailwind tokens

The Figma variable names map onto the `@theme` block in
[index.css](../src/app/src/app/styles/index.css) (mirrored in [web/index.css](../src/web/src/index.css)) by a
direct rule:

```
Primary/{opacity}%/{Name}  ->  --color-primary-{opacity}-{kebab-case name}
```

Verified examples:

| Figma variable | Tailwind token | Value |
|---|---|---|
| `Primary/100%/Green 01` | `--color-primary-100-green-01` | `#c9dcb7` |
| `Primary/100%/Green 02` | `--color-primary-100-green-02` | `#98c867` |
| `Primary/100%/Green 04` | `--color-primary-100-green-04` | `#154430` |
| `Primary/10%/White` | `--color-primary-10-white` | `rgba(255,255,255,0.1)` |

Type variables (`Headlines/Mobile/h3 medium mobile`, `Body/text-xs medium`) are all Poppins, which is already
loaded via `@font-face`. Spacing variables are plain pixel values (`spacing 4` = `16`) — express them as
Tailwind spacing utilities, never as arbitrary values.

**Always resolve a colour through the token.** If `get_variable_defs` returns a hex that has no `@theme` entry,
add the token first; do not inline the hex.

## Workflow

1. Take a Figma URL containing `node-id`. Convert the hyphen to a colon: `3010-133413` -> `3010:133413`.
2. `get_metadata` with `fileKey` + that node id.
   **Scope to a single screen frame.** A section-level call on `3014:169324` returns ~112k characters and
   overflows the token limit. The nine ids in the table above are all safe.
3. `get_screenshot` on the same node for the visual reference.
4. `get_variable_defs` on the node, then translate through the token table above.
5. Map instances via the component table. Reuse the existing `components/ui` primitives — do not re-implement
   a button, text field, or tag.
6. `download_assets` only for genuinely new icons, into the icon directory matching the consumer (see above).

Read-only Figma MCP tools are allowlisted in [.claude/settings.json](../.claude/settings.json). Every write
path (`use_figma`, `generate_figma_design`, `create_new_file`, `upload_assets`) stays behind a prompt on
purpose — this repo treats the Figma file as a source, not a target.
