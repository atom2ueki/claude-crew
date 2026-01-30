/**
 * Avatar Service
 * Generates randomized avatar configurations using DiceBear Notionists style
 */

import { randomInt } from 'crypto';

// Avatar variant pools - inline to support both ESM and CJS bundling
const POOLS = {
  "hair": {
    "masculine": [
      "variant01", "variant04", "variant05", "variant06", "variant12",
      "variant13", "variant15", "variant16", "variant17", "variant19",
      "variant21", "variant26", "variant31", "variant33", "variant34",
      "variant40", "variant42", "variant43", "variant44", "variant50",
      "variant51", "variant52", "variant53", "variant56", "variant60",
      "variant61"
    ],
    "feminine": [
      "variant02", "variant03", "variant07", "variant08", "variant09",
      "variant10", "variant11", "variant14", "variant18", "variant20",
      "variant22", "variant23", "variant24", "variant25", "variant27",
      "variant28", "variant29", "variant30", "variant32", "variant35",
      "variant36", "variant37", "variant38", "variant39", "variant41",
      "variant45", "variant46", "variant47", "variant48", "variant49",
      "variant54", "variant55", "variant57", "variant58", "variant59",
      "variant62", "variant63"
    ]
  },
  "brows": {
    "masculine": ["variant01", "variant04", "variant06", "variant09"],
    "feminine": ["variant07", "variant10", "variant12"],
    "unisex": ["variant02", "variant03", "variant05", "variant08", "variant11", "variant13"]
  },
  "body": {
    "masculine": [
      "variant01", "variant03", "variant04", "variant05", "variant08",
      "variant09", "variant17", "variant20"
    ],
    "feminine": [
      "variant13", "variant16", "variant19", "variant21", "variant22",
      "variant23", "variant24"
    ],
    "unisex": [
      "variant02", "variant06", "variant07", "variant10", "variant11",
      "variant12", "variant14", "variant15", "variant18", "variant25"
    ]
  },
  "glasses": {
    "sunglasses": ["variant01", "variant02", "variant04", "variant05", "variant09", "variant10"],
    "regular": ["variant03", "variant06", "variant07", "variant08", "variant11"],
    "all": [
      "variant01", "variant02", "variant03", "variant04", "variant05",
      "variant06", "variant07", "variant08", "variant09", "variant10",
      "variant11"
    ]
  },
  "lips": {
    "masculine": ["variant08", "variant10", "variant11", "variant13", "variant14", "variant19"],
    "feminine": [
      "variant01", "variant02", "variant03", "variant04", "variant05",
      "variant06", "variant07", "variant09", "variant12", "variant15",
      "variant16", "variant17", "variant18", "variant20"
    ]
  },
  "beard": [
    "variant01", "variant02", "variant03", "variant04", "variant05",
    "variant06", "variant07", "variant08", "variant09", "variant10",
    "variant11", "variant12"
  ],
  "eyes": [
    "variant01", "variant02", "variant03", "variant04", "variant05"
  ],
  "nose": [
    "variant01", "variant02", "variant03", "variant04", "variant05",
    "variant06", "variant07", "variant08", "variant09", "variant10",
    "variant11", "variant12", "variant13", "variant14", "variant15",
    "variant16", "variant17", "variant18", "variant19", "variant20"
  ]
};

/**
 * Get the avatar pools data
 * @returns {object} - The avatar pools object
 */
export function getAvatarPools() {
  return POOLS;
}

/**
 * Pick a random element from an array using crypto for true randomness
 * @param {Array} arr - Array to pick from
 * @returns {*} - Random element
 */
function pickRandom(arr) {
  return arr[randomInt(arr.length)];
}

/**
 * Validate and normalize gender value
 * @param {string} gender - The gender from LLM
 * @returns {string} - 'male' or 'female'
 */
export function validateGender(gender) {
  const normalized = (gender || '').toLowerCase().trim();
  if (normalized === 'male' || normalized === 'm') return 'male';
  if (normalized === 'female' || normalized === 'f') return 'female';
  // Invalid gender - randomly assign
  return randomInt(2) === 0 ? 'male' : 'female';
}

/**
 * Generate avatar configuration based on gender and LLM-provided probabilities
 * LLM decides: gender, glassesProbability, beardProbability
 * Script decides: random selection from gender-appropriate pools
 *
 * @param {string} gender - 'male' or 'female' (from LLM)
 * @param {object} options - Optional probabilities from LLM
 * @param {number} options.glassesProbability - 0-100 chance of glasses
 * @param {number} options.beardProbability - 0-100 chance of beard (males only)
 * @returns {object} - Avatar configuration object
 */
export function generateAvatar(gender, options = {}) {
  const isMale = gender === 'male';

  // Gender-based selections from pools
  const hair = pickRandom(isMale ? POOLS.hair.masculine : POOLS.hair.feminine);

  const bodyPool = isMale
    ? [...POOLS.body.masculine, ...POOLS.body.unisex]
    : [...POOLS.body.feminine, ...POOLS.body.unisex];
  const body = pickRandom(bodyPool);

  const browsPool = isMale
    ? [...POOLS.brows.masculine, ...POOLS.brows.unisex]
    : [...POOLS.brows.feminine, ...POOLS.brows.unisex];
  const brows = pickRandom(browsPool);

  // Lips: females only get clean lips (no chin dots)
  const lips = pickRandom(isMale
    ? [...POOLS.lips.masculine, ...POOLS.lips.feminine]
    : POOLS.lips.feminine
  );

  // Unisex features
  const nose = pickRandom(POOLS.nose);
  const eyes = pickRandom(POOLS.eyes);
  const glasses = pickRandom(POOLS.glasses.all);

  // Beard: only for males
  const beard = isMale ? pickRandom(POOLS.beard) : null;

  // Probabilities from LLM (with defaults)
  const glassesProbability = options.glassesProbability ?? 0;
  const beardProbability = isMale ? (options.beardProbability ?? 0) : 0;

  return {
    hair,
    body,
    brows,
    eyes,
    lips,
    nose,
    beard,
    glasses,
    beardProbability,
    glassesProbability
  };
}

/**
 * Build a comprehensive DiceBear avatar URL with all parameters
 * @param {string} seed - The seed string (typically displayName)
 * @param {object} avatar - The avatar configuration object
 * @returns {string} - The complete DiceBear avatar URL
 */
export function buildAvatarUrl(seed, avatar) {
  const params = new URLSearchParams({
    seed: seed,
    size: 400,  // Match rendered size (AVATAR_SIZE * SCALE) for crisp output
    hair: avatar.hair,
    body: avatar.body,
    brows: avatar.brows,
    eyes: avatar.eyes,
    lips: avatar.lips,
    nose: avatar.nose,
    glassesProbability: avatar.glassesProbability ?? 0,
    gestureProbability: 0  // Gestures disabled
  });

  // Beard: only include for males (beardProbability > 0)
  if (avatar.beardProbability > 0) {
    params.set('beardProbability', avatar.beardProbability);
    if (avatar.beard) params.set('beard', avatar.beard);
  } else {
    params.set('beardProbability', 0);
  }

  // Optional parameters
  if (avatar.glasses) params.set('glasses', avatar.glasses);

  return `https://api.dicebear.com/9.x/notionists/svg?${params}`;
}
