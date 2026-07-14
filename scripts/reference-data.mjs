/**
 * Static reference content for the GM Screen's Reference tab.
 * D&D 5e conditions carry separate text for the 2014 and 2024 rules; the
 * `rulesVersion` module setting selects which variant is displayed. For other
 * systems, conditions are read from the installed system at runtime and the
 * travel/lighting tables below are used.
 */

import { MODULE_ID } from "./constants.mjs";
import { getSystemConditions } from "./reference/system-conditions.mjs";

export const CONDITIONS = [
  {
    name: "Blinded",
    icon: "fa-solid fa-eye-slash",
    rules: {
      2014: [
        "Can't see; automatically fails any ability check that requires sight.",
        "Attack rolls against the creature have Advantage; its attack rolls have Disadvantage."
      ],
      2024: [
        "Can't see; automatically fails any ability check that requires sight.",
        "Attack rolls against the creature have Advantage; its attack rolls have Disadvantage."
      ]
    }
  },
  {
    name: "Charmed",
    icon: "fa-solid fa-face-grin-hearts",
    rules: {
      2014: [
        "Can't attack the charmer or target them with harmful abilities or magical effects.",
        "The charmer has Advantage on ability checks to interact socially with the creature."
      ],
      2024: [
        "Can't attack the charmer or target them with harmful abilities or magical effects.",
        "The charmer has Advantage on ability checks to interact socially with the creature."
      ]
    }
  },
  {
    name: "Deafened",
    icon: "fa-solid fa-ear-deaf",
    rules: {
      2014: ["Can't hear; automatically fails any ability check that requires hearing."],
      2024: ["Can't hear; automatically fails any ability check that requires hearing."]
    }
  },
  {
    name: "Exhaustion",
    icon: "fa-solid fa-face-downcast-sweat",
    rules: {
      2014: [
        "Level 1: Disadvantage on ability checks.",
        "Level 2: Speed halved.",
        "Level 3: Disadvantage on attack rolls and saving throws.",
        "Level 4: Hit point maximum halved.",
        "Level 5: Speed reduced to 0.",
        "Level 6: Death.",
        "Finishing a long rest with food and drink removes 1 level."
      ],
      2024: [
        "−2 to all d20 Tests (attack rolls, ability checks, saving throws) per level.",
        "Speed reduced by 5 feet per level.",
        "At level 6, the creature dies.",
        "Finishing a long rest removes 1 level."
      ]
    }
  },
  {
    name: "Frightened",
    icon: "fa-solid fa-face-scream",
    rules: {
      2014: [
        "Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.",
        "Can't willingly move closer to the source of its fear."
      ],
      2024: [
        "Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.",
        "Can't willingly move closer to the source of its fear."
      ]
    }
  },
  {
    name: "Grappled",
    icon: "fa-solid fa-hand-fist",
    rules: {
      2014: [
        "Speed is 0 and it can't benefit from bonuses to speed.",
        "Ends if the grappler is Incapacitated, or if the creature is removed from the grappler's reach."
      ],
      2024: [
        "Speed is 0 and it can't benefit from bonuses to speed.",
        "Disadvantage on attack rolls against any target other than the grappler.",
        "The grappler can drag or carry the creature when it moves, at half speed unless the creature is Tiny or two or more sizes smaller.",
        "Ends if the grappler is Incapacitated, or if the creature is removed from the grappler's reach."
      ]
    }
  },
  {
    name: "Incapacitated",
    icon: "fa-solid fa-dizzy",
    rules: {
      2014: ["Can't take actions or reactions."],
      2024: [
        "Can't take any action, Bonus Action, or Reaction.",
        "Concentration is broken.",
        "Can't speak.",
        "If Incapacitated when rolling Initiative, has Disadvantage on the roll."
      ]
    }
  },
  {
    name: "Invisible",
    icon: "fa-solid fa-ghost",
    rules: {
      2014: [
        "Impossible to see without special senses; counts as heavily obscured for the purpose of hiding.",
        "Its location can be detected by noise or tracks.",
        "Attack rolls against the creature have Disadvantage; its attack rolls have Advantage."
      ],
      2024: [
        "Surprise: if Invisible when rolling Initiative, has Advantage on the roll.",
        "Concealed: unaffected by any effect that requires its target to be seen.",
        "Attack rolls against the creature have Disadvantage; its attack rolls have Advantage — unless the attacker can somehow see it."
      ]
    }
  },
  {
    name: "Paralyzed",
    icon: "fa-solid fa-person-falling",
    rules: {
      2014: [
        "Incapacitated; can't move or speak.",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage.",
        "Any hit from an attacker within 5 feet is a critical hit."
      ],
      2024: [
        "Incapacitated; Speed is 0 and can't change.",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage.",
        "Any hit from an attacker within 5 feet is a critical hit."
      ]
    }
  },
  {
    name: "Petrified",
    icon: "fa-solid fa-monument",
    rules: {
      2014: [
        "Transformed into a solid inanimate substance; Incapacitated, can't move or speak, unaware of its surroundings.",
        "Weight increases tenfold; ceases aging.",
        "Attack rolls against it have Advantage; automatically fails Strength and Dexterity saving throws.",
        "Resistance to all damage; immune to poison and disease (existing poison or disease is suspended)."
      ],
      2024: [
        "Transformed into a solid inanimate substance; Incapacitated, can't move or speak, unaware of its surroundings.",
        "Weight increases tenfold; ceases aging.",
        "Attack rolls against it have Advantage; automatically fails Strength and Dexterity saving throws.",
        "Resistance to all damage; immune to the Poisoned condition."
      ]
    }
  },
  {
    name: "Poisoned",
    icon: "fa-solid fa-skull-crossbones",
    rules: {
      2014: ["Disadvantage on attack rolls and ability checks."],
      2024: ["Disadvantage on attack rolls and ability checks."]
    }
  },
  {
    name: "Prone",
    icon: "fa-solid fa-person-praying",
    rules: {
      2014: [
        "Only movement option is to crawl (each foot costs 1 extra foot) unless it stands up.",
        "Disadvantage on attack rolls.",
        "Attacks against it have Advantage if the attacker is within 5 feet, otherwise Disadvantage.",
        "Standing up costs half of its movement speed."
      ],
      2024: [
        "Only movement options are to crawl (each foot costs 1 extra foot) or spend movement to stand.",
        "Disadvantage on attack rolls.",
        "Attacks against it have Advantage if the attacker is within 5 feet, otherwise Disadvantage.",
        "Standing up costs half of its movement speed."
      ]
    }
  },
  {
    name: "Restrained",
    icon: "fa-solid fa-link",
    rules: {
      2014: [
        "Speed is 0 and it can't benefit from bonuses to speed.",
        "Attack rolls against the creature have Advantage; its attack rolls have Disadvantage.",
        "Disadvantage on Dexterity saving throws."
      ],
      2024: [
        "Speed is 0 and it can't benefit from bonuses to speed.",
        "Attack rolls against the creature have Advantage; its attack rolls have Disadvantage.",
        "Disadvantage on Dexterity saving throws."
      ]
    }
  },
  {
    name: "Stunned",
    icon: "fa-solid fa-star",
    rules: {
      2014: [
        "Incapacitated, can't move, and can speak only falteringly.",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage."
      ],
      2024: [
        "Incapacitated (no actions, no speech, concentration broken).",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage.",
        "Movement is not prevented (unlike the 2014 rules)."
      ]
    }
  },
  {
    name: "Unconscious",
    icon: "fa-solid fa-bed",
    rules: {
      2014: [
        "Incapacitated, can't move or speak, unaware of its surroundings.",
        "Drops whatever it's holding and falls Prone.",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage.",
        "Any hit from an attacker within 5 feet is a critical hit."
      ],
      2024: [
        "Has the Incapacitated and Prone conditions; drops whatever it's holding.",
        "Speed is 0; unaware of its surroundings.",
        "Automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have Advantage.",
        "Any hit from an attacker within 5 feet is a critical hit."
      ]
    }
  }
];

