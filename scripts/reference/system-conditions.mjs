/**
 * Read status conditions from the *installed* game system at runtime, so the
 * module works across systems without bundling (or redistributing) any rules
 * text. Returns `[{ name, img?, icon?, html }]`, cached per system id.
 *
 * Sources, in order of preference:
 *  1. A compendium of condition Items — e.g. pf2e's `pf2e.conditionitems`, whose
 *     items carry a rich `system.description.value`. Also discovered generically
 *     for other systems (any Item pack of `type: "condition"` docs).
 *  2. Core `CONFIG.statusEffects` — every system defines these (name + icon, and
 *     a description or reference on some), as a universal fallback.
 */

const cache = new Map(); // systemId -> Promise<conditions[]>

function textEditor() {
  return foundry.applications.ux.TextEditor.implementation ?? foundry.applications.ux.TextEditor;
}

async function enrich(html, relativeTo) {
  if (!html) return "";
  try {
    return await textEditor().enrichHTML(html, relativeTo ? { relativeTo } : {});
  } catch {
    return html;
  }
}

/** A compendium whose documents are condition Items, if the system ships one. */
function findConditionsPack() {
  const known = game.packs.get("pf2e.conditionitems");
  if (known) return known;
  for (const pack of game.packs) {
    if (pack.metadata.type !== "Item") continue;
    if (/conditions?/i.test(pack.metadata.name) || /conditions?/i.test(pack.metadata.label)) return pack;
  }
  return null;
}

async function fromPack(pack) {
  const docs = await pack.getDocuments();
  const conditions = docs.filter(d => /condition/i.test(d.type ?? ""));
  const list = conditions.length ? conditions : docs;
  const out = [];
  for (const doc of list) {
    out.push({ name: doc.name, img: doc.img, uuid: doc.uuid ?? "", html: await enrich(doc.system?.description?.value ?? "", doc) });
  }
  return out;
}

/** Universal fallback: the core status-effect registry. */
async function fromStatusEffects() {
  const out = [];
  for (const effect of CONFIG.statusEffects ?? []) {
    const name = game.i18n.localize(effect.name ?? effect.label ?? effect.id ?? "");
    if (!name) continue;
    let html = "";
    if (effect.description) html = await enrich(game.i18n.localize(effect.description));
    else if (effect.reference) {
      try {
        const page = await fromUuid(effect.reference);
        if (page?.text?.content) html = await enrich(page.text.content, page);
      } catch { /* leave blank */ }
    }
    out.push({ name, img: effect.img ?? effect.icon, uuid: effect.reference ?? "", html });
  }
  return out;
}

function dedupeSort(list) {
  const seen = new Set();
  return list
    .filter(c => c.name && !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function build() {
  try {
    const pack = findConditionsPack();
    let list = pack ? await fromPack(pack) : [];
    if (!list.length) list = await fromStatusEffects();
    return dedupeSort(list);
  } catch (err) {
    console.error("GM Tools | Failed to read system conditions:", err);
    try { return dedupeSort(await fromStatusEffects()); } catch { return []; }
  }
}

/** Conditions for the active system, resolved once and cached. */
export function getSystemConditions() {
  const sys = game.system?.id ?? "unknown";
  if (!cache.has(sys)) cache.set(sys, build());
  return cache.get(sys);
}

/** Drop the cache (e.g. if the glossary/compendia change). */
export function clearConditionCache() {
  cache.clear();
}
