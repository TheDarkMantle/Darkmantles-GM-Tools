import { MODULE_ID, TEMPLATES } from "../constants.mjs";
import { getEntries, saveEntries } from "../glossary.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

/**
 * GM-only editor for the central glossary: term + aliases, a GM description,
 * and an optional player-facing description.
 */
export class GlossaryManagerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static instance = null;

  static open() {
    this.instance ??= new this();
    this.instance.render(true);
  }

  static DEFAULT_OPTIONS = {
    id: "gm-tools-glossary",
    classes: ["gm-tools", "gm-glossary"],
    window: {
      title: "GMTOOLS.Glossary.Title",
      icon: "fa-solid fa-tags",
      resizable: true
    },
    position: { width: 520, height: 600 },
    actions: {
      addEntry: GlossaryManagerApp.#onAddEntry,
      editEntry: GlossaryManagerApp.#onEditEntry,
      deleteEntry: GlossaryManagerApp.#onDeleteEntry
    }
  };

  static PARTS = {
    body: { template: TEMPLATES.glossaryManager }
  };

  async _prepareContext() {
    const entries = getEntries()
      .map(e => ({
        id: e.id,
        term: e.term,
        aliases: (e.aliases ?? []).join(", "),
        gmTip: e.gmTip ?? "",
        playerTip: e.playerTip ?? "",
        hasPlayerTip: !!e.playerTip
      }))
      .sort((a, b) => a.term.localeCompare(b.term));
    return { entries, empty: !entries.length };
  }

  _onRender() {
    const filter = this.element.querySelector(".gm-glossary-filter");
    filter?.addEventListener("input", ev => {
      const q = ev.currentTarget.value.toLowerCase();
      for (const row of this.element.querySelectorAll(".gm-glossary-row")) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
      }
    });
  }

  async #save(entries) {
    await saveEntries(entries);
    this.render();
  }

  static async #onAddEntry() {
    const data = await this.#entryDialog();
    if (!data) return;
    const entries = getEntries();
    entries.push({ id: foundry.utils.randomID(8), ...data });
    await this.#save(entries);
  }

  static async #onEditEntry(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    const entries = getEntries();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const data = await this.#entryDialog(entry);
    if (!data) return;
    Object.assign(entry, data);
    await this.#save(entries);
  }

  static async #onDeleteEntry(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    const entries = getEntries();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("GMTOOLS.Glossary.DeleteEntry") },
      content: `<p>${game.i18n.format("GMTOOLS.Glossary.DeleteConfirm", { term: esc(entry.term) })}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!confirmed) return;
    await this.#save(entries.filter(e => e.id !== id));
  }

  async #entryDialog(initial = null) {
    const i18n = key => game.i18n.localize(`GMTOOLS.Glossary.${key}`);
    const content = `
      <div class="form-group">
        <label>${i18n("Term")}</label>
        <input type="text" name="term" value="${esc(initial?.term ?? "")}" required>
      </div>
      <div class="form-group">
        <label>${i18n("Aliases")}</label>
        <input type="text" name="aliases" value="${esc((initial?.aliases ?? []).join(", "))}"
               placeholder="${i18n("AliasesHint")}">
      </div>
      <div class="form-group stacked">
        <label>${i18n("GMTip")}</label>
        <textarea name="gmTip" rows="3">${esc(initial?.gmTip ?? "")}</textarea>
      </div>
      <div class="form-group stacked">
        <label>${i18n("PlayerTip")}</label>
        <textarea name="playerTip" rows="3" placeholder="${i18n("PlayerTipHint")}">${esc(initial?.playerTip ?? "")}</textarea>
      </div>`;

    const result = await DialogV2.prompt({
      classes: ["gm-tools-entry-dialog"],
      window: {
        title: game.i18n.localize(initial ? "GMTOOLS.Glossary.EditEntry" : "GMTOOLS.Glossary.AddEntry"),
        icon: "fa-solid fa-tags"
      },
      content,
      rejectClose: false,
      modal: true,
      ok: {
        label: initial ? "GMTOOLS.Save" : "GMTOOLS.Create",
        icon: "fa-solid fa-check",
        callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
      }
    });
    if (!result) return null;

    const term = String(result.term ?? "").trim();
    if (!term) return null;
    return {
      term,
      aliases: String(result.aliases ?? "")
        .split(",")
        .map(a => a.trim())
        .filter(Boolean),
      gmTip: String(result.gmTip ?? "").trim(),
      playerTip: String(result.playerTip ?? "").trim()
    };
  }
}
