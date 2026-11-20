/**
 * Which D&D 5e rules the world uses, read from the dnd5e system's own
 * "rulesVersion" world setting ("modern" = 2024, "legacy" = 2014). Changing
 * that setting reloads Foundry, so reading it on demand is always current.
 * Returns null outside dnd5e.
 */
export function getDnd5eRulesVersion() {
  if (game.system?.id !== "dnd5e") return null;
  try {
    return game.settings.get("dnd5e", "rulesVersion") === "legacy" ? "2014" : "2024";
  } catch {
    return "2024"; // setting missing (very old dnd5e): its default is modern
  }
}
