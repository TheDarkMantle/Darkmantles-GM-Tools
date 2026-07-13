import { MODULE_ID } from "./constants.mjs";
import { getEntries, isGlossaryEnabled } from "./glossary.mjs";

/**
 * Glossary gap detection: highlight likely names of people, places, and
 * organizations that are NOT in the glossary yet, so the GM can click one to
 * create an entry on the spot. GM-only, gated behind a client setting.
 *
 * Heuristics (tuned against a real 800-page world):
 * - Each block element (p/li/td/…) is its own context, so stat-block labels
 *   ("Speed", "Wis") never count — they always open their table cell.
 * - A single capitalized word counts only when it appears mid-sentence at
 *   least once in the scanned root (sentence-starters alone aren't evidence).
 * - Multi-word capitalized phrases (2–4 words) count anywhere — "Camp Dawn"
 *   is a name even at the start of a sentence.
 * - Headings, links, code, and existing glossary tips are excluded, as are
 *   common sentence words, D&D mechanics jargon, and user-ignored terms.
 */

const STOP_WORDS = new Set([
  "I", "I'm", "I'll", "I've", "I'd", "A", "An", "The", "If", "But", "And", "Or",
  "So", "Then", "When", "While", "He", "She", "It", "It's", "They", "We", "You",
  "Your", "His", "Her", "Their", "Its", "This", "That", "These", "Those",
  "There", "Here", "What", "Who", "Why", "How", "Not", "No", "Yes", "As", "At",
  "On", "In", "Of", "To", "For", "With", "From", "By", "Also", "After",
  "Before", "During", "Once", "Now", "Each", "Any", "All", "Some", "Most",
  "GM", "DM", "DC", "HP", "AC", "XP", "PC", "PCs", "NPC", "NPCs", "D&D"
]);

const JARGON = new Set([
  "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma",
  "Str", "Dex", "Con", "Int", "Wis", "Cha", "Speed", "Initiative", "Senses",
  "Skills", "Languages", "Immunities", "Resistances", "Vulnerabilities",
  "Saves", "Save", "Mod", "CR", "Hit Points", "Hit Dice", "Armor Class",
  "Saving Throw", "Saving Throws", "Difficulty Class", "Actions", "Reactions",
  "Legendary Actions", "Bonus Action", "Bonus Actions", "Reaction", "Action",
  "Attack", "Melee", "Ranged", "Damage", "Traits", "Fly", "Swim", "Climb",
  "Burrow", "Darkvision", "Blindsight", "Tremorsense", "Truesight",
  "Passive Perception", "Acrobatics", "Animal Handling", "Arcana", "Athletics",
  "Deception", "History", "Insight", "Intimidation", "Investigation",
  "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight", "Stealth", "Survival", "Gold", "Silver", "Copper", "Platinum",
  "Electrum", "Advantage", "Disadvantage", "Proficiency", "Proficiency Bonus"
]);

/** Blocks that form their own sentence context. Headings are deliberately absent. */
const BLOCK_SELECTOR = "p, li, td, th, dd, dt, caption, blockquote, figcaption, summary";

/** Never scan or wrap inside these (mirrors the glossary skip list + headings + our own spans). */
const SKIP_SELECTOR = [
  "a", "code", "pre", "textarea", "input", "button",
  "h1", "h2", "h3", "h4", "h5", "h6",
  ".gm-tools-tip", ".gm-tools-gap",
  "[contenteditable='true']",
  ".editor-content.ProseMirror[contenteditable]"
].join(", ");

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

export function isGapDetectionEnabled() {
  return !!game.user?.isGM
    && isGlossaryEnabled()
    && (game.settings.get(MODULE_ID, "glossaryGapDetection") ?? false);
}

/** Terms the GM has dismissed — never suggest them again (lowercased). */
export function getGapIgnore() {
  return game.settings.get(MODULE_ID, "glossaryGapIgnore") ?? [];
}

export async function addGapIgnore(term) {
  const key = String(term ?? "").trim().toLowerCase();
  if (!key) return;
  const list = getGapIgnore();
  if (list.includes(key)) return;
  await game.settings.set(MODULE_ID, "glossaryGapIgnore", [...list, key]);
}

