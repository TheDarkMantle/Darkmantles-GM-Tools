import { MODULE_ID, TEMPLATES } from "./constants.mjs";
import { GMScreenApp } from "./apps/gm-screen.mjs";
import { GlossaryManagerApp } from "./apps/glossary-manager.mjs";
import { GlossaryDefaultsMenu, GlossaryDrakkenheimMenu } from "./apps/glossary-import-menu.mjs";
import { applyGlossary, rebuildMatcher, registerEnricher, refreshJournalWindows, isGlossaryEnabled, hasDrakkenheimModule } from "./glossary.mjs";

const BUTTON_LOCATIONS = ["players", "nav", "controls"];

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "buttonLocation", {
    name: "GMTOOLS.Settings.ButtonLocation.Name",
    hint: "GMTOOLS.Settings.ButtonLocation.Hint",
    scope: "client",
    config: true,
    type: String,
    default: "players",
    choices: {
      players: "GMTOOLS.Settings.ButtonLocation.Players",
      nav: "GMTOOLS.Settings.ButtonLocation.Nav",
      controls: "GMTOOLS.Settings.ButtonLocation.Controls"
    },
    onChange: () => injectButton()
  });

  game.settings.register(MODULE_ID, "rulesVersion", {
    name: "GMTOOLS.Settings.RulesVersion.Name",
    hint: "GMTOOLS.Settings.RulesVersion.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "2024",
    choices: {
      2024: "GMTOOLS.Settings.RulesVersion.2024",
      2014: "GMTOOLS.Settings.RulesVersion.2014"
    },
    onChange: () => {
      if (GMScreenApp.instance?.rendered) GMScreenApp.instance.render();
    }
  });

  game.settings.register(MODULE_ID, "screenData", {
    scope: "world",
    config: false,
    type: Object,
    default: { tabs: [] }
  });

  // Imported Drakkenheim conditions for the Reference tab: [{ name, text }].
  // Populated by the "Add Drakkenheim Conditions" settings button.
  game.settings.register(MODULE_ID, "drakkenheimConditions", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
    onChange: () => {
      if (GMScreenApp.instance?.rendered) GMScreenApp.instance.render();
    }
  });

  game.settings.register(MODULE_ID, "glossary", {
    scope: "world",
    config: false,
    type: Object,
    default: { entries: [] },
    onChange: () => {
      if (!game.ready) return;
      rebuildMatcher();
      refreshJournalWindows();
      if (GMScreenApp.instance?.rendered) GMScreenApp.instance.render();
    }
  });

  // GM-only button: seed the glossary with the default status conditions.
  game.settings.registerMenu(MODULE_ID, "loadConditions", {
    name: "GMTOOLS.Settings.LoadConditions.Name",
    label: "GMTOOLS.Settings.LoadConditions.Label",
    hint: "GMTOOLS.Settings.LoadConditions.Hint",
    icon: "fa-solid fa-notes-medical",
    type: GlossaryDefaultsMenu,
    restricted: true
  });

  // GM-only button to import the paid module's conditions — only shown when that
  // module is installed, so nothing is exposed to users who don't own it.
  if (hasDrakkenheimModule()) {
    game.settings.registerMenu(MODULE_ID, "loadDrakkenheim", {
      name: "GMTOOLS.Settings.LoadDrakkenheim.Name",
      label: "GMTOOLS.Settings.LoadDrakkenheim.Label",
      hint: "GMTOOLS.Settings.LoadDrakkenheim.Hint",
      icon: "fa-solid fa-skull",
      type: GlossaryDrakkenheimMenu,
      restricted: true
    });
  }

  // Per-user opt-out: hides all glossary buttons and stops tooltips from loading.
  game.settings.register(MODULE_ID, "glossaryEnabled", {
    name: "GMTOOLS.Settings.GlossaryEnabled.Name",
    hint: "GMTOOLS.Settings.GlossaryEnabled.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: enabled => {
      if (!game.ready) return;
      if (!enabled && GlossaryManagerApp.instance?.rendered) GlossaryManagerApp.instance.close();
      ui.journal?.render();                                    // add/remove the sidebar button
      refreshJournalWindows();                                 // apply or strip tips in open journals
      if (GMScreenApp.instance?.rendered) GMScreenApp.instance.render(); // tab-bar button + section tips
    }
  });

  registerEnricher();

  foundry.applications.handlebars.loadTemplates([TEMPLATES.reference, TEMPLATES.actorCard]);
});

Hooks.once("ready", () => {
  rebuildMatcher();
  injectButton();

  // One delegated handler for every clickable glossary tip (journals, GM Screen, chat).
  document.addEventListener("click", async event => {
    const link = event.target.closest?.(".gm-tools-tip-link[data-uuid]");
    if (!link) return;
    event.preventDefault();
    const doc = await fromUuid(link.dataset.uuid);
    if (doc?.sheet) doc.sheet.render(true);
    else ui.notifications.warn(game.i18n.localize("GMTOOLS.Glossary.LinkMissing"));
  });
});

