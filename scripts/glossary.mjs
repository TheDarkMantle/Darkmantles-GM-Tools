import { MODULE_ID } from "./constants.mjs";

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Per-user toggle for the whole glossary feature (buttons + tooltips). */
export function isGlossaryEnabled() {
  return game.settings.get(MODULE_ID, "glossaryEnabled") ?? true;
}

/** The full stored glossary: folders + entries, with safe defaults for old data. */
export function getGlossary() {
  const data = game.settings.get(MODULE_ID, "glossary") ?? {};
  return {
    folders: foundry.utils.deepClone(data.folders ?? []),
    entries: foundry.utils.deepClone(data.entries ?? [])
  };
}

export async function saveGlossary({ folders, entries }) {
  await game.settings.set(MODULE_ID, "glossary", { folders: folders ?? [], entries: entries ?? [] });
}

export function getEntries() {
  return getGlossary().entries;
}

/** Persist entries while preserving the folder tree. */
export async function saveEntries(entries) {
  await saveGlossary({ folders: getGlossary().folders, entries });
}

export function getFolders() {
  return getGlossary().folders;
}

export async function saveFolders(folders) {
  await saveGlossary({ folders, entries: getGlossary().entries });
}

/** Delete a folder; its subfolders and entries fall back to its parent. */
export async function deleteFolder(folderId) {
  const { folders, entries } = getGlossary();
  const target = folders.find(f => f.id === folderId);
  if (!target) return;
  const newParent = target.parent ?? null;
  for (const f of folders) if (f.parent === folderId) f.parent = newParent;
  for (const e of entries) if (e.folder === folderId) e.folder = newParent;
  await saveGlossary({ folders: folders.filter(f => f.id !== folderId), entries });
}

/**
 * Merge a portable glossary object into the stored one. Folders are referenced
 * by name (created as needed); entries are matched by term (case-insensitive).
 * mode: "merge" (add + update), "add" (skip existing), "replace" (wipe first).
 */
export async function importGlossary(data, mode = "merge") {
  const base = mode === "replace" ? { folders: [], entries: [] } : getGlossary();
  const folders = base.folders;
  const entries = base.entries;
  const result = { added: 0, updated: 0, skipped: 0, foldersCreated: 0 };

  const ensureFolder = (name, parentName = null) => {
    if (!name) return null;
    const parentId = parentName ? ensureFolder(parentName) : null;
    let f = folders.find(x =>
      x.name.toLowerCase() === String(name).toLowerCase() && (x.parent ?? null) === (parentId ?? null));
    if (!f) {
      f = { id: foundry.utils.randomID(8), name: String(name), parent: parentId ?? null };
      folders.push(f);
      result.foldersCreated++;
    }
    return f.id;
  };

  for (const f of data.folders ?? []) ensureFolder(f.name, f.parent ?? null);

  for (const raw of data.entries ?? []) {
    const term = String(raw.term ?? "").trim();
    if (!term) continue;
    const gmTip = String(raw.gmTip ?? "").trim();
    const mirrorGM = !!raw.mirrorGM;
    const norm = {
      term,
      aliases: Array.isArray(raw.aliases)
        ? raw.aliases.map(a => String(a).trim()).filter(Boolean)
        : String(raw.aliases ?? "").split(",").map(a => a.trim()).filter(Boolean),
      gmTip,
      playerTip: mirrorGM ? gmTip : String(raw.playerTip ?? "").trim(),
      mirrorGM,
      link: String(raw.link ?? "").trim(),
      folder: raw.folder ? ensureFolder(raw.folder) : null
    };
    const existing = entries.find(e => e.term?.trim().toLowerCase() === term.toLowerCase());
    if (existing) {
      if (mode === "add") { result.skipped++; continue; }
      Object.assign(existing, norm, { id: existing.id });
      result.updated++;
    } else {
      entries.push({ id: foundry.utils.randomID(8), ...norm });
      result.added++;
    }
  }

  await saveGlossary({ folders, entries });
  return result;
}

/** A portable, name-based snapshot of the glossary for download/sharing. */
export function toPortable() {
  const { folders, entries } = getGlossary();
  const nameById = new Map(folders.map(f => [f.id, f.name]));
  return {
    folders: folders.map(f => ({ name: f.name, parent: f.parent ? (nameById.get(f.parent) ?? null) : null })),
    entries: entries.map(e => ({
      term: e.term,
      aliases: e.aliases ?? [],
      gmTip: e.gmTip ?? "",
      playerTip: e.playerTip ?? "",
      mirrorGM: !!e.mirrorGM,
      link: e.link ?? "",
      folder: e.folder ? (nameById.get(e.folder) ?? null) : null
    }))
  };
}

