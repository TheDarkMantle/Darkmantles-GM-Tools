import { MODULE_ID, LEGACY_MODULE_ID } from "./constants.mjs";
import { escapeHTML } from "./html.mjs";

// Private page content is fetched from a GM-only compendium, never world settings/flags.
export const PRIVATE_DATA_CHANGED = `${MODULE_ID}.privateDataChanged`;
export const PRIVATE_PACK_ID = "world.darkmantles-codex-private";
let privatePack = null;
let privateJournal = null;
const PAGE_NAMES = { glossary: "Glossary data", notes: "Session notes" };
const emptyGlossary = () => ({ folders: [], entries: [] });
let writes = Promise.resolve();

export function isPrivateStore(doc) {
  return !!doc?.getFlag(MODULE_ID, "privateStore");
}

function store() {
  return game.user.isGM && game.packs.get(PRIVATE_PACK_ID) === privatePack ? privateJournal : null;
}

function page(kind) {
  return store()?.pages.find(p => p.name === PAGE_NAMES[kind]);
}

export function readPrivateGlossary() {
  if (!game.user.isGM) return emptyGlossary();
  const doc = page("glossary");
  if (!doc) return emptyGlossary();
  const root = document.createElement("div");
  root.innerHTML = doc.text.content;
  // Do not silently replace a damaged store with an empty glossary.
  return JSON.parse(root.textContent);
}

export function readSessionNotes() {
  return game.user.isGM ? (page("notes")?.text.content ?? "") : "";
}

/** Only explicitly published fields leave the GM store. */
export function playerGlossary(data) {
  return { folders: [], entries: (data.entries ?? [])
    .filter(e => String(e.playerTip ?? "").trim())
    .map(e => ({ id: e.id, term: e.term, aliases: e.aliases ?? [],
      playerTip: e.playerTip, link: e.link ?? "" })) };
}

function queueWrite(operation) {
  const result = writes.then(operation);
  writes = result.catch(() => {});
  return result;
}

async function writePage(kind, html) {
  if (!game.user.isGM) throw new Error("Only a GM can edit Codex private data.");
  const doc = page(kind);
  if (!doc) throw new Error("Codex private storage is not ready. Wait for the active GM, then try again.");
  await doc.update({ "text.content": html });
}

export function writePrivateGlossary(data) {
  return queueWrite(async () => {
    await writePage("glossary", `<pre>${escapeHTML(JSON.stringify(data))}</pre>`);
    await game.settings.set(MODULE_ID, "glossary", playerGlossary(data));
  });
}

export function writeSessionNotes(html) {
  return queueWrite(() => writePage("notes", html));
}

export function appendSessionNote(html) {
  return queueWrite(() => writePage("notes", `${readSessionNotes()}<hr>${html}`));
}

/** Active GM migrates once; subsequent starts retry publication/cleanup if interrupted. */
export async function initializePrivateData() {
  if (!game.user.isGM) return;
  const activeGM = !game.users.activeGM || game.users.activeGM.id === game.user.id;
  let pack = game.packs.get(PRIVATE_PACK_ID);
  if (!pack) {
    if (!activeGM) return; // The elected GM creates the pack; other GMs load it on creation.
    pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
      name: "darkmantles-codex-private", label: "Darkmantle's Codex — GM Data", type: "JournalEntry"
    });
  }
  if (activeGM) {
    // Restrict the empty pack before writing any private data.
    await pack.configure({ locked: false, ownership: {
      PLAYER: "NONE", TRUSTED: "NONE", ASSISTANT: "OWNER", GAMEMASTER: "OWNER"
    } });
  }
  if (["PLAYER", "TRUSTED"].some(role => pack.ownership[role] !== "NONE")) {
    throw new Error("Codex private compendium permissions must exclude players.");
  }
  privatePack = pack;
  privateJournal = (await pack.getDocuments()).find(isPrivateStore) ?? null;
  let journal = privateJournal;
  if (!activeGM) return;
  if (!journal) {
    const glossary = game.settings.get(MODULE_ID, "glossary") ?? emptyGlossary();
    const notes = game.settings.get(MODULE_ID, "sessionNotes") ?? "";
    journal = await foundry.documents.JournalEntry.create({
      name: "Darkmantle's Codex — GM Data (do not share)",
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
      flags: { [MODULE_ID]: { privateStore: true } },
      pages: [
        { name: PAGE_NAMES.glossary, type: "text", ownership: { default: 0 },
          text: { content: `<pre>${escapeHTML(JSON.stringify(glossary))}</pre>` } },
        { name: PAGE_NAMES.notes, type: "text", ownership: { default: 0 }, text: { content: notes } }
      ]
    }, { pack: pack.collection });
    privateJournal = journal;
  }
  // The old copies are cleared only after creation has succeeded and the stored JSON is readable.
  if (!page("glossary") || !page("notes")) throw new Error("Codex private data page is missing; migration stopped.");
  const data = readPrivateGlossary();
  await game.settings.set(MODULE_ID, "glossary", playerGlossary(data));
  await game.settings.set(MODULE_ID, "sessionNotes", "");
  const world = game.settings.storage.get("world");
  for (const key of ["glossary", "sessionNotes"]) {
    const legacy = world.find(s => s.key === `${LEGACY_MODULE_ID}.${key}`);
    if (legacy) await legacy.update({ value: JSON.stringify(key === "glossary" ? playerGlossary(data) : "") });
  }
}

// Every GM refreshes from the authoritative document, including edits by another GM.
for (const hook of ["createJournalEntry", "updateJournalEntry", "createJournalEntryPage", "updateJournalEntryPage"]) {
  Hooks.on(hook, doc => {
    const journal = doc.documentName === "JournalEntryPage" ? doc.parent : doc;
    if (game.user?.isGM && isPrivateStore(journal) && journal.pack === PRIVATE_PACK_ID) {
      privateJournal = journal;
      Hooks.callAll(PRIVATE_DATA_CHANGED);
    }
  });
}

// Compendium modifications on another GM client invalidate cached document instances.
Hooks.on("updateCompendium", async pack => {
  if (!game.user?.isGM || pack.collection !== PRIVATE_PACK_ID) return;
  try {
    privatePack = pack;
    privateJournal = (await pack.getDocuments()).find(isPrivateStore) ?? null;
    Hooks.callAll(PRIVATE_DATA_CHANGED);
  } catch (err) { console.error(`${MODULE_ID} | Failed to refresh private data`, err); }
});
Hooks.on("createCompendium", async pack => {
  if (!game.user?.isGM || pack.collection !== PRIVATE_PACK_ID
    || game.users.activeGM?.id === game.user.id) return;
  try { await initializePrivateData(); }
  catch (err) { console.error(`${MODULE_ID} | Private storage is not ready yet`, err); }
});
