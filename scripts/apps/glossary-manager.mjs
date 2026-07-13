import { MODULE_ID, TEMPLATES } from "../constants.mjs";
import {
  getGlossary, getFolders, saveFolders, deleteFolder,
  importGlossary, exportGlossary
} from "../glossary.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

/** Folders as a nested tree, sorted by name. */
function folderTree(folders, parent = null) {
  return folders
    .filter(f => (f.parent ?? null) === parent)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(f => ({ ...f, children: folderTree(folders, f.id) }));
}

/** A folder id plus all of its descendants (for cycle-safe parent pickers). */
function subtreeIds(folders, id) {
  if (!id) return new Set();
  const ids = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const f of folders) {
      if (f.parent && ids.has(f.parent) && !ids.has(f.id)) { ids.add(f.id); changed = true; }
    }
  }
  return ids;
}

/** Indented <option> list of folders for a parent/folder <select>. */
function folderOptionsHTML(selectedId, { noneLabel = "— None —", excludeId = null } = {}) {
  const folders = getFolders();
  const excluded = subtreeIds(folders, excludeId);
  const walk = (nodes, depth) => nodes.flatMap(n => excluded.has(n.id) ? [] : [
    `<option value="${n.id}" ${n.id === selectedId ? "selected" : ""}>${"  ".repeat(depth)}${esc(n.name)}</option>`,
    ...walk(n.children, depth + 1)
  ]);
  const none = `<option value="" ${!selectedId ? "selected" : ""}>${esc(noneLabel)}</option>`;
  return none + walk(folderTree(folders), 0).join("");
}

/**
 * GM-only glossary manager: a foldered tree of entries, each with a term,
 * aliases, GM + player descriptions, an optional document link and folder.
 * Supports import/export and loading bundled defaults.
 */
