---
name: defikarte-ui
description: UI rules for defikarte.ch (React + Tailwind in src/app, src/web, src/shared). Use this skill whenever the task touches anything visible - a new screen, page, section, button, form field, card, list, dialog, sheet, banner, toast, menu, icon, colour, spacing or Tailwind class - or when a Figma link/node of the defikarte.ch designfile appears, even if the user just says "add a … to the page" or "make it look like the design". It decides whether an existing component already covers the request, and pushes back on inventing new components.
---

# defikarte.ch UI

defikarte.ch is a life-saving tool: people open it under stress to find the nearest defibrillator. The UI
has to be calm, obvious and consistent across the native app (`src/app`) and the website (`src/web`).
That is why this repo has a small, fixed set of components, all derived from the Figma designfile. Every
new look-alike makes the product less predictable and doubles maintenance across two apps, so the
default answer to "build a new X" is "here is the existing component that does X".

Full component inventory with props and variants: [references/components.md](references/components.md).
Read it before you write any JSX.

## Step 1 - The decision gate (always run it, and say the result out loud)

Before you write UI code, go through these in order and stop at the first one that fits:

1. **An existing component does it**, maybe with an existing variant/size prop.
   Use it as-is. Don't fork it, and don't copy its classes into a new element.
2. **A composition of existing components does it.** Examples: a settings row = `SettingsOption`, an info box =
   the `PositionHint` pattern (`bg-primary-100-white rounded-2xl shadow-custom shadow-green-shadow`), and a
   collapsible = `Accordion` (web).
   Compose them in the feature folder. That is not a new primitive.
3. **A component that exists in Figma but not yet in code** (currently `arrow-down`, `Textlink`, see
   [docs/figma.md](../../../docs/figma.md)). Build it **once** as a shared primitive that matches the
   Figma node, with the same file layout as `Button.tsx`.
4. **Nothing fits.** Do not invent a component silently. Stop and tell the user, in this format:

   > **New UI element requested: <name>**
   > - **Closest existing option:** <component + how it could cover ≥80% of the need>
   > - **Best practice:** <how comparable apps solve it; platform convention (iOS/Android/web)>
   > - **Simplest user-friendly version:** <the smallest thing that solves the user problem>
   > - **Needs design?** <yes - ask design to add it to Figma first / no - pure composition>

   Then go ahead with the closest existing option unless the user explicitly wants the new element.

At the start of your answer, state which step applied (for example "Step 1: `Button variant="secondary"`").
This makes the reuse decision easy to review.

### UX checks for anything you build or propose
- Mobile first: the smallest designed width is **320px** (Figma frames `App - media md 320x568`).
- Touch targets should be at least ~40px. Primary actions sit at the bottom, within thumb reach, like `MapButtons`.
- One primary action per view. Secondary actions use `variant="white"` / `"secondary"`.
- Don't make the map smaller or cover it more than you need to. On the map, the map is the product.
- Prefer native elements (`<button>`, `<select>`, `<a>`). Give them `aria-*` labels the way `SettingsOption` (`role="radio"`) and `Accordion` (`aria-expanded`) do.
- Fewer states and options are better. When in doubt, leave it out and say so.

## Step 2 - Where the code goes

| Used by | Location |
|---|---|
| app **and** web | `src/shared/src/components/ui/<kebab-name>/<PascalName>.tsx`, exported from `src/shared/src/index.ts` |
| map controls (both) | `src/shared/src/map/controls/...` |
| web only | `src/web/src/components/ui/...` (primitive) or `src/web/src/modules/<feature>/...` (feature) |
| app only | `src/app/src/app/layout/...` (chrome) or `src/app/src/components/ui/...` |

Only move a component to shared once both apps really use it. Import shared code via `@defikarte/shared`
from app/web code. Inside `src/shared`, use relative imports.

## Step 3 - Styling rules

- **Colours only through tokens** from the `@theme` block: `bg-primary-100-green-04`,
  `text-secondary-orange-02`, `border-primary-10-green-05`, and so on. Never use a raw hex or `[#…]`. If a design
  colour has no token, add it to **both** [src/app/src/app/styles/index.css](../../../src/app/src/app/styles/index.css)
  and [src/web/src/index.css](../../../src/web/src/index.css), using the name rule
  `Primary/{opacity}%/{Name}` → `--color-primary-{opacity}-{kebab-name}`.
- Use Tailwind spacing utilities (`gap-2`, `px-3`) and not arbitrary pixel values. Figma `spacing 4` = 16px = `4`.
- Font: Poppins is already loaded. Use the weights `font-light/normal/medium/semibold`. On the web, use
  `Text` (`size`, `weight`, `variant`) for running text and headings, not raw `<p className="text-…">`.
- Variants follow the existing pattern: `classnames` with an object of `{ 'classes': variant === 'x' }`, and
  the `className` prop is merged in. Look at `Button.tsx` or `Tag.tsx` and copy the shape.
- Shadows: `shadow-custom shadow-green-shadow` (cards and bars) or `shadow-custom-lg shadow-green-shadow-64` (popovers).
- Radii in use: `rounded-lg` (inputs), `rounded-xl` (settings rows, accordion), `rounded-2xl` (cards,
  popovers, tags), and pills via `rounded-[50px]` / `rounded-full`.

## Step 4 - Icons

- Look first in [src/shared/src/assets/icons/](../../../src/shared/src/assets/icons/) (map and detail icons)
  and `src/app/src/assets/icons/` (app chrome), then in `src/web/src/assets/`.
- The repo names icons by **colour** (`icon-close-dark-green.svg`), and Figma names them by **size**
  (`icon-close-20x20`). Match on the middle token. Never add a size-suffixed duplicate.
- A new icon goes in the folder of the app that uses it. Only download it from Figma if it really is missing.

## Step 5 - Text and i18n

Every user-facing string goes through `t()` from `react-i18next`. Add the key to **all four** locales
(`de`, `fr`, `it`, `en`):
- a component in `src/shared` → both `src/app/src/i18n/locales/*.json` **and** `src/web/src/i18n/locales/*.json` (8 files)
- app or web only → that app's 4 files

German is the source language. Write real translations, not copies of the German text.

## Figma

- File `21rVZr7QOMnS6jsNZexKa9` (Pro plan, read-only, no Code Connect). The **component sheet is node
  `877:134`**. The screen index, component mapping, token rules and the MCP workflow are in
  [docs/figma.md](../../../docs/figma.md). Follow it, and always scope `get_metadata` to one frame.
- If the Figma MCP is not authorized, say so and work from the code inventory. Never guess a design.
- A Figma frame that seems to need a new component often turns out to be an existing one with other content.
  Check the component table in docs/figma.md before you decide.

## Verify

- Type-check the package you touched (for example `cd src/shared && npx tsc --noEmit`) and run `pnpm lint`.
- In web: `pnpm test`. Component tests live next to the component (`*.test.tsx`), and shared components
  are tested from web (`src/web/src/components/ui/*/…test.tsx`, `src/web/src/test/shared/`).
- Check the layout at 320px width and on desktop.
