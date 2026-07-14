# Darkmantle's Codex

*Formerly "GM Tools" — renamed for its public release. Existing world data (glossary, session notes, screen layouts) migrates automatically on first load.*

A suite of Game Master tools for [Foundry VTT](https://foundryvtt.com/) (v13–v14). Built first for **D&D 5e**, with growing multi-system support (**Pathfinder 2e** and **Starfinder 2e** reference; more to come).

## Features

### GM Screen

A tabbed, resizable, pop-out–capable window for keeping reference material and your prep at your fingertips.

- **Reference tab** (static) — quick-reference that adapts to your **game system**:
  - **D&D 5e** — every condition (Blinded → Unconscious) with **2014** or **2024** rules text (selectable in settings), travel pace, jumping/movement, combat actions (+ the 2024 Study table), and light sources.
  - **Pathfinder 2e / Starfinder 2e** — conditions read straight from your installed system (always accurate), plus travel-speed and lighting tables.
  - **Other systems** — conditions are still listed from your system's own status effects.
  - A filter box to quickly find any entry.
- **Custom tabs** — add your own tabs (rename or resize them any time via the tab's edit button), each split into a grid of up to 4×4 sections. Drag any document into a section:
  - **Actors** (PCs & monsters) render as a **compact stat card**: portrait, HP, AC, passive Perception & Insight up top, active **conditions and status effects**, then ability scores, speeds, senses, and the full skill list — with a link to the full sheet. Cards refresh live as HP and conditions change.
  - **Spells, feats, and items** render as rich embeds.
  - **Journal entries & pages** render inline.
  - Anything else drops in as a content link.
- **Toggle button** — above the players list, beside the scene selector, or in the scene controls toolbar (your choice in settings). Falls back to a floating button if the anchor isn't found.

### Glossary hover tips

Central, reusable hover reminders for names and terms — write a tip once, and it appears everywhere the term does.

- **Auto-matching** — any glossary term (or alias) appearing in a journal page or GM Screen section is subtly underlined; hovering shows your reminder (e.g. hover "Kalindra" → *"The blacksmith in Thornreach"*). No markup needed, works retroactively in existing journals.
- **Two descriptions per entry** — a **GM description** only you see, and an optional **player description** shown to players instead ("Secretly the cult leader" for you, "Local blacksmith" for them). Leave the player description empty and players see nothing at all — not even the underline.
- **One place to edit** — the **Glossary Manager** (button in the journal sidebar or the GM Screen tab bar): searchable list, add/edit/delete. Editing a tip updates every open journal instantly.
- **Folders** — organize entries into nestable folders (like compendium-pack sorting). Each entry picks its folder in the editor; create folders and subfolders, rename or delete them (deleting a folder moves its contents up to the parent — nothing is lost).
- **Link to full details** — optionally drag a journal entry or actor onto an entry; the highlighted term becomes clickable and opens that full write-up or statblock. Click-through respects Foundry permissions.
- **Import / Export** — back up or share your glossary as a JSON file. Import merges by term (adds new, updates existing), creating any referenced folders.
- **Move by drag-and-drop** — drag an entry row onto a folder (or Uncategorized) to refile it.
- **Condition libraries (module settings)** — the Codex's settings have **Add Default Status Conditions** (seeds a Rules folder with your game system's conditions, plus empty NPCs/Places folders). If you own **Monsters of Drakkenheim**, an **Add Drakkenheim Conditions** button also appears and imports that module's conditions — read from the module you own at runtime, so nothing paid ships with the Codex and the button is hidden if the module isn't installed. Both merge idempotently (no duplicates).
- **Explicit syntax** — type `@tip[term]` in any journal editor to force a tip where auto-matching can't reach.
- **Suggest Glossary Entries (optional, GM-only)** — enable it in settings and likely names of people, places, and organizations that *aren't* in your glossary yet get a subtle amber dashed underline in journals and GM Screen sections. Click one to create its entry on the spot (pre-linked to a matching actor or journal), or dismiss it permanently. Heuristic-based: it skips headings, links, stat-block jargon, and sentence-starting words unless the name also appears mid-sentence. Players never see these highlights.

### Session Notes

A persistent GM notepad, enabled in module settings.

- **Notes tab** — your notes render like a journal entry (headings, links, formatting). Hit **Edit** for the full rich-text editor when you want to reorganize, or **Save to Journal** to spin the notes off into a new journal entry.
- **Quick-add bar** — a chat-style field at the bottom of the tab (optionally shown on *every* tab via a setting). Type a note and press **Enter** to append it; **Shift+Enter** adds a line. A toggle beside the field reveals the **full formatting toolbar** (headings, lists, colors, links, and more) above the input when you want a note with more than plain text.

## Installation

1. In Foundry's **Setup** screen, go to **Add-on Modules**.
2. Click **Install Module**.
3. Paste this manifest URL into the **Manifest URL** field at the bottom of the dialog:

   ```
   https://raw.githubusercontent.com/TheDarkMantle/Darkmantles-GM-Tools/main/module.json
   ```

4. Click **Install**. Foundry will show **Darkmantle's Codex** in the install list.
5. Open your world, go to **Game Settings → Manage Modules**, check the box next to **Darkmantle's Codex**, and **Save Module Settings**.

**Upgrading from "GM Tools" (≤ 0.13.x)?** The module id changed as part of this rename, so Foundry treats it as a new module — installing the manifest above adds Darkmantle's Codex *alongside* your existing GM Tools rather than updating it in place.

1. Install Darkmantle's Codex using the steps above (same manifest URL you've always used).
2. In each world, open **Manage Modules**: check **Darkmantle's Codex** and **uncheck GM Tools** (don't run both at once — you'll get duplicated buttons and hooks).
3. Save, then reload/re-enter the world as GM. Your glossary, session notes, screen layouts, and settings are copied over automatically on that first load, with a confirmation notice.
4. Once you've confirmed everything carried over, you can disable and uninstall the old **GM Tools** module — your data is safely under the new module now.

## Settings

| Setting | Scope | Description |
| --- | --- | --- |
| GM Screen Button Location | Per-client | Where the toggle button appears (above the players list / beside the scene selector / with the scene controls). |
| D&D Rules Version | Per-world | Whether the Reference tab shows 2014 or 2024 rules text. |
| Enable Glossary Hover Tips | Per-client | Personal on/off switch for the glossary. When off, glossary buttons are hidden and hover tips stop appearing — just for you. |

## Compatibility

- **Foundry VTT:** v13 minimum, verified on v14.364.
- **System:** D&D 5e (actor stat cards use dnd5e data paths; other document types are system-agnostic).

## License

See repository.
