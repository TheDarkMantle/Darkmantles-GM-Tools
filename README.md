# Darkmantle's GM Tools

A suite of Game Master tools for [Foundry VTT](https://foundryvtt.com/) (v13–v14), built for the D&D 5e system.

## Features

### GM Screen

A tabbed, resizable, pop-out–capable window for keeping reference material and your prep at your fingertips.

- **Reference tab** (static) — quick-reference cards for:
  - **Conditions** — every D&D condition (Blinded → Unconscious), with rules text for either the **2014** or **2024** ruleset, selectable in module settings.
  - **Travel pace** — distance per minute / hour / day at fast, normal, and slow pace, plus forced-march and terrain notes.
  - **Light sources** — bright/dim radii and duration for candles, torches, lanterns, and light spells.
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
- **Condition libraries (module settings)** — GM Tools' settings have **Add Default Status Conditions** (seeds a Rules folder with the core conditions, plus empty NPCs/Places folders). If you own **Monsters of Drakkenheim**, an **Add Drakkenheim Conditions** button also appears and imports that module's conditions — read from the module you own at runtime, so nothing paid ships with GM Tools and the button is hidden if the module isn't installed. Both merge idempotently (no duplicates).
- **Explicit syntax** — type `@tip[term]` in any journal editor to force a tip where auto-matching can't reach.

## Installation

In Foundry, go to **Add-on Modules → Install Module** and paste this manifest URL:

```
https://raw.githubusercontent.com/TheDarkMantle/Darkmantles-GM-Tools/main/module.json
```

Then enable **GM Tools** in your world's **Manage Modules**.

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
