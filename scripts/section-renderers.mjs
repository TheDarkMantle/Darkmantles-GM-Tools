import { MODULE_ID, TEMPLATES } from "./constants.mjs";

function textEditor() {
  return foundry.applications.ux.TextEditor.implementation ?? foundry.applications.ux.TextEditor;
}

function esc(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function formatMod(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return n >= 0 ? `+${n}` : `${n}`;
}

async function enrich(text, relativeTo) {
  return textEditor().enrichHTML(text ?? "", { relativeTo, secrets: true });
}

/**
 * Resolve a UUID and produce the section header info + inner HTML for a GM Screen cell.
 */
export async function renderSection(uuid) {
  let doc = null;
  try {
    doc = await fromUuid(uuid);
  } catch (err) {
    console.warn(`${MODULE_ID} | Failed to resolve ${uuid}`, err);
  }
  if (!doc) {
    return {
      uuid,
      name: game.i18n.localize("GMTOOLS.Screen.MissingDocument"),
      img: "icons/svg/hazard.svg",
      html: `<p class="gm-missing">${game.i18n.localize("GMTOOLS.Screen.MissingDocumentHint")}</p>`
    };
  }

  const base = {
    uuid: doc.uuid,
    name: doc.name,
    img: doc.img ?? doc.thumb ?? "icons/svg/book.svg"
  };

  let html;
  try {
    switch (doc.documentName) {
      case "Actor":
        html = await renderActorCard(doc);
        break;
      case "JournalEntry":
        html = await renderJournalEntry(doc);
        break;
      case "JournalEntryPage":
        html = await renderJournalPage(doc);
        break;
      default:
        html = await embedOrLink(doc);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Failed to render section for ${uuid}`, err);
    html = await enrich(`@UUID[${doc.uuid}]{${doc.name}}`);
  }
  return { ...base, html };
}

/**
 * Prefer the document's own rich embed (dnd5e items, journal pages, roll tables);
 * fall back to an enriched content link.
 */
async function embedOrLink(doc) {
  try {
    const embed = await doc.toEmbed?.(
      { inline: false, caption: false, cite: false, values: [], classes: "" },
      { relativeTo: doc, secrets: true }
    );
    if (embed instanceof HTMLElement) return embed.outerHTML;
    if (embed?.length) return Array.from(embed).map(el => el.outerHTML ?? "").join("");
  } catch (err) {
    console.warn(`${MODULE_ID} | toEmbed failed for ${doc.uuid}`, err);
  }
  return enrich(`@UUID[${doc.uuid}]{${doc.name}}`, doc);
}

async function renderJournalEntry(entry) {
  const pages = [...entry.pages.contents].sort((a, b) => a.sort - b.sort);
  if (!pages.length) return `<p class="gm-empty">${game.i18n.localize("GMTOOLS.Screen.EmptyJournal")}</p>`;
  const parts = [];
  for (const page of pages) {
    const body = await renderJournalPage(page);
    parts.push(`<details open class="gm-journal-page"><summary>${esc(page.name)}</summary><div class="gm-journal-page-body">${body}</div></details>`);
  }
  return parts.join("");
}

async function renderJournalPage(page) {
  if (page.type === "text") return enrich(page.text?.content ?? "", page);
  if (page.type === "image") {
    const caption = page.image?.caption ? `<figcaption>${esc(page.image.caption)}</figcaption>` : "";
    return `<figure class="gm-journal-image"><img src="${esc(page.src)}" alt="${esc(page.name)}">${caption}</figure>`;
  }
  return embedOrLink(page);
}

/**
 * Compact stat card for actors: portrait / name / HP / AC / passive Perception &
 * Insight highlighted up top, then abilities, speed, senses, and the full skill
 * list. No equipment — the full sheet is one click away.
 */
async function renderActorCard(actor) {
  const sys = actor.system ?? {};
  // Not a dnd5e-shaped actor (or a vehicle/group without the usual fields): fall back
  if (!sys.abilities || !sys.attributes) return embedOrLink(actor);

  const hp = sys.attributes.hp ?? {};
  const ac = sys.attributes.ac?.value ?? sys.attributes.ac?.flat ?? "—";

  const abilities = Object.entries(sys.abilities).map(([key, abl]) => ({
    label: (CONFIG.DND5E?.abilities?.[key]?.abbreviation ?? key).toUpperCase(),
    value: abl?.value ?? "—",
    mod: formatMod(abl?.mod)
  }));

  const movement = sys.attributes.movement ?? {};
  const moveUnits = movement.units ?? "ft";
  const speeds = ["walk", "fly", "swim", "climb", "burrow"]
    .filter(k => movement[k])
    .map(k => `${k.capitalize()} ${movement[k]} ${moveUnits}${k === "fly" && movement.hover ? " (hover)" : ""}`)
    .join(", ");

  const senseData = sys.attributes.senses ?? {};
  const senseUnits = senseData.units ?? "ft";
  const senses = ["darkvision", "blindsight", "tremorsense", "truesight"]
    .filter(k => senseData[k])
    .map(k => `${k.capitalize()} ${senseData[k]} ${senseUnits}`)
    .join(", ");

  // Active conditions & status effects (dnd5e models conditions as ActiveEffects)
  const conditions = actor.effects
    .filter(e => !e.disabled && !(e.isSuppressed ?? false))
    .map(e => ({ name: e.name, img: e.img ?? e.icon }));

  const skills = Object.entries(sys.skills ?? {})
    .map(([key, skill]) => ({
      label: CONFIG.DND5E?.skills?.[key]?.label ?? key,
      total: formatMod(skill?.total ?? skill?.mod),
      proficient: (skill?.proficient ?? skill?.value ?? 0) > 0
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  let subtitle = "";
  if (actor.type === "npc") {
    const cr = sys.details?.cr;
    const crLabel = cr === 0.125 ? "⅛" : cr === 0.25 ? "¼" : cr === 0.5 ? "½" : cr;
    const kind = sys.details?.type?.value ? sys.details.type.value.capitalize() : "";
    subtitle = [kind, cr !== undefined && cr !== null ? `CR ${crLabel}` : ""].filter(Boolean).join(" • ");
  } else if (actor.classes && Object.keys(actor.classes).length) {
    subtitle = Object.values(actor.classes)
      .map(c => `${c.name} ${c.system?.levels ?? ""}`.trim())
      .join(" / ");
  }

  return foundry.applications.handlebars.renderTemplate(TEMPLATES.actorCard, {
    uuid: actor.uuid,
    img: actor.img,
    name: actor.name,
    subtitle,
    hp: { value: hp.value ?? "—", max: hp.max ?? "—", temp: hp.temp || 0 },
    ac,
    passivePerception: sys.skills?.prc?.passive ?? "—",
    passiveInsight: sys.skills?.ins?.passive ?? "—",
    conditions,
    abilities,
    speeds,
    senses,
    skills
  });
}
