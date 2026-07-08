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
      .map(e => {
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
      })
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
    const bind = (dialog, element) => {
      const root = element instanceof HTMLElement ? element : element?.[0];
      const drop = root?.querySelector(".gm-link-drop");
      if (!drop) return; // not our dialog
      Hooks.off("renderDialogV2", bind);
      this.#bindLinkDrop(root, drop);
      this.#bindMirrorToggle(root);
    };
    Hooks.on("renderDialogV2", bind);

    let result;
    try {
      result = await DialogV2.prompt({
        classes: ["gm-tools-entry-dialog"],
        window: {
          title: game.i18n.localize(initial ? "GMTOOLS.Glossary.EditEntry" : "GMTOOLS.Glossary.AddEntry"),
          icon: "fa-solid fa-tags"
        },
        content,
        rejectClose: false,
        // Non-modal: a modal dialog makes the sidebar inert, which blocks
        // dragging an actor/journal onto the link drop zone.
        modal: false,
        ok: {
          label: initial ? "GMTOOLS.Save" : "GMTOOLS.Create",
          icon: "fa-solid fa-check",
          callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
        }
      });
    } finally {
      Hooks.off("renderDialogV2", bind); // safety if dialog closed before binding
    }
    if (!result) return null;

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
      link: String(result.link ?? "").trim()
    };
  }

  /** Toggle the player-description field on/off with the "use DM description" checkbox. */
  #bindMirrorToggle(root) {
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
  #bindLinkDrop(root, drop) {
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
}
