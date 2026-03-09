# dcli visual overview

The architecture blueprint for dcli lives in the self-contained HTML artifact generated via the `visual-explainer` plugin.

- **File**: `~/.agent/diagrams/dcli-visual-architecture.html`
- **Open**: `xdg-open ~/.agent/diagrams/dcli-visual-architecture.html`
- **Source**: Created with `supercli skills get visual-explainer:visual-explainer.skill` guidance.

## What the HTML covers

1. **Skill routing pipeline** – Mermaid snapshot of `cli/supercli.js`, the skills catalog, plugin harness manager, server APIs, and adapters. Includes zoom, pan, and expand controls per the visual-explainer requirements.
2. **Runtime pillars** – Card grid summarizing the CLI runtime, catalog, plugin manager, and Express backend with file references such as `cli/plugins-manager.js` and `server/app.js`.
3. **Plugin & skill lifecycle** – Timeline of registry discovery → install → catalog sync → execution, tying back to commands like `supercli skills list --catalog`.
4. **Capability matrix** – HTML table comparing bundled harnesses, built-in adapters, remote providers, and the server API, highlighting when to use commands such as `supercli sync`.
5. **Operational cues** – Details blocks that document behaviors like plan building and storage fallbacks.

## Regenerating or extending

1. Ensure the `visual-explainer` provider is installed (`supercli plugins install visual-explainer`).
2. Re-open the reference templates (`visual-explainer:visual-explainer.templates.architecture`, `...templates.data-table`, etc.) to stay within the mandated aesthetics.
3. Update the HTML under `~/.agent/diagrams/` and refresh this markdown with any new sections you add. Keep this file as the only place in the repo that references the artifact’s path.
