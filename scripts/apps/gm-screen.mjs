import { MODULE_ID, TEMPLATES } from "../constants.mjs";
import { getReferenceData } from "../reference-data.mjs";
import { renderSection } from "../section-renderers.mjs";
import { applyGlossary, isGlossaryEnabled } from "../glossary.mjs";
import { GlossaryManagerApp } from "./glossary-manager.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

export class GMScreenApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** Singleton instance toggled by the UI button. */
  static instance = null;

  static toggle() {
    this.instance ??= new this();
    if (this.instance.rendered) this.instance.close();
    else this.instance.render(true);
  }

  static DEFAULT_OPTIONS = {
    id: "gm-tools-screen",
    classes: ["gm-tools", "gm-screen"],
    window: {
      title: "GMTOOLS.Screen.Title",
      icon: "fa-solid fa-book-open-reader",
      resizable: true
    },
    position: { width: 960, height: 680 },
    actions: {
      selectTab: GMScreenApp.#onSelectTab,
      addTab: GMScreenApp.#onAddTab,
      editTab: GMScreenApp.#onEditTab,
      deleteTab: GMScreenApp.#onDeleteTab,
      clearSection: GMScreenApp.#onClearSection,
      openDocument: GMScreenApp.#onOpenDocument,
      openGlossary: GMScreenApp.#onOpenGlossary
    }
  };

  static PARTS = {
    body: { template: TEMPLATES.screen }
  };

  tabGroups = { primary: "reference" };

  #getData() {
    return foundry.utils.deepClone(game.settings.get(MODULE_ID, "screenData") ?? { tabs: [] });
  }

  async #setData(data) {
    await game.settings.set(MODULE_ID, "screenData", data);
    this.render();
  }

  /* -------------------------------------------- */
  /*  Rendering                                    */
  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = this.#getData();
    data.tabs ??= [];

    // If the active tab was deleted, fall back to the reference tab
    const ids = ["reference", ...data.tabs.map(t => t.id)];
    if (!ids.includes(this.tabGroups.primary)) this.tabGroups.primary = "reference";

    const tabs = await Promise.all(data.tabs.map(async tab => {
      const cells = await Promise.all(Array.fromRange(tab.rows * tab.cols).map(async index => {
        const entry = tab.sections?.[index];
        if (!entry?.uuid) return { index, tabId: tab.id, empty: true };
        const section = await renderSection(entry.uuid);
        return { index, tabId: tab.id, empty: false, ...section };
      }));
      return { ...tab, cells, active: this.tabGroups.primary === tab.id };
    }));

    return Object.assign(context, {
      referenceActive: this.tabGroups.primary === "reference",
      reference: getReferenceData(game.settings.get(MODULE_ID, "rulesVersion")),
      tabs,
      glossaryEnabled: isGlossaryEnabled()
    });
  }

  _onRender(context, options) {
    super._onRender?.(context, options);

    const DragDropCls = CONFIG.ux?.DragDrop ?? foundry.applications.ux.DragDrop;
    new DragDropCls({
      dropSelector: ".gm-screen-cell",
      callbacks: { drop: this.#onDrop.bind(this) }
    }).bind(this.element);

    const filter = this.element.querySelector(".gm-ref-filter");
    filter?.addEventListener("input", event => this.#filterReference(event.currentTarget.value));

    // Glossary hover tips inside screen sections (not the reference tab's own tables)
    for (const content of this.element.querySelectorAll(".gm-section-content")) {
      applyGlossary(content);
    }
  }

  /**
   * Filter the reference tab. An entry matches on its own text, its section
   * heading, OR the nearest sub-heading above it — so typing "Study" reveals the
   * Study skill table even though its rows read Arcana/History/etc. Sections and
   * sub-blocks left with no visible rows are hidden so no empty headers linger.
   */
  #filterReference(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    for (const section of this.element.querySelectorAll(".gm-ref-section")) {
      const h2 = section.querySelector("h2")?.textContent.toLowerCase() ?? "";
      let sectionHasMatch = false;
      for (const entry of section.querySelectorAll(".gm-ref-entry")) {
        const hay = `${entry.textContent} ${h2} ${this.#subheadFor(entry, section)}`.toLowerCase();
        const show = !query || hay.includes(query);
        entry.style.display = show ? "" : "none";
        if (show) sectionHasMatch = true;
      }
      section.style.display = !query || sectionHasMatch ? "" : "none";
      // Hide any sub-heading (and its block) that has no visible rows left.
      for (const subhead of section.querySelectorAll(".gm-ref-subhead")) {
        const block = subhead.nextElementSibling;
        const blockHasMatch = !!block
          && [...block.querySelectorAll(".gm-ref-entry")].some(e => e.style.display !== "none");
        const show = !query || blockHasMatch;
        subhead.style.display = show ? "" : "none";
        if (block) block.style.display = show ? "" : "none";
      }
    }
  }

  /** Text of the nearest `.gm-ref-subhead` above an entry's top-level block. */
  #subheadFor(entry, section) {
    let block = entry;
    while (block.parentElement && block.parentElement !== section) block = block.parentElement;
    for (let sib = block.previousElementSibling; sib; sib = sib.previousElementSibling) {
      if (sib.classList?.contains("gm-ref-subhead")) return sib.textContent;
      if (sib.tagName === "H2") break;
    }
    return "";
  }

  /* -------------------------------------------- */
  /*  Drag & Drop                                  */
  /* -------------------------------------------- */

  async #onDrop(event) {
    const cell = event.target?.closest?.(".gm-screen-cell");
    if (!cell) return;
    const TextEditorCls = foundry.applications.ux.TextEditor.implementation ?? foundry.applications.ux.TextEditor;
    const dropData = TextEditorCls.getDragEventData(event);
    if (!dropData?.uuid) return;

    const data = this.#getData();
    const tab = data.tabs.find(t => t.id === cell.dataset.tabId);
    if (!tab) return;
    tab.sections ??= {};
    tab.sections[cell.dataset.cell] = { uuid: dropData.uuid };
    await this.#setData(data);
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  static #onSelectTab(event, target) {
    const tab = target.dataset.tab;
    if (!tab || tab === this.tabGroups.primary) return;
    this.tabGroups.primary = tab;
    for (const el of this.element.querySelectorAll(".gm-screen-tab, .gm-tab")) {
      el.classList.toggle("active", el.dataset.tab === tab);
    }
  }

  static async #onAddTab() {
    const result = await this.#tabDialog();
    if (!result) return;
    const data = this.#getData();
    const id = foundry.utils.randomID(8);
    data.tabs.push({
      id,
      name: result.name || game.i18n.localize("GMTOOLS.Screen.NewTab"),
      rows: result.rows,
      cols: result.cols,
      sections: {}
    });
    this.tabGroups.primary = id;
    await this.#setData(data);
  }

  static async #onEditTab(event, target) {
    const tabId = target.dataset.tabId;
    const data = this.#getData();
    const tab = data.tabs.find(t => t.id === tabId);
    if (!tab) return;
    const result = await this.#tabDialog(tab);
    if (!result) return;
    tab.name = result.name || tab.name;
    tab.rows = result.rows;
    tab.cols = result.cols;
    await this.#setData(data);
  }

  static async #onDeleteTab(event, target) {
    const tabId = target.dataset.tabId;
    const data = this.#getData();
    const tab = data.tabs.find(t => t.id === tabId);
    if (!tab) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("GMTOOLS.Screen.DeleteTab") },
      content: `<p>${game.i18n.format("GMTOOLS.Screen.DeleteTabConfirm", { name: tab.name })}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!confirmed) return;
    data.tabs = data.tabs.filter(t => t.id !== tabId);
    if (this.tabGroups.primary === tabId) this.tabGroups.primary = "reference";
    await this.#setData(data);
  }

  static async #onClearSection(event, target) {
    const cell = target.closest(".gm-screen-cell");
    if (!cell) return;
    const data = this.#getData();
    const tab = data.tabs.find(t => t.id === cell.dataset.tabId);
    if (!tab?.sections) return;
    delete tab.sections[cell.dataset.cell];
    await this.#setData(data);
  }

  static async #onOpenDocument(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    if (!uuid) return;
    const doc = await fromUuid(uuid);
    doc?.sheet?.render(true);
  }

  static #onOpenGlossary() {
    GlossaryManagerApp.open();
  }

  /* -------------------------------------------- */
  /*  Dialogs                                      */
  /* -------------------------------------------- */

  async #tabDialog(initial = null) {
    const escName = initial?.name ? esc(initial.name) : "";
    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("GMTOOLS.Screen.TabName")}</label>
        <input type="text" name="name" value="${escName}" placeholder="${game.i18n.localize("GMTOOLS.Screen.NewTab")}" autofocus>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("GMTOOLS.Screen.TabRows")}</label>
        <input type="number" name="rows" min="1" max="4" step="1" value="${initial?.rows ?? 2}">
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("GMTOOLS.Screen.TabCols")}</label>
        <input type="number" name="cols" min="1" max="4" step="1" value="${initial?.cols ?? 2}">
      </div>`;

    const result = await DialogV2.prompt({
      window: {
        title: game.i18n.localize(initial ? "GMTOOLS.Screen.EditTab" : "GMTOOLS.Screen.AddTab"),
        icon: "fa-solid fa-table-cells"
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

    return {
      name: String(result.name ?? "").trim(),
      rows: Math.clamp(Number(result.rows) || 2, 1, 4),
      cols: Math.clamp(Number(result.cols) || 2, 1, 4)
    };
  }
}
