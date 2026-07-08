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

export function getEntries() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, "glossary")?.entries ?? []);
}

export async function saveEntries(entries) {
  await game.settings.set(MODULE_ID, "glossary", { entries });
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
