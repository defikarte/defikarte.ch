@AGENTS.md

## Claude Code specifics

- Use the project skills via the Skill tool, before you write code:
  - `defikarte-ui` for any UI work (screens, components, styling, icons, i18n, Figma links)
  - `defikarte-maplibre` for any map work (layers, sources, overlays, filters, requests, performance)
  - Use both when a change spans UI and map.
- Read-only Figma MCP tools are allowlisted in `.claude/settings.json`. Write tools stay behind a prompt on purpose.
