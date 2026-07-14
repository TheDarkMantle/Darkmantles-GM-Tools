export const MODULE_ID = "darkmantles-codex";

/** The module's pre-rename id ("GM Tools") — world data saved under this
 *  namespace is migrated to MODULE_ID on ready. */
export const LEGACY_MODULE_ID = "gm-tools";

export const TEMPLATES = {
  screen: `modules/${MODULE_ID}/templates/gm-screen.hbs`,
  reference: `modules/${MODULE_ID}/templates/reference-tab.hbs`,
  drakkenheim: `modules/${MODULE_ID}/templates/drakkenheim-tab.hbs`,
  sessionNotes: `modules/${MODULE_ID}/templates/session-notes-tab.hbs`,
  actorCard: `modules/${MODULE_ID}/templates/actor-card.hbs`,
  glossaryManager: `modules/${MODULE_ID}/templates/glossary-manager.hbs`
};
