# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot, …) working in this repository.

defikarte.ch is a map of ~15'000 defibrillators (AEDs) in Switzerland and Liechtenstein. People use it in
emergencies, so **speed and clarity beat features**. Keep changes small and reuse what exists.

## Repository layout

| Path | What |
|---|---|
| `src/shared` | `@defikarte/shared`: map (MapLibre), UI primitives, services, models used by both apps |
| `src/app` | React + Vite app packaged as iOS/Android app with Capacitor |
| `src/web` | React + Vite website (defikarte.ch), also hosts the tests for shared code |
| `docs/figma.md` | Figma file, screen index, component mapping, token rules |
| `src/SHARED_CODE_GUIDE.md` | How the pnpm workspace links `shared` into app and web |

## Skills: read before you change code

Project skills live in [.claude/skills/](.claude/skills/). Claude Code loads them automatically. **Other
agents: open the matching `SKILL.md` and follow it before you write code.**

| Task touches… | Skill |
|---|---|
| Anything visible: screens, sections, buttons, forms, cards, dialogs, menus, icons, colours, Tailwind classes, i18n texts, Figma links | [.claude/skills/defikarte-ui/SKILL.md](.claude/skills/defikarte-ui/SKILL.md) (component inventory: `references/components.md`) |
| The map: layers, sources, markers, clusters, overlays, filters, opening-hours status, selection/highlight, base layers, GPS location, AED data / requests, map performance | [.claude/skills/defikarte-maplibre/SKILL.md](.claude/skills/defikarte-maplibre/SKILL.md) (architecture: `references/architecture.md`) |

Many tasks need both. A new map filter, for example, needs a UI toggle and a map change. In that case read both.

## Ground rules

- **Do not invent UI components.** Use the existing primitives (`Button`, `IconButton`, `MapIconButton`,
  `Tag`, `TextField`, `SelectField`, `Tooltip`, web `Text`/`ContentWrapper`/`Accordion`, app
  `SettingsPage`/`SettingsOption`). If something new seems needed, first explain: can existing components
  do it, what is best practice, and what is the simplest user-friendly version? (see the UI skill).
- **No new network requests for data the map already has.** The AEDs are loaded once and are available in
  memory (`OpeningHoursController.getAllAeds()`, `MapInstance.getGeoJsonSourceData()`).
- **Smallest diff wins.** Extend the existing overlay, layer or component. Don't refactor neighbouring code
  unless asked. Mention issues instead.
- **Colours only via Tailwind theme tokens** (`bg-primary-100-green-04`, …), never raw hex. The token block
  exists in both `src/app/src/app/styles/index.css` and `src/web/src/index.css`.
- **All texts through i18n** in `de`, `fr`, `it`, `en`. A string used by `src/shared` needs the key in both the app
  and web locale files (8 files).
- Code shared by app and web goes in `src/shared` and is exported from `src/shared/src/index.ts` only if needed.

## Commands

```bash
cd src/app && pnpm install && pnpm dev      # app (Vite)
cd src/web && pnpm install && pnpm dev      # website
cd src/shared && npx tsc --noEmit           # type-check shared
cd src/web && pnpm test                     # vitest (incl. src/web/src/test/shared/)
pnpm lint                                   # in app or web
```

Node 24, pnpm 10. Both apps read a local `.env` (copy `.env.template`).

## Figma

File `21rVZr7QOMnS6jsNZexKa9` (component sheet: node `877:134`). The Figma file is a read-only source. Follow
[docs/figma.md](docs/figma.md) and scope MCP calls to single frames.