/** Strip a trailing possessive ('s / ’s) from a word. */
function unpossess(word) {
  return word.replace(/['’]s$/, "");
}

const CAP_WORD = /^[A-Z][\w'’-]*$/;
const cleanWord = w => (w ?? "").replace(/^[^A-Za-z0-9'’]+|[^A-Za-z0-9'’]+$/g, "");

// Tokens that join two capitalized words into one name, e.g. "Skull & Sword".
// Only the "&" symbol — spelled-out "and" wrongly joins separate names
// ("Kord and Melora"), so names with "and" are completed by hand in the editor.
const CONNECTORS = new Set(["&"]);

/**
 * Detect candidate names in the text blocks under `root`.
 * Returns a Set of phrase strings that pass the heuristics.
 */
function detectCandidates(root, excluded) {
  let blocks = [...root.querySelectorAll(BLOCK_SELECTOR)]
    .filter(b => !b.querySelector(BLOCK_SELECTOR) && !b.closest(SKIP_SELECTOR));
  if (!blocks.length) blocks = [root];

  const found = new Map(); // phrase -> { mid, multi }
  for (const block of blocks) {
    const text = block.textContent ?? "";
    for (const sentence of text.split(/(?<=[.!?:;])\s+|\n+/)) {
      const words = sentence.trim().split(/\s+/);
      let i = 0;
      while (i < words.length) {
        if (CAP_WORD.test(cleanWord(words[i]))) {
          const start = i;
          const phrase = [];
          while (i < words.length && phrase.length < 4 && CAP_WORD.test(cleanWord(words[i]))) {
            phrase.push(unpossess(cleanWord(words[i])));
            i++;
            // Step over a connector ("&") that joins two capitalized words.
            if (i < words.length && CONNECTORS.has(words[i]) && CAP_WORD.test(cleanWord(words[i + 1] ?? ""))) {
              phrase.push(words[i]);
              i++;
            }
          }
          // Drop a dangling connector if the run hit the length cap right after one.
          while (phrase.length && CONNECTORS.has(phrase[phrase.length - 1])) phrase.pop();
          // A 4-word run followed by more capitals is a run-in header, not a name.
          if (i < words.length && CAP_WORD.test(cleanWord(words[i]))) {
            while (i < words.length && CAP_WORD.test(cleanWord(words[i]))) i++;
            continue;
          }
          const key = phrase.join(" ");
          if (!key || key.length < 3) continue;
          if (excluded.has(key.toLowerCase())) continue;
          if (phrase.length === 1 && (STOP_WORDS.has(key) || JARGON.has(key))) continue;
          if (JARGON.has(key) || phrase.every(w => STOP_WORDS.has(w) || JARGON.has(w))) continue;
          let rec = found.get(key);
          if (!rec) found.set(key, rec = { mid: 0, multi: phrase.length > 1 });
          if (start > 0) rec.mid++;
        } else i++;
      }
    }
  }

  const candidates = new Set();
  for (const [key, rec] of found) {
    if (rec.mid >= 1 || rec.multi) candidates.add(key);
  }
  return candidates;
}

/**
 * Highlight candidate glossary terms in rendered content. Idempotent: old gap
 * spans are unwrapped first, so re-applying refreshes in place. Runs AFTER
 * applyGlossary so existing tips are excluded.
 */
export function applyGapDetection(root) {
  if (root && !(root instanceof HTMLElement)) root = root?.[0]; // tolerate jQuery
  if (!root) return;

  for (const old of root.querySelectorAll("span.gm-tools-gap")) {
    old.replaceWith(document.createTextNode(old.textContent));
  }
  root.normalize();
  if (!isGapDetectionEnabled()) return;

  // Everything already known: glossary terms + aliases, and dismissed terms.
  const excluded = new Set(getGapIgnore());
  for (const entry of getEntries()) {
    for (const term of [entry.term, ...(entry.aliases ?? [])]) {
      const key = String(term ?? "").trim().toLowerCase();
      if (key) excluded.add(key);
    }
  }

  const candidates = detectCandidates(root, excluded);
  if (!candidates.size) return;

  const patterns = [...candidates].map(escapeRegExp).sort((a, b) => b.length - a.length);
  // Case-sensitive on purpose: candidates are capitalized names; matching the
  // lowercase form ("the haze") would balloon false positives.
  const regex = new RegExp(`\\b(${patterns.join("|")})\\b`, "g");
  const tooltip = game.i18n.localize("GMTOOLS.Glossary.GapTooltip");

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
    regex.lastIndex = 0;
    let match;
    let last = 0;
    let frag = null;
    while ((match = regex.exec(text))) {
      frag ??= document.createDocumentFragment();
      if (match.index > last) frag.append(text.slice(last, match.index));
      const span = document.createElement("span");
      span.className = "gm-tools-gap";
      span.dataset.gapTerm = match[0];
      span.dataset.tooltip = esc(tooltip);
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

/** Re-apply gap detection to every open window that shows journal content. */
export function refreshGapWindows() {
  for (const app of foundry.applications.instances.values()) {
    if (!app.rendered || !app.element) continue;
    if (app.element.querySelector(".journal-entry-content, .journal-entry-pages, .journal-page-content")) {
      applyGapDetection(app.element);
    }
  }
}
