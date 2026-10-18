# Component inventory

Source of truth is the code. Figma names are taken from [docs/figma.md](../../../../docs/figma.md). After
each Figma sync, reconcile this file against the component sheet (node `877:134`).

## Shared primitives — `src/shared/src/components/ui/` (import from `@defikarte/shared`)

| Component | Props / variants | Use for | Figma |
|---|---|---|---|
| `Button` | `variant: primary \| secondary \| white`, `size: regular \| large`, `icon`, `iconHover`, `iconOnly`, + all `<button>` attrs | Every text or icon+text action. Primary = gradient green CTA. White/secondary = second action. `iconOnly` = round icon action (see `MapButtons` for the icon-only on mobile / labelled on desktop pair) | `Button Primary XS`, `Button Primary Small White` |
| `IconButton` | `icon` (required), `variant: tint \| secondary \| white \| white-transparent`, `size: regular \| large` | Small round icon-only action inside content (close a toast or sheet, …) | — |
| `MapIconButton` | `icon`, `active`, `variant: default \| gps-on \| gps-off`, `ref` | Round buttons floating on the map (filter, GPS, layer). `active` = toggled state | `map-icons-round` |
| `Tag` | `icon` (required), `variant: primary \| tint \| secondary \| green \| orange \| red`, children | Small status pill with icon (e.g. "Indoor", "Private"). `green`/`orange`/`red` = open / unknown / closed (red + `icon-access-white` = not publicly accessible), matching the map marker colours (see `DetailView`) | — |
| `TextField` | `label`, `type`, `tooltip?: TooltipData`, `error?`, + `<input>` attrs; `required` adds red `*` | Every single-line input. Works with react-hook-form `register()` | `textfield` |
| `SelectField` | `label`, `options: string[]` (i18n keys, translated inside), `tooltip?`, `error?` | Every dropdown or single choice from a short list in forms | — |
| `Tooltip` | `tooltip?: { title, content, link? }` | "?" help popover next to a field label. Used internally by TextField/SelectField | — |

Hooks for popovers and menus: `useOnOutsidePointerDown`, `useOnOutsideKeyDown` (shared). Use them for
anything that closes on an outside click or Esc.

## Shared map controls — composed patterns to copy from (`src/shared/src/map/controls/`)

| Control | Pattern it demonstrates |
|---|---|
| `DetailView` + `property-list/FeaturePropsList`, `ItemProperty`, `AedPhoto` | Bottom sheet / side panel with a list of icon+label rows (Figma `Defi_Details`) |
| `SearchControl` + `SearchResults/ResultItem` | Search bar with result list (Figma `Search bar Mobile`) |
| `FilterControl` + `FilterItem` | Toggle list in a popover |
| `CreateAedControl` + `AedForm` | Multi-step flow with a form built from TextField/SelectField |
| `MapButtons` | Floating bottom action bar: icon-only on mobile, labelled from `md:` |
| `PositionHint` | White pill/card banner with icon + text, expands into a list. Neutral vs. warning (orange border) state |
| `AttributionControl` | Small map overlay text |

## Web-only — `src/web/src/components/ui/`

| Component | Props | Use for |
|---|---|---|
| `Text` | `size: small \| regular \| medium \| large \| x-large` (medium+ render h3/h2/h1), `weight: light \| regular \| bold`, `variant: primary \| tint \| white`, `center` | All running text and headings on content pages |
| `ContentWrapper` | `variant: white \| beige \| green-gradient \| green`, `paddingY: small \| regular \| large` | Every full-width page section with centred, max-width content |
| `Hero` | `title`, `description[]`, `image?`, `buttonText`, `buttonIcon`, `onButtonClick` | Top section of a landing page |
| `Accordion` | `title`, `content`, `defaultOpen?` | FAQ / collapsible text blocks (Knowledge page) |
| `CustomToast` | `toastInstance`, `title?`, `message?`, `icon?` | All notifications, via `react-hot-toast` `toast.custom(...)` |
| `FullscreenWrapper` | children | Full-height page under the nav (map page) |
| `SuspenseWrapper` | children | Lazy route loading fallback |
| `SplashScreen` | — | Initial map load |

Web modules with reusable patterns: `modules/sponsors/sponsor-card/SponsorCard`, `modules/nav-bar/language-menu/LanguageMenu`
(dropdown menu), `modules/map/controls/map-control/MapControl` (map popover), `modules/footer/Footer`, `modules/project/osm-section/OsmSection` (section with external links).

## App-only — `src/app/src/`

| Component | Props | Use for |
|---|---|---|
| `app/layout/settings-page/SettingsPage` | `title`, `backTo?` | Every settings or sub-page: green gradient, centred title, back arrow, safe-area insets (Figma `Settings-rechts`) |
| `app/layout/settings-page/SettingsOption` | `selected`, `onSelect`, `leading?` | Single-choice list rows with a check mark (language, map design). A11y via `role="radio"` |
| `app/layout/nav-bar/NavBar` + `icon-link/IconLink` | `iconSrc`, `activeProps.iconSrc` | Bottom tab navigation (Figma `app-menu`) |
| `components/ui/custom-toast/CustomToast` | as web | Notifications |
| `components/ui/splash-screen/SplashScreen` | — | App start |

## Not in code yet (exists in Figma)

- `arrow-down` (15 uses in the Phase 02 section)
- `Textlink`

Build these as shared primitives the first time a screen needs them, and update this table.

## Common requests → answer

| Request | Use |
|---|---|
| "a dropdown / menu" | Forms: `SelectField`. App settings: `SettingsPage` + `SettingsOption` list (that *is* the app's selection pattern). Web dropdown: `LanguageMenu` pattern. Outside-click close: `useOnOutsidePointerDown` (as in `MapControl`, `SearchControl`) |
| "a modal / dialog" | No modal component exists. Prefer an inline step (like `CreateAedControl`), a bottom sheet like `DetailView`, or a `CustomToast` for confirmations. Ask before adding a modal |
| "a badge / chip / label" | `Tag` |
| "a card" | Web: `ContentWrapper` section or the `SponsorCard` pattern. Map: the `PositionHint` container classes |
| "a collapsible / FAQ" | `Accordion` (web) |
| "a share / navigate / call action" | Add to the existing action row of `DetailView`, which already holds `IconButton`s + a primary `Button` ("Navigieren"). Secondary actions = `IconButton`; never a second primary `Button` |
| "a loading state" | `SplashScreen` / `SuspenseWrapper`. For a button: the `disabled` prop (renders `opacity-50`) |
| "an error / success message" | `CustomToast` via react-hot-toast. For fields: the `error` prop |
