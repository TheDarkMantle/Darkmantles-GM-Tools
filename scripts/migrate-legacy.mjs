import { MODULE_ID, LEGACY_MODULE_ID } from "./constants.mjs";

/**
 * One-time migration from the module's pre-rename id ("gm-tools" / "GM Tools")
 * to MODULE_ID. World data (glossary, session notes, screen layout, …) lives in
 * Setting documents keyed "gm-tools.<key>"; client preferences live in
 * localStorage under the same keys. Each value is copied to the new namespace
 * only when the new key has no stored value yet, so the migration is idempotent
 * and never overwrites anything the user changed after renaming. Legacy data is
 * left in place (harmless; allows rolling back to the old module).
 */
export async function migrateLegacyData() {
  const migrated = { world: 0, client: 0 };
  const prefixOld = `${LEGACY_MODULE_ID}.`;

  // --- Client settings (per browser, from localStorage) ---
  try {
    const storage = game.settings.storage.get("client");
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(prefixOld)) continue;
      const suffix = key.slice(prefixOld.length);
      if (!game.settings.settings.has(`${MODULE_ID}.${suffix}`)) continue;
      const newKey = `${MODULE_ID}.${suffix}`;
      if (storage.getItem(newKey) !== null) continue; // already has a value
      storage.setItem(newKey, storage.getItem(key));  // same JSON encoding
      migrated.client++;
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Client-setting migration failed:`, err);
  }

  // --- World settings (Setting documents; GM only) ---
  if (game.user.isGM) {
    try {
      const world = game.settings.storage.get("world");
      const hasNew = suffix => world.some(s => s.key === `${MODULE_ID}.${suffix}`);
      for (const doc of [...world]) {
        if (!doc.key?.startsWith(prefixOld)) continue;
        const suffix = doc.key.slice(prefixOld.length);
        if (!game.settings.settings.has(`${MODULE_ID}.${suffix}`)) continue;
        if (hasNew(suffix)) continue; // already has a value
        let value = doc.value;
        try { value = JSON.parse(doc.value); } catch { /* raw string value */ }
        await game.settings.set(MODULE_ID, suffix, value);
        migrated.world++;
      }
    } catch (err) {
      console.error(`${MODULE_ID} | World-setting migration failed:`, err);
    }
  }

  if (migrated.world || migrated.client) {
    console.log(`${MODULE_ID} | Migrated legacy GM Tools data (${migrated.world} world, ${migrated.client} client settings).`);
    if (game.user.isGM && migrated.world) {
      ui.notifications.info(game.i18n.localize("GMTOOLS.Migrated"));
    }
  }
  return migrated;
}
