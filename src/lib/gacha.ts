import { CARDS_PER_PACK } from "./storage";
import { LEVELS_BY_RARITY } from "./levels";
import { RARITIES } from "./rarity";
import type { CardInstance } from "./types";

const HOLO_CHANCE = 0.08;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Weighted rarity roll; `min` forces at least that rarity (used for the rare slot). */
function rollRarity(min = 0): number {
  const pool = RARITIES.filter((rarity) => rarity.id >= min);
  const total = pool.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;
  for (const rarity of pool) {
    roll -= rarity.weight;
    if (roll <= 0) return rarity.id;
  }
  return pool[pool.length - 1].id;
}

export function rollCard(minRarity = 0): CardInstance {
  let rarity = rollRarity(minRarity);
  while (rarity > 0 && LEVELS_BY_RARITY[rarity].length === 0) rarity -= 1;
  const bucket = LEVELS_BY_RARITY[rarity];
  const level = bucket[Math.floor(Math.random() * bucket.length)];
  return {
    uid: uid(),
    levelId: level.id,
    rarity,
    holo: Math.random() < HOLO_CHANCE,
    at: Date.now(),
  };
}

/**
 * A pack is five cards. The last slot is guaranteed Rare or better, and the
 * pack is sorted worst-first so the reveal builds towards the best pull.
 */
export function rollPack(): CardInstance[] {
  const cards: CardInstance[] = [];
  for (let i = 0; i < CARDS_PER_PACK; i++) {
    cards.push(rollCard(i === CARDS_PER_PACK - 1 ? 2 : 0));
  }
  return cards.sort((a, b) => a.rarity - b.rarity);
}

/** Odds shown in the UI, derived from the same weights the roller uses. */
export function rarityOdds(): { rarity: number; chance: number }[] {
  const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
  return RARITIES.map((rarity) => ({
    rarity: rarity.id,
    chance: (rarity.weight / total) * 100,
  }));
}
