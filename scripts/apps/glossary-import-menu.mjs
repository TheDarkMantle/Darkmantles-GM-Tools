import { MODULE_ID } from "../constants.mjs";
import { loadDefaultConditions, loadDrakkenheimContent, refreshGlossaryManager } from "../glossary.mjs";

const { ApplicationV2, DialogV2 } = foundry.applications.api;

/**
 * Base for settings-menu action buttons. Foundry opens a settings menu by
 * constructing its `type` and calling `render(true)`; we override `render` to
 * show a confirmation dialog and run the subclass's loader, rather than opening
 * a window of our own.
 */
class GlossaryImportMenu extends ApplicationV2 {
  static titleKey = "";
  static confirmKey = "";
  static resultKey = "GMTOOLS.Glossary.ImportResult";
  static async loader() {}

  async render() {
    const cls = this.constructor;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize(cls.titleKey), icon: "fa-solid fa-notes-medical" },
      content: `<p>${game.i18n.localize(cls.confirmKey)}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!confirmed) return this;

    try {
      const res = await cls.loader();
      ui.notifications.info(game.i18n.format(cls.resultKey, res));
      refreshGlossaryManager();
    } catch (err) {
      console.error(`${MODULE_ID} | Glossary import menu failed`, err);
      ui.notifications.error(err?.message || game.i18n.localize("GMTOOLS.Glossary.ImportError"));
    }
    return this;
  }
}

export class GlossaryDefaultsMenu extends GlossaryImportMenu {
  static DEFAULT_OPTIONS = { id: "gm-tools-load-defaults", window: { title: "GMTOOLS.Settings.LoadConditions.Name" } };
  static titleKey = "GMTOOLS.Settings.LoadConditions.Name";
  static confirmKey = "GMTOOLS.Settings.LoadConditions.Confirm";
  static loader = () => loadDefaultConditions("merge");
}

export class GlossaryDrakkenheimMenu extends GlossaryImportMenu {
  static DEFAULT_OPTIONS = { id: "gm-tools-load-drakkenheim", window: { title: "GMTOOLS.Settings.LoadDrakkenheim.Name" } };
  static titleKey = "GMTOOLS.Settings.LoadDrakkenheim.Name";
  static confirmKey = "GMTOOLS.Settings.LoadDrakkenheim.Confirm";
  static resultKey = "GMTOOLS.Settings.LoadDrakkenheim.Result";
  static loader = () => loadDrakkenheimContent("merge");
}