export const TRAVEL = {
  paces: [
    { pace: "Fast", minute: "400 ft", hour: "4 miles", day: "30 miles", effect: "−5 penalty to passive Wisdom (Perception)" },
    { pace: "Normal", minute: "300 ft", hour: "3 miles", day: "24 miles", effect: "—" },
    { pace: "Slow", minute: "200 ft", hour: "2 miles", day: "18 miles", effect: "Able to use Stealth" }
  ],
  notes: [
    "A travel day assumes 8 hours on the move.",
    "Forced march: for each hour past 8, each creature makes a Constitution save (DC 10 + 1 per extra hour); on a failure it gains 1 level of Exhaustion.",
    "Difficult terrain: travel at half pace.",
    "Mounts: a mount can gallop at double the fast pace for about an hour."
  ]
};

export const LIGHT_SOURCES = [
  { source: "Candle", bright: "5 ft", dim: "+5 ft", duration: "1 hour" },
  { source: "Torch", bright: "20 ft", dim: "+20 ft", duration: "1 hour" },
  { source: "Lamp", bright: "15 ft", dim: "+30 ft", duration: "6 hours per flask of oil" },
  { source: "Lantern, hooded", bright: "30 ft", dim: "+30 ft", duration: "6 hours (hood lowered: dim light in 5 ft only)" },
  { source: "Lantern, bullseye", bright: "60 ft cone", dim: "+60 ft cone", duration: "6 hours" },
  { source: "Campfire", bright: "20 ft", dim: "+20 ft", duration: "While fueled" },
  { source: "Light (cantrip)", bright: "20 ft", dim: "+20 ft", duration: "1 hour" },
  { source: "Dancing Lights (cantrip)", bright: "—", dim: "10 ft", duration: "1 minute (concentration)" },
  { source: "Produce Flame (cantrip)", bright: "10 ft", dim: "+10 ft", duration: "10 minutes" },
  { source: "Continual Flame (2nd)", bright: "20 ft", dim: "+20 ft", duration: "Permanent" },
  { source: "Daylight (3rd)", bright: "60 ft", dim: "+60 ft", duration: "1 hour" }
];

