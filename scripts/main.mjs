import { MODULE_ID, TEMPLATES } from "./constants.mjs";
import { GMScreenApp } from "./apps/gm-screen.mjs";

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
      chat: "GMTOOLS.Settings.ButtonLocation.Chat",
      nav: "GMTOOLS.Settings.ButtonLocation.Nav"
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

  foundry.applications.handlebars.loadTemplates([TEMPLATES.reference, TEMPLATES.actorCard]);
});

Hooks.once("ready", () => injectButton());

// Core UI apps re-render on various triggers and replace their DOM; re-inject our button.
for (const hook of ["renderPlayers", "renderSceneNavigation", "renderChatLog"]) {
  Hooks.on(hook, () => {
    if (game.ready) injectButton();
  });
}

/**
 * Anchor candidates per configured location. The first selector present in the
 * DOM wins; if none match (core UI drift between versions), a floating button
 * pinned to the matching screen corner is used instead.
 *
 * The button is always inserted as a SIBLING of the core faded-ui panels
 * (#players, #scene-navigation, #chat-notifications), never inside them:
 * hovering a child of a faded-ui panel triggers that panel's expand-on-hover.
 */
const ANCHORS = {
  players: [
    { selector: "#players", how: "before" },
    { selector: "#ui-left-column-1", how: "append" }
  ],
  nav: [
    { selector: "#scene-navigation", how: "before" },
    { selector: "#navigation", how: "before" },
    { selector: "#ui-left-column-2", how: "prepend" }
  ],
  chat: [
    { selector: "#chat-notifications", how: "before" },
    { selector: "#chat-message", how: "before" },
    { selector: "#ui-right-column-1", how: "append" }
  ]
};

function injectButton() {
  if (!game.user?.isGM) return;
  document.querySelector(".gm-tools-float")?.remove();
  document.getElementById("gm-tools-toggle")?.remove();

  const location = game.settings.get(MODULE_ID, "buttonLocation");
  const label = game.i18n.localize("GMTOOLS.Screen.Title");

  const btn = document.createElement("button");
  btn.id = "gm-tools-toggle";
  btn.type = "button";
  btn.className = `gm-tools-toggle gm-tools-toggle-${location} faded-ui`;
  btn.innerHTML = `<i class="fa-solid fa-book-open-reader"></i><span class="gm-tools-toggle-label">${label}</span>`;
  btn.dataset.tooltip = label;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", () => GMScreenApp.toggle());

  for (const { selector, how } of ANCHORS[location] ?? ANCHORS.players) {
    const el = document.querySelector(selector);
    if (!el) continue;
    if (how === "before") el.before(btn);
    else if (how === "prepend") el.prepend(btn);
    else el.append(btn);
    return;
  }

  const float = document.createElement("div");
  float.className = `gm-tools-float gm-tools-float-${location}`;
  float.append(btn);
  document.body.append(float);
}