export class GlossaryManagerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static instance = null;

  /** Folder ids the user has collapsed (kept across re-renders). */
  #collapsed = new Set();

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
    position: { width: 560, height: 640 },
    actions: {
      addEntry: GlossaryManagerApp.#onAddEntry,
      editEntry: GlossaryManagerApp.#onEditEntry,
      deleteEntry: GlossaryManagerApp.#onDeleteEntry,
      newFolder: GlossaryManagerApp.#onNewFolder,
      renameFolder: GlossaryManagerApp.#onRenameFolder,
      deleteFolder: GlossaryManagerApp.#onDeleteFolder,
      toggleFolder: GlossaryManagerApp.#onToggleFolder,
      importGlossary: GlossaryManagerApp.#onImport,
      exportGlossary: GlossaryManagerApp.#onExport
    }
  };

  static PARTS = {
    body: { template: TEMPLATES.glossaryManager }
  };

  #entryVM(e) {
    const linked = e.link ? fromUuidSync(e.link) : null;
    return {
      id: e.id,
      term: e.term,
      aliases: (e.aliases ?? []).join(", "),
      gmTip: e.gmTip ?? "",
      playerTip: e.playerTip ?? "",
      hasPlayerTip: !!e.playerTip,
      mirrorGM: !!e.mirrorGM,
      showPlayerTip: !!e.playerTip && !e.mirrorGM,
      hasLink: !!e.link,
      linkName: e.link ? (linked?.name ?? game.i18n.localize("GMTOOLS.Screen.MissingDocument")) : ""
    };
  }

  async _prepareContext() {
    const { folders, entries } = getGlossary();
    const sorted = [...entries].sort((a, b) => a.term.localeCompare(b.term));

    const byFolder = new Map();
    const uncategorized = [];
    for (const e of sorted) {
      const inFolder = e.folder && folders.some(f => f.id === e.folder);
      if (inFolder) (byFolder.get(e.folder) ?? byFolder.set(e.folder, []).get(e.folder)).push(this.#entryVM(e));
      else uncategorized.push(this.#entryVM(e));
    }

    const build = (parent, depth) => folders
      .filter(f => (f.parent ?? null) === parent)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(f => {
        const children = build(f.id, depth + 1);
        const ents = byFolder.get(f.id) ?? [];
        return {
          id: f.id, name: f.name, depth,
          collapsed: this.#collapsed.has(f.id),
          entries: ents, children,
          count: ents.length + children.reduce((s, c) => s + c.count, 0)
        };
      });

    return {
      tree: build(null, 0),
      uncategorized,
      hasUncategorized: uncategorized.length > 0,
      empty: !entries.length && !folders.length
    };
  }

  _onRender() {
    const list = this.element.querySelector(".gm-glossary-list");
    const filter = this.element.querySelector(".gm-glossary-filter");
    filter?.addEventListener("input", ev => {
      const q = ev.currentTarget.value.trim().toLowerCase();
      for (const row of list.querySelectorAll(".gm-glossary-row")) {
        row.style.display = !q || row.textContent.toLowerCase().includes(q) ? "" : "none";
      }
      for (const folder of list.querySelectorAll(".gm-folder[data-folder-id]")) {
        const hasVisible = [...folder.querySelectorAll(".gm-glossary-row")].some(r => r.style.display !== "none");
        folder.style.display = !q || hasVisible ? "" : "none";
        // Expand while searching; restore saved collapse state when cleared.
        if (q) folder.classList.toggle("collapsed", !hasVisible);
        else folder.classList.toggle("collapsed", this.#collapsed.has(folder.dataset.folderId));
      }
    });

    this.#bindEntryDragDrop(list);
  }

  /** Drag an entry row onto a folder (or Uncategorized) to move it there. */
  #bindEntryDragDrop(list) {
    const clear = () => list.querySelectorAll(".drag-over").forEach(e => e.classList.remove("drag-over"));

    list.addEventListener("dragstart", ev => {
      const row = ev.target.closest(".gm-glossary-row");
      if (!row) return;
      ev.dataTransfer.setData("text/plain", row.dataset.entryId);
      ev.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
    });

    list.addEventListener("dragend", ev => {
      ev.target.closest(".gm-glossary-row")?.classList.remove("dragging");
      clear();
    });

    list.addEventListener("dragover", ev => {
      const folder = ev.target.closest(".gm-folder");
      if (!folder) { clear(); return; }
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move";
      if (!folder.classList.contains("drag-over")) { clear(); folder.classList.add("drag-over"); }
    });

    list.addEventListener("drop", async ev => {
      const folder = ev.target.closest(".gm-folder");
      clear();
      if (!folder) return;
      ev.preventDefault();
      const id = ev.dataTransfer.getData("text/plain");
      const folderId = folder.dataset.folderId || null;  // Uncategorized has no id
      const { entries } = getGlossary();
      const entry = entries.find(e => e.id === id);
      if (!entry || (entry.folder ?? null) === folderId) return;
      entry.folder = folderId;
      await this.#saveEntries(entries);
    });
  }

  /* -------------------------------------------- */
  /*  Entry actions                                */
  /* -------------------------------------------- */

  async #saveEntries(entries) {
    await game.settings.set(MODULE_ID, "glossary", { folders: getFolders(), entries });
    this.render();
  }

  static async #onAddEntry() {
    const data = await entryDialog();
    if (!data) return;
    const { entries } = getGlossary();
    entries.push({ id: foundry.utils.randomID(8), ...data });
    await this.#saveEntries(entries);
  }

  static async #onEditEntry(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    const { entries } = getGlossary();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const data = await entryDialog(entry);
    if (!data) return;
    Object.assign(entry, data);
    await this.#saveEntries(entries);
  }

  static async #onDeleteEntry(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    const { entries } = getGlossary();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("GMTOOLS.Glossary.DeleteEntry") },
      content: `<p>${game.i18n.format("GMTOOLS.Glossary.DeleteConfirm", { term: esc(entry.term) })}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!confirmed) return;
    await this.#saveEntries(entries.filter(e => e.id !== id));
  }

  /* -------------------------------------------- */
  /*  Folder actions                               */
  /* -------------------------------------------- */

  static async #onNewFolder(event, target) {
    const data = await this.#folderDialog(null, target?.dataset?.parent || "");
    if (!data) return;
    const folders = getFolders();
    folders.push({ id: foundry.utils.randomID(8), name: data.name, parent: data.parent });
    await saveFolders(folders);
    this.render();
  }

  static async #onRenameFolder(event, target) {
    const id = target.closest("[data-folder-id]")?.dataset.folderId;
    const folders = getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    const data = await this.#folderDialog(folder);
    if (!data) return;
    folder.name = data.name;
    folder.parent = data.parent;
    await saveFolders(folders);
    this.render();
  }

  static async #onDeleteFolder(event, target) {
    const id = target.closest("[data-folder-id]")?.dataset.folderId;
    const folder = getFolders().find(f => f.id === id);
    if (!folder) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("GMTOOLS.Glossary.DeleteFolder") },
      content: `<p>${game.i18n.format("GMTOOLS.Glossary.DeleteFolderConfirm", { name: esc(folder.name) })}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!confirmed) return;
    await deleteFolder(id);
    this.render();
  }

  static #onToggleFolder(event, target) {
    const el = target.closest("[data-folder-id]");
    const id = el?.dataset.folderId;
    if (!id) return;
    if (this.#collapsed.has(id)) this.#collapsed.delete(id);
    else this.#collapsed.add(id);
    el.classList.toggle("collapsed");
  }

  async #folderDialog(initial = null, presetParent = "") {
    const i18n = key => game.i18n.localize(`GMTOOLS.Glossary.${key}`);
    const parentValue = initial ? (initial.parent ?? "") : presetParent;
    const content = `
      <div class="form-group">
        <label>${i18n("FolderName")}</label>
        <input type="text" name="name" value="${esc(initial?.name ?? "")}" required autofocus>
      </div>
      <div class="form-group">
        <label>${i18n("ParentFolder")}</label>
        <select name="parent">${folderOptionsHTML(parentValue, { noneLabel: i18n("TopLevel"), excludeId: initial?.id ?? null })}</select>
      </div>`;
    const result = await DialogV2.prompt({
      window: {
        title: game.i18n.localize(initial ? "GMTOOLS.Glossary.RenameFolder" : "GMTOOLS.Glossary.NewFolder"),
        icon: "fa-solid fa-folder"
      },
      content,
      rejectClose: false,
      modal: true,
      ok: {
        label: initial ? "GMTOOLS.Save" : "GMTOOLS.Create",
        icon: "fa-solid fa-check",
        callback: (e, button) => new foundry.applications.ux.FormDataExtended(button.form).object
      }
    });
    if (!result) return null;
    const name = String(result.name ?? "").trim();
    if (!name) return null;
    return { name, parent: result.parent || null };
  }

  /* -------------------------------------------- */
  /*  Import / Export                              */
  /* -------------------------------------------- */

  static async #onImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await foundry.utils.readTextFromFile(file));
        const res = await importGlossary(data, "merge");
        ui.notifications.info(game.i18n.format("GMTOOLS.Glossary.ImportResult", res));
        this.render();
      } catch (err) {
        console.error(`${MODULE_ID} | Glossary import failed`, err);
        ui.notifications.error(game.i18n.localize("GMTOOLS.Glossary.ImportError"));
      }
    });
    input.click();
  }

  static #onExport() {
    exportGlossary();
  }

  /* -------------------------------------------- */
  /*  Entry editor dialog                          */
  /* -------------------------------------------- */

}