/**
 * Jumping and other tactical movement. Jump distances are unchanged between the
 * 2014 and 2024 rules, so this content is shared across both versions.
 */
export const MOVEMENT = {
  jumps: [
    {
      type: "Long Jump",
      running: "Distance in feet = your Strength score",
      standing: "Half your Strength score"
    },
    {
      type: "High Jump",
      running: "3 + your Strength modifier (feet)",
      standing: "Half that distance"
    }
  ],
  notes: [
    "A running start needs at least 10 feet of movement on foot beforehand; without it, the jump is a standing jump (half distance).",
    "You can't jump farther than your remaining movement allows.",
    "High jump: you can extend your reach upward by 1½ times your height at the peak of the jump.",
    "Long jump: you can clear a low obstacle no taller than a quarter of the jump's length.",
    "Climbing, swimming, and crawling each cost 1 extra foot per foot moved (2 ft total) — unless you have a climb or swim speed.",
    "The GM may call for an Athletics (Strength) check to climb a slippery or hold-poor surface, or to swim in rough water.",
    "Dropping Prone is free; standing up from Prone costs half your speed."
  ]
};

/**
 * Standard combat actions. Several actions were renamed, added, or reworked in
 * the 2024 rules, so each ruleset has its own list. The Study table is 2024-only.
 */
