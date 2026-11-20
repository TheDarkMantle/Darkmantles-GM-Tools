# Darkmantle's Codex

A suite of Game Master tools for [Foundry VTT](https://foundryvtt.com/) (v13–v14). Built first for **D&D 5e**, with growing multi-system support (**Pathfinder 2e** and **Starfinder 2e** reference; more to come).

## Features

### GM Screen

A tabbed, resizable, pop-out–capable window for keeping reference material and your prep at your fingertips.

- **Reference tab** (static) — quick-reference that adapts to your **game system**:
  - **D&D 5e** — every condition (Blinded → Unconscious), travel pace, jumping/movement, combat actions (+ the 2024 Study table), and light sources. Everything follows your world's **D&D 5e Rules Version** setting automatically: **2014 (legacy)** or **2024 (modern)** wording, actions, travel pace effects, and light sources. The tab shows which ruleset it's using next to the filter box.
  - **Pathfinder 2e / Starfinder 2e** — conditions read straight from your installed system (always accurate), plus travel-speed and lighting tables.
  - **Other systems** — conditions are still listed from your system's own status effects.
  - A filter box to quickly find any entry.
- **Custom tabs** — add your own tabs (rename or resize them any time via the tab's edit button), each split into a grid of up to 4×4 sections. Drag any document into a section:
  - **Actors** (PCs & monsters) render as a **compact stat card**: portrait, class & level (PCs) or type & CR (monsters), HP, AC, passive Perception & Insight up top, active **conditions and status effects**, then ability scores, speeds, and senses. PCs show their full skill list; monsters show their **attacks** (to-hit, damage, reach/range) and **special abilities** instead. Each card links to the full sheet and refreshes live as HP and conditions change.
  - **Spells, feats, and items** render as rich embeds.
  - **Journal entries & pages** render inline. A section's **⋯ menu** can **Show to Players** (Foundry's own share dialog) and, for multi-page journals, **collapse all pages**.
  - **Roll tables** show the table with a **Roll** button; the result appears in the section and is posted to chat.
  - Anything else drops in as a content link.
- **Drakkenheim tab** — appears once you've used **Add Drakkenheim Reference** (see below): travel to the city, moving through the streets, finding delerium, searching the ruins, the Haze, and the Drakkenheim conditions.
- **Toggle button** — above the players list, beside the scene selector, or in the scene controls toolbar (your choice in settings). Falls back to a floating button if the anchor isn't found.

### Glossary hover tips

Central, reusable hover reminders for names and terms — write a tip once, and it appears everywhere the term does.

- **Auto-matching** — any glossary term (or alias) appearing in a journal page or GM Screen section is subtly underlined; hovering shows your reminder (e.g. hover "Kalindra" → *"The blacksmith in Thornreach"*). No markup needed, works retroactively in existing journals.
- **Two descriptions per entry** — a **GM description** only you see, and an optional **player description** shown to players instead ("Secretly the cult leader" for you, "Local blacksmith" for them). Tick **Use DM description for players** to show players the same text you see. Leave the player description empty and players see nothing at all — not even the underline.
- **One place to edit** — the **Glossary Manager** (button in the journal sidebar or the GM Screen tab bar): searchable list, add/edit/delete. Editing a tip updates every open journal instantly.
- **Folders** — organize entries into nestable folders (like compendium-pack sorting). Each entry picks its folder in the editor; create folders and subfolders, rename or delete them (deleting a folder moves its contents up to the parent — nothing is lost).
- **Link to full details** — optionally drag a journal entry, journal page, or actor onto an entry; the highlighted term becomes clickable and opens that full write-up or statblock. Click-through respects Foundry permissions.
- **Import / Export** — back up or share your glossary as a JSON file. Import merges by term (adds new, updates existing), creating any referenced folders.
- **Move by drag-and-drop** — drag an entry row onto a folder (or Uncategorized) to refile it.
- **Condition libraries (module settings)** — the Codex's settings have **Add Default Status Conditions** (seeds a player-visible Rules folder with your game system's conditions, each linked to its rules, plus empty NPCs/Places folders). In D&D 5e the wording and rule links match the world's 2014 or 2024 setting; if you switch rulesets later, the Codex reminds you on load to run it again so the tips update. If a Drakkenheim module (**Monsters of Drakkenheim** or the Drakkenheim core module) is enabled in your world, an **Add Drakkenheim Reference** button also appears: it adds the Drakkenheim conditions to your glossary and fills the **Drakkenheim tab** on the GM Screen. Everything is read from the modules you own at runtime, so nothing paid ships with the Codex. Both buttons merge (no duplicates); re-running updates entries with the same name.
- **Explicit syntax** — type `@tip[term]` in any journal editor to force a tip where auto-matching can't reach.
- **Suggest Glossary Entries (optional, GM-only)** — enable it in settings and likely names of people, places, and organizations that *aren't* in your glossary yet get a subtle amber dashed underline in journals and GM Screen sections. Click one to create its entry on the spot (pre-linked to a matching actor or journal), or dismiss it permanently. Heuristic-based: it skips headings, links, stat-block jargon, and sentence-starting words unless the name also appears mid-sentence. Players never see these highlights.