/** Trigger a download of the current glossary as a portable JSON file. */
export function exportGlossary() {
  const stamp = new Date().toISOString().slice(0, 10);
  foundry.utils.saveDataToFile(
    JSON.stringify(toPortable(), null, 2), "application/json", `gm-tools-glossary-${stamp}.json`);
}

/** The tip the current user should see for an entry (null = nothing, no highlight). */
function tipFor(entry) {
  return (game.user.isGM ? entry.gmTip : entry.playerTip) || null;
}

function findEntry(term) {
  const needle = term.trim().toLowerCase();
  return getEntries().find(e =>
    e.term?.trim().toLowerCase() === needle ||
    (e.aliases ?? []).some(a => a.trim().toLowerCase() === needle)
  ) ?? null;
}

/**
 * Compiled term matcher for the current user. Terms whose visible tip is empty
 * for this user (e.g. GM-only entries on a player client) are excluded, so
 * players get no highlight at all for them.
 */
let matcher = null;

export function rebuildMatcher() {
  const map = new Map();
  const patterns = [];
  for (const entry of getEntries()) {
    if (!tipFor(entry)) continue;
    for (const term of [entry.term, ...(entry.aliases ?? [])]) {
      const key = String(term ?? "").trim();
      if (!key) continue;
      map.set(key.toLowerCase(), entry);
      patterns.push(escapeRegExp(key));
    }
  }
  if (!patterns.length) {
    matcher = null;
    return;
  }
  patterns.sort((a, b) => b.length - a.length);
  matcher = { regex: new RegExp(`\\b(${patterns.join("|")})\\b`, "gi"), map };
}

const SKIP_SELECTOR = [
  "a",
  "code",
  "pre",
  "textarea",
  "input",
  "button",
  ".gm-tools-tip",
  "[contenteditable='true']",
  ".editor-content.ProseMirror[contenteditable]"
].join(", ");

/**
 * Wrap glossary terms found in rendered content with tooltip spans.
 * Idempotent: previously applied spans are unwrapped first, so re-applying
 * after a glossary change refreshes tips in place.
 */
export function applyGlossary(root) {
  if (root && !(root instanceof HTMLElement)) root = root?.[0]; // tolerate jQuery
  if (!root) return;

  for (const old of root.querySelectorAll("span.gm-tools-tip")) {
    old.replaceWith(document.createTextNode(old.textContent));
  }
  root.normalize();
  if (!matcher || !isGlossaryEnabled()) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const text = node.nodeValue;
    matcher.regex.lastIndex = 0;
    let match;
    let last = 0;
    let frag = null;
    while ((match = matcher.regex.exec(text))) {
      const entry = matcher.map.get(match[0].toLowerCase());
      const tip = entry ? tipFor(entry) : null;
      if (!tip) continue;
      frag ??= document.createDocumentFragment();
      if (match.index > last) frag.append(text.slice(last, match.index));
      const span = document.createElement("span");
      span.className = "gm-tools-tip";
      span.dataset.tooltip = esc(tip);
      if (entry.link) {
        span.classList.add("gm-tools-tip-link");
        span.dataset.uuid = entry.link;
      }
      span.textContent = match[0];
      frag.append(span);
      last = match.index + match[0].length;
    }
    if (frag) {
      if (last < text.length) frag.append(text.slice(last));
      node.replaceWith(frag);
    }
  }
}

/**
 * Explicit `@tip[term]` syntax for places auto-matching misses.
 * Renders as a plain span (no highlight) when the current user has no tip.
 */
export function registerEnricher() {
  CONFIG.TextEditor.enrichers.push({
    pattern: /@tip\[([^\]]+)\]/gi,
    enricher: async match => {
      const term = match[1];
      const entry = isGlossaryEnabled() ? findEntry(term) : null;
      const span = document.createElement("span");
      span.textContent = term;
      const tip = entry ? tipFor(entry) : null;
      if (tip) {
        span.className = "gm-tools-tip";
        span.dataset.tooltip = esc(tip);
        if (entry.link) {
          span.classList.add("gm-tools-tip-link");
          span.dataset.uuid = entry.link;
        }
      }
      return span;
    }
  });
}

/** Re-apply glossary spans to every open window that shows journal content. */
export function refreshJournalWindows() {
  for (const app of foundry.applications.instances.values()) {
    if (!app.rendered || !app.element) continue;
    if (app.element.querySelector(".journal-entry-content, .journal-entry-pages, .journal-page-content")) {
      applyGlossary(app.element);
    }
  }
}