export const ACTIONS = {
  2014: [
    { name: "Attack", desc: "Make one melee or ranged attack (more with Extra Attack). Grapple and Shove are attack options." },
    { name: "Cast a Spell", desc: "Cast a spell with a casting time of 1 action." },
    { name: "Dash", desc: "Gain extra movement equal to your speed for the turn." },
    { name: "Disengage", desc: "Your movement doesn't provoke opportunity attacks this turn." },
    { name: "Dodge", desc: "Attackers have Disadvantage; you make Dexterity saves with Advantage until your next turn." },
    { name: "Help", desc: "Give an ally Advantage on an ability check, or on their next attack against a creature within 5 ft of you." },
    { name: "Hide", desc: "Make a Dexterity (Stealth) check to become hidden." },
    { name: "Ready", desc: "Prepare an action to trigger on a chosen circumstance (uses your reaction)." },
    { name: "Search", desc: "Devote your attention to finding something — usually a Wisdom (Perception) or Intelligence (Investigation) check." },
    { name: "Use an Object", desc: "Interact with a second object, or use an object that requires an action." }
  ],
  2024: [
    { name: "Attack", desc: "Make one attack (more with Extra Attack). Grapple and Shove are unarmed-strike options." },
    { name: "Dash", desc: "Gain extra movement equal to your speed for the turn." },
    { name: "Disengage", desc: "Your movement doesn't provoke opportunity attacks this turn." },
    { name: "Dodge", desc: "Attackers have Disadvantage; you make Dexterity saves with Advantage. Lost if you're Incapacitated or your speed is 0." },
    { name: "Help", desc: "Aid a task you're proficient in (ally gains Advantage), or give Advantage on an attack against a creature within 5 ft." },
    { name: "Hide", desc: "Make a DC 15 Dexterity (Stealth) check; on a success you gain the Invisible condition." },
    { name: "Influence", desc: "Persuade, deceive, or intimidate a creature. GM sets the check; default DC 15 or the creature's Intelligence, whichever is higher." },
    { name: "Magic", desc: "Cast a spell with a casting time of an action, or use a magic item / feature that requires a Magic action." },
    { name: "Ready", desc: "Prepare an action or spell to trigger on a chosen circumstance (uses your reaction)." },
    { name: "Search", desc: "Make a Wisdom check to find something hidden or discern something — Insight, Medicine, Perception, or Survival." },
    { name: "Study", desc: "Make an Intelligence check to recall or deduce information — see the Study table below." },
    { name: "Utilize", desc: "Use an object (e.g., drink a potion, pull a lever) that requires an action." }
  ],
  studyTable: [
    { skill: "Arcana", use: "Magic items, spells, eldritch symbols, the planes; aberrations, constructs, elementals, fey, monstrosities." },
    { skill: "History", use: "Ancient civilizations, historic events, past wars; giants and humanoids." },
    { skill: "Investigation", use: "Riddles, ciphers, traps, and clues to piece together." },
    { skill: "Nature", use: "Terrain, weather, natural hazards, flora; beasts, dragons, oozes, plants." },
    { skill: "Religion", use: "Deities, holy rites, cults, holy symbols; celestials, fiends, undead." }
  ]
};

/**
 * Pathfinder 2e travel & lighting (Paizo ORC License). Numbers verified against
 * the pf2e system's own equipment/spell compendia. Conditions come from the
 * system at runtime, so they are not duplicated here. Starfinder 2e reuses these.
 */
export const PF2E_TRAVEL = {
  headers: ["Speed", "Feet / Minute", "Miles / Hour", "Miles / Day"],
  rows: [
    ["10 ft", "100 ft", "1 mile", "8 miles"],
    ["15 ft", "150 ft", "1½ miles", "12 miles"],
    ["20 ft", "200 ft", "2 miles", "16 miles"],
    ["25 ft", "250 ft", "2½ miles", "20 miles"],
    ["30 ft", "300 ft", "3 miles", "24 miles"],
    ["35 ft", "350 ft", "3½ miles", "28 miles"],
    ["40 ft", "400 ft", "4 miles", "32 miles"]
  ],
  notes: [
    "A full day of travel assumes 8 hours on the move; pressing on longer risks fatigue.",
    "Hustle: move at double your travel Speed for a number of minutes equal to 10 × your Constitution modifier (minimum 10), then rest before hustling again.",
    "Difficult terrain slows overland travel — the GM sets the reduction."
  ]
};

export const PF2E_LIGHT = {
  headers: ["Source", "Bright", "Dim", "Duration"],
  rows: [
    ["Candle", "—", "10 ft", "8 hours"],
    ["Torch", "20 ft", "+20 ft", "1 hour"],
    ["Lantern (Hooded)", "30 ft", "+30 ft", "6 hours per pint of oil; shutters dim or close it"],
    ["Lantern (Bull's-Eye)", "60-ft cone", "+60 ft", "6 hours per pint of oil"],
    ["Light (cantrip)", "20 ft", "+20 ft", "Until next daily preparations"]
  ]
};

/** Starfinder 2e light is sci-fi (flashlights, not torches). Values from the sf2e compendia. */
export const SF2E_LIGHT = {
  headers: ["Source", "Bright", "Dim", "Duration"],
  rows: [
    ["Flashlight (Commercial)", "30 ft", "+30 ft", "While powered"],
    ["Flashlight (Tactical)", "60 ft", "+60 ft", "While powered; filters dim or block it"],
    ["Light (cantrip)", "20 ft", "+20 ft", "Until next daily preparations"]
  ]
};

const t = key => game.i18n.localize(`GMTOOLS.Reference.${key}`);