### Session Notes

A persistent GM notepad, turned on with the **Enable Session Notes Tab** setting.

- **Notes tab** — your notes render like a journal entry (headings, links, formatting). Hit **Edit** for the full rich-text editor when you want to reorganize, or **Save to Journal** to spin the notes off into a new journal entry.
- **Quick-add bar** — a chat-style field at the bottom of the tab (optionally shown on *every* tab via a setting). Type a note and press **Ctrl+Enter** (**Cmd+Enter** on Mac) or click the **send** button to append it; plain **Enter** starts a new line, so multi-line notes and lists work. A toggle beside the field reveals the **full formatting toolbar** (headings, lists, colors, links, and more) above the input when you want a note with more than plain text.

## Installation

1. In Foundry's **Setup** screen, go to **Add-on Modules**.
2. Click **Install Module**.
3. Paste this manifest URL into the **Manifest URL** field at the bottom of the dialog:

   ```
   https://raw.githubusercontent.com/TheDarkMantle/Darkmantles-GM-Tools/main/module.json
   ```

4. Click **Install**. Foundry will show **Darkmantle's Codex** in the install list.
5. Open your world, go to **Game Settings → Manage Modules**, check the box next to **Darkmantle's Codex**, and **Save Module Settings**.


## GM data storage and upgrades

GM glossary descriptions, folder names, and session notes are stored in a world
compendium named **Darkmantle's Codex — GM Data**, restricted to GMs. Keep this
pack private and include it in world backups. Only entries with a player
description are published to the player-facing glossary.

On the first GM login after upgrading, the module copies existing glossary and
notes settings into the private pack before clearing the old private text from
settings (including the former `gm-tools` namespace). If migration fails, the
original settings are retained. Once migrated, older module versions cannot read
the private store; use a world backup if rolling back.

## Development checks

Run `node --test tests/regression.test.mjs` for the storage migration, folder
import/export, escaping, condition selection, draft retention, and sharing checks.
These use mocked Foundry APIs; multiplayer permissions and UI behavior also need
verification in Foundry v14.

## Settings

| Setting | Scope | Description |
| --- | --- | --- |
| GM Screen Button Location | Per-client | Where the toggle button appears (above the players list / beside the scene selector / with the scene controls). |
| Enable Glossary Hover Tips | Per-client | Personal on/off switch for the glossary. When off, glossary buttons are hidden and hover tips stop appearing — just for you. |
| Suggest Glossary Entries | Per-client | GM-only amber underlines on likely names that aren't in the glossary yet. Off by default. |
| Enable Session Notes Tab | Per-client | Adds the Session Notes tab to the GM Screen. Off by default. |
| Always-visible Note Bar | Per-client | Shows the quick-add bar on every GM Screen tab, not just Session Notes. Off by default. |
| Add Default Status Conditions | Button (GM) | Adds your system's conditions and starter folders to the glossary. |
| Add Drakkenheim Reference | Button (GM) | Only appears when a Drakkenheim module is enabled. Adds its conditions and fills the Drakkenheim tab. |

## Compatibility

- **Foundry VTT:** v13 minimum, verified on v14.364.
- **System:** D&D 5e (actor stat cards use dnd5e data paths; other document types are system-agnostic).

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