/**
 * The add/edit glossary entry dialog, shared by the manager and the gap-detection
 * click flow. Resolves to the normalized entry data, null (cancelled), or the
 * string "ignore" when opened with `gapMode` and the GM dismissed the term.
 */
export async function entryDialog(initial = null, { gapMode = false } = {}) {
    const i18n = key => game.i18n.localize(`GMTOOLS.Glossary.${key}`);
    const linkDoc = initial?.link ? fromUuidSync(initial.link) : null;
    const linkName = initial?.link
      ? (linkDoc?.name ?? game.i18n.localize("GMTOOLS.Screen.MissingDocument"))
      : "";
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
      <div class="form-group">
        <label>${i18n("Folder")}</label>
        <div class="gm-folder-row">
          <select name="folder">${folderOptionsHTML(initial?.folder ?? "", { noneLabel: i18n("Uncategorized") })}</select>
          <button type="button" class="gm-open-glossary" data-tooltip="${i18n("ManageFolders")}" aria-label="${i18n("ManageFolders")}">
            <i class="fa-solid fa-folder-tree"></i>
          </button>
        </div>
      </div>
      <div class="form-group stacked">
        <label>${i18n("GMTip")}</label>
        <textarea name="gmTip" rows="3">${esc(initial?.gmTip ?? "")}</textarea>
      </div>
      <div class="form-group gm-mirror-group">
        <label class="checkbox">
          <input type="checkbox" name="mirrorGM" ${initial?.mirrorGM ? "checked" : ""}>
          ${i18n("MirrorGM")}
        </label>
      </div>
      <div class="form-group stacked gm-player-tip-group">
        <label>${i18n("PlayerTip")}</label>
        <textarea name="playerTip" rows="3" placeholder="${i18n("PlayerTipHint")}" ${initial?.mirrorGM ? "disabled" : ""}>${esc(initial?.mirrorGM ? "" : (initial?.playerTip ?? ""))}</textarea>
      </div>
      <div class="form-group stacked">
        <label>${i18n("Link")}</label>
        <input type="hidden" name="link" value="${esc(initial?.link ?? "")}">
        <div class="gm-link-drop ${initial?.link ? "has-link" : ""}">
          <i class="fa-solid fa-link"></i>
          <span class="gm-link-name">${linkName ? esc(linkName) : i18n("LinkHint")}</span>
          <button type="button" class="gm-link-clear" data-tooltip="${i18n("LinkClear")}" aria-label="${i18n("LinkClear")}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>`;

    // DialogV2._onRender is a no-op, so bind interactive fields via the render hook.
    let folderHookId = null;
    const bind = (dialog, element) => {
      const root = element instanceof HTMLElement ? element : element?.[0];
      const drop = root?.querySelector(".gm-link-drop");
      if (!drop) return; // not our dialog
      Hooks.off("renderDialogV2", bind);
      bindLinkDrop(root, drop);
      bindMirrorToggle(root);

      // "Manage folders" button opens the glossary window (e.g. to add a folder)
      // without leaving this dialog.
      root.querySelector(".gm-open-glossary")?.addEventListener("click", () => GlossaryManagerApp.open());

      // Keep the folder dropdown in sync if folders are added/renamed elsewhere
      // (like via the button above) while this dialog stays open.
      const select = root.querySelector('select[name="folder"]');
      if (select) {
        folderHookId = Hooks.on("updateSetting", setting => {
          if (setting?.key !== `${MODULE_ID}.glossary`) return;
          select.innerHTML = folderOptionsHTML(select.value, { noneLabel: i18n("Uncategorized") });
        });
      }
    };
    Hooks.on("renderDialogV2", bind);

    // gapMode ("add this suggested term?") gets an extra Ignore button that
    // dismisses the term permanently; DialogV2.wait resolves to the button's
    // callback result, or its action id ("ignore") when it has no callback.
    const buttons = [{
      action: "ok",
      label: initial?.term && !gapMode ? "GMTOOLS.Save" : "GMTOOLS.Create",
      icon: "fa-solid fa-check",
      default: true,
      callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
    }];
    if (gapMode) buttons.push({
      action: "ignore",
      label: "GMTOOLS.Glossary.GapIgnore",
      icon: "fa-solid fa-ban"
    });

    let result;
    try {
      result = await DialogV2.wait({
        classes: ["gm-tools-entry-dialog"],
        window: {
          title: game.i18n.localize(initial && !gapMode ? "GMTOOLS.Glossary.EditEntry" : "GMTOOLS.Glossary.AddEntry"),
          icon: "fa-solid fa-tags"
        },
        content,
        rejectClose: false,
        // Non-modal: a modal dialog makes the sidebar inert, which blocks
        // dragging an actor/journal onto the link drop zone.
        modal: false,
        buttons
      });
    } finally {
      Hooks.off("renderDialogV2", bind); // safety if dialog closed before binding
      if (folderHookId) Hooks.off("updateSetting", folderHookId);
    }
    if (result === "ignore") return "ignore";
    if (!result || typeof result !== "object") return null;

    const term = String(result.term ?? "").trim();
    if (!term) return null;
    const gmTip = String(result.gmTip ?? "").trim();
    const mirrorGM = !!result.mirrorGM;
    return {
      term,
      aliases: String(result.aliases ?? "")
        .split(",")
        .map(a => a.trim())
        .filter(Boolean),
      gmTip,
      // When mirroring, players see the GM text: store it as the player tip so the
      // matcher needs no special-casing, and flag it so the manager shows the star.
      playerTip: mirrorGM ? gmTip : String(result.playerTip ?? "").trim(),
      mirrorGM,
      link: String(result.link ?? "").trim(),
      folder: result.folder || null
    };
}