// Auto-match glossary terms in rendered journal pages (fires for every page
// sheet subclass — core text/ProseMirror sheets, dnd5e, importer sheets, etc.)
Hooks.on("renderJournalEntryPageSheet", (app, element) => {
  if (game.ready) applyGlossary(element);
});

// GM-only "Glossary" button in the journal sidebar header
Hooks.on("renderJournalDirectory", (app, element) => {
  if (!game.user?.isGM || !isGlossaryEnabled()) return;
  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root || root.querySelector(".gm-glossary-directory-button")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "gm-glossary-directory-button";
  btn.innerHTML = `<i class="fa-solid fa-tags"></i> ${game.i18n.localize("GMTOOLS.Glossary.Title")}`;
  btn.addEventListener("click", () => GlossaryManagerApp.open());
  const header = root.querySelector(".header-actions, .directory-header");
  if (header) header.append(btn);
  else root.prepend(btn);
});

// Core UI apps re-render on various triggers and replace their DOM; re-inject our button.
for (const hook of ["renderPlayers", "renderSceneNavigation", "renderSceneControls"]) {
  Hooks.on(hook, () => {
    if (game.ready) injectButton();
  });
}

// Keep an open GM Screen current: HP and conditions on actor cards change often.
const refreshScreen = foundry.utils.debounce(() => {
  if (GMScreenApp.instance?.rendered) GMScreenApp.instance.render();
}, 250);
for (const hook of ["updateActor", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(hook, refreshScreen);
}

/**
 * Anchor candidates per configured location. The first selector present in the
 * DOM wins; if none match (core UI drift between versions), a floating button
 * pinned to the matching screen corner is used instead.
 *
 * The button is always inserted as a SIBLING of the core faded-ui panels
 * (#players, #scene-navigation), never inside them: hovering a child of a
 * faded-ui panel triggers that panel's expand-on-hover.
 */
const ANCHORS = {
  players: [
    { selector: "#players", how: "before" },
    { selector: "#ui-left-column-1", how: "append" }
  ],
  nav: [
    { selector: "#ui-left-column-2", how: "after" },
    { selector: "#scene-navigation", how: "before" },
    { selector: "#navigation", how: "before" }
  ],
  controls: [] // handled by injectToolbarButton()
};

function injectButton() {
  if (!game.user?.isGM) return;
  document.querySelector(".gm-tools-float")?.remove();
  document.querySelector(".gm-tools-toolbar-item")?.remove();
  document.getElementById("gm-tools-toggle")?.remove();

  // Sanitize stored values from removed options (e.g. the old "chat" location)
  let location = game.settings.get(MODULE_ID, "buttonLocation");
  if (!BUTTON_LOCATIONS.includes(location)) location = "players";

  if (location === "controls" && injectToolbarButton()) return;

  const label = game.i18n.localize("GMTOOLS.Screen.Title");
  const btn = document.createElement("button");
  btn.id = "gm-tools-toggle";
  btn.type = "button";
  btn.className = `gm-tools-toggle gm-tools-toggle-${location} faded-ui`;
  btn.innerHTML = `<i class="fa-solid fa-book-open-reader"></i><span class="gm-tools-toggle-label">${label}</span>`;
  btn.dataset.tooltip = label;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => GMScreenApp.toggle());

  for (const { selector, how } of ANCHORS[location] ?? []) {
    const el = document.querySelector(selector);
    if (!el) continue;
    if (how === "before") el.before(btn);
    else if (how === "after") el.after(btn);
    else if (how === "prepend") el.prepend(btn);
    else el.append(btn);
    return;
  }

  const float = document.createElement("div");
  float.className = `gm-tools-float gm-tools-float-${location}`;
  float.append(btn);
  document.body.append(float);
}

/**
 * "With controls": a toolbar entry in the scene controls, below Journal Notes.
 * Matches core toolbar button markup (icon classes on the button, inside <li>).
 * Deliberately no data-action="control"/data-control: this opens our app, it
 * does not activate a canvas layer.
 */
function injectToolbarButton() {
  const label = game.i18n.localize("GMTOOLS.Screen.Title");
  const notes = document.querySelector('#scene-controls-layers button[data-control="notes"]');
  const menu = document.getElementById("scene-controls-layers");
  const anchor = notes?.closest("li");
  if (!anchor && !menu) return false;

  const btn = document.createElement("button");
  btn.id = "gm-tools-toggle";
  btn.type = "button";
  btn.className = "control ui-control icon fa-solid fa-book-open-reader gm-tools-toggle gm-tools-toggle-controls";
  btn.dataset.tooltip = label;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => GMScreenApp.toggle());

  const li = document.createElement("li");
  li.className = "gm-tools-toolbar-item";
  li.append(btn);
  if (anchor) anchor.after(li);
  else menu.append(li);
  return true;
}