// Section "blocks" — the template renders each by its boolean flag. Keeping the
// .gm-ref-* classes on rendered nodes preserves the filter (#filterReference).
const conditionsBlock = entries => ({ isConditions: true, entries });
const tableBlock = (headers, rows, notes = []) => ({ isTable: true, headers, rows, notes });
const deflistBlock = entries => ({ isDeflist: true, entries });
const subheadBlock = text => ({ isSubhead: true, text });
const noteBlock = text => ({ isNote: true, text });

function dnd5eSections(rulesVersion) {
  const version = ACTIONS[rulesVersion] ? rulesVersion : "2024";
  const conditions = CONDITIONS.map(c => ({
    name: c.name,
    icon: c.icon,
    effects: c.rules[rulesVersion] ?? c.rules["2024"]
  }));
  return [
    { id: "conditions", icon: "fa-solid fa-heart-crack", title: t("Conditions"), blocks: [conditionsBlock(conditions)] },
    { id: "travel", icon: "fa-solid fa-route", title: t("Travel"), blocks: [
      tableBlock([t("Pace"), t("PerMinute"), t("PerHour"), t("PerDay"), t("Effect")],
        TRAVEL.paces.map(p => [p.pace, p.minute, p.hour, p.day, p.effect]), TRAVEL.notes)
    ] },
    { id: "movement", icon: "fa-solid fa-person-running", title: t("Movement"), blocks: [
      tableBlock([t("Jump"), t("RunningStart"), t("Standing")],
        MOVEMENT.jumps.map(j => [j.type, j.running, j.standing]), MOVEMENT.notes)
    ] },
    { id: "actions", icon: "fa-solid fa-hand-fist", title: t("Actions"), blocks: [
      deflistBlock(ACTIONS[version].map(a => ({ name: a.name, desc: a.desc }))),
      ...(version === "2024"
        ? [subheadBlock(t("StudyTable")), tableBlock([t("Skill"), t("UsedFor")], ACTIONS.studyTable.map(s => [s.skill, s.use]))]
        : [])
    ] },
    { id: "light", icon: "fa-solid fa-fire", title: t("Light"), blocks: [
      tableBlock([t("Source"), t("Bright"), t("Dim"), t("Duration")], LIGHT_SOURCES.map(l => [l.source, l.bright, l.dim, l.duration]))
    ] }
  ];
}

async function paizo2eSections(systemId) {
  const conditions = await getSystemConditions();
  const light = systemId === "sf2e" ? SF2E_LIGHT : PF2E_LIGHT; // Starfinder is sci-fi
  return [
    { id: "conditions", icon: "fa-solid fa-heart-crack", title: t("Conditions"), blocks: [conditionsBlock(conditions)] },
    { id: "travel", icon: "fa-solid fa-route", title: t("Travel"), blocks: [
      tableBlock(PF2E_TRAVEL.headers, PF2E_TRAVEL.rows, PF2E_TRAVEL.notes)
    ] },
    { id: "light", icon: "fa-solid fa-fire", title: t("Light"), blocks: [
      tableBlock(light.headers, light.rows, light.notes)
    ] }
  ];
}

async function fallbackSections() {
  const conditions = await getSystemConditions();
  const blocks = conditions.length ? [conditionsBlock(conditions)] : [];
  blocks.push(noteBlock(t("SystemUnsupportedNote")));
  return [{ id: "conditions", icon: "fa-solid fa-heart-crack", title: t("Conditions"), blocks }];
}

// System ids that use the Paizo 2e reference (conditions from system + PF2e tables).
const PAIZO_2E = new Set(["pf2e", "sf2e", "starfinder-2e", "starfinder2e"]);

/**
 * Assemble the Reference tab as a list of sections for the active game system.
 * dnd5e uses the curated bundle (with the 2014/2024 toggle); Paizo 2e systems
 * read conditions from the system + the authored travel/light tables; any other
 * system gets conditions from CONFIG.statusEffects plus a "not fully supported" note.
 */
export async function getReferenceData() {
  const systemId = game.system?.id ?? "";
  if (systemId === "dnd5e") {
    return { systemId, sections: dnd5eSections(game.settings.get(MODULE_ID, "rulesVersion")) };
  }
  if (PAIZO_2E.has(systemId)) {
    return { systemId, sections: await paizo2eSections(systemId) };
  }
  return { systemId, sections: await fallbackSections() };
}