/** Toggle the player-description field on/off with the "use DM description" checkbox. */
function bindMirrorToggle(root) {
    const checkbox = root.querySelector('input[name="mirrorGM"]');
    const textarea = root.querySelector('textarea[name="playerTip"]');
    if (!checkbox || !textarea) return;
    const group = textarea.closest(".gm-player-tip-group");
    const sync = () => {
      const on = checkbox.checked;
      textarea.disabled = on;
      if (group) group.classList.toggle("gm-disabled", on);
    };
    checkbox.addEventListener("change", sync);
    sync();
}

/** Wire the drag-drop link zone inside the entry dialog. */
function bindLinkDrop(root, drop) {
    const input = root.querySelector('input[name="link"]');
    const nameEl = drop.querySelector(".gm-link-name");
    const hint = game.i18n.localize("GMTOOLS.Glossary.LinkHint");
    const ACCEPTED = new Set(["JournalEntry", "JournalEntryPage", "Actor"]);

    const setLink = (uuid, name) => {
      input.value = uuid ?? "";
      nameEl.textContent = name ?? hint;
      drop.classList.toggle("has-link", !!uuid);
    };

    root.querySelector(".gm-link-clear")?.addEventListener("click", () => setLink("", ""));

    const TextEditorCls = foundry.applications.ux.TextEditor.implementation ?? foundry.applications.ux.TextEditor;
    const DragDropCls = CONFIG.ux?.DragDrop ?? foundry.applications.ux.DragDrop;
    new DragDropCls({
      dropSelector: ".gm-link-drop",
      callbacks: {
        drop: async event => {
          const data = TextEditorCls.getDragEventData(event);
          if (!data?.uuid || !ACCEPTED.has(data.type)) {
            ui.notifications.warn(game.i18n.localize("GMTOOLS.Glossary.LinkTypeWarning"));
            return;
          }
          const doc = await fromUuid(data.uuid);
          if (doc) setLink(doc.uuid, doc.name);
        }
      }
    }).bind(drop);
}
