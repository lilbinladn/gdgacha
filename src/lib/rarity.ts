import type { CSSProperties } from "react";

/**
 * Card rarities, from most to least common.
 * `weight` is the pack roll weight (out of 100) used by the gacha.
 */
export type RarityMeta = {
  id: number;
  name: string;
  color: string;
  soft: string;
  weight: number;
  blurb: string;
};

export const RARITIES: RarityMeta[] = [
  {
    id: 0,
    name: "Common",
    color: "#9aa3b8",
    soft: "#3a4050",
    weight: 40,
    blurb: "The demon you have already beaten twice.",
  },
  {
    id: 1,
    name: "Uncommon",
    color: "#4ade80",
    soft: "#1c5a3a",
    weight: 25,
    blurb: "A solid medium demon with a few good parts.",
  },
  {
    id: 2,
    name: "Rare",
    color: "#60a5fa",
    soft: "#1d3f6e",
    weight: 17,
    blurb: "Hard demon energy. Practice mode required.",
  },
  {
    id: 3,
    name: "Epic",
    color: "#c084fc",
    soft: "#472a72",
    weight: 10,
    blurb: "Insane demon. Send this one to a friend.",
  },
  {
    id: 4,
    name: "Legendary",
    color: "#fbbf24",
    soft: "#6b4a10",
    weight: 6,
    blurb: "Extreme demon. Genuinely painful to play.",
  },
  {
    id: 5,
    name: "Mythic",
    color: "#fb7185",
    soft: "#6d1f33",
    weight: 1.8,
    blurb: "AREDL top 300. The ceiling of human skill.",
  },
  {
    id: 6,
    name: "Celestial",
    color: "#67e8f9",
    soft: "#0f5a68",
    weight: 0.2,
    blurb: "AREDL top 50. Basically impossible.",
  },
];

export const RARITY_MAX = RARITIES.length - 1;

export const rarityMeta = (id: number): RarityMeta =>
  RARITIES[Math.max(0, Math.min(RARITY_MAX, id))];

export const rarityStyle = (id: number): CSSProperties => {
  const meta = rarityMeta(id);
  return { "--r": meta.color, "--r-soft": meta.soft } as CSSProperties;
};
