/**
 * Static reference content for the GM Screen's Reference tab.
 * Conditions carry separate text for the 2014 and 2024 D&D rules; the
 * `rulesVersion` module setting selects which variant is displayed.
 */

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
 * Assemble the Reference tab data for the requested rules version ("2014" or "2024").
 */
export function getReferenceData(rulesVersion) {
  return {
    conditions: CONDITIONS.map(c => ({
      name: c.name,
      icon: c.icon,
      effects: c.rules[rulesVersion] ?? c.rules["2024"]
    })),
    travel: TRAVEL,
    light: LIGHT_SOURCES
  };
}
