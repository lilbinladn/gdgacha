import raw from "../data/levels.json";
import type { Difficulty, Level } from "./types";

type Dataset = {
  generatedAt: string;
  counts: Record<string, number>;
  sources: { name: string; url: string; note: string }[];
  levels: Level[];
};

const dataset = raw as unknown as Dataset;

export const LEVELS: Level[] = dataset.levels;
export const GENERATED_AT = dataset.generatedAt;
export const SOURCES = dataset.sources;
export const LEVEL_BY_ID = new Map<number, Level>(LEVELS.map((level) => [level.id, level]));

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Insane", "Extreme"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  Easy: "Easy Demon",
  Medium: "Medium Demon",
  Hard: "Hard Demon",
  Insane: "Insane Demon",
  Extreme: "Extreme Demon",
};

/** Short, punchy label used inside badges. */
export const DIFFICULTY_SHORT: Record<Difficulty, string> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
  Insane: "INSANE",
  Extreme: "EXTREME",
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "#38bdf8",
  Medium: "#34d399",
  Hard: "#facc15",
  Insane: "#fb923c",
  Extreme: "#f43f5e",
};

/** Card rarity per level, derived from difficulty, GDDL tier and AREDL rank. */
export const RARITY_BY_LEVEL = new Map<number, number>();

const BASE_RARITY: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  Insane: 3,
  Extreme: 4,
};

for (const difficulty of DIFFICULTIES) {
  const bucket = LEVELS.filter((level) => level.difficulty === difficulty).sort(
    (a, b) => a.tier - b.tier,
  );
  bucket.forEach((level, index) => {
    const percentile = bucket.length > 1 ? index / (bucket.length - 1) : 1;
    let rarity = BASE_RARITY[difficulty];
    // The hardest few percent of each difficulty get bumped up a tier.
    if (percentile >= 0.97) rarity += 1;
    if (level.aredl != null) {
      if (level.aredl <= 50) rarity = 6;
      else if (level.aredl <= 300) rarity = Math.max(rarity, 5);
    }
    RARITY_BY_LEVEL.set(level.id, Math.min(6, rarity));
  });
}

export const rarityOf = (levelId: number): number => RARITY_BY_LEVEL.get(levelId) ?? 0;

/** Levels grouped by rarity, used as the pull table. */
export const LEVELS_BY_RARITY: Level[][] = Array.from({ length: 7 }, () => []);
for (const level of LEVELS) {
  LEVELS_BY_RARITY[rarityOf(level.id)].push(level);
}

export const TOTAL_LEVELS = LEVELS.length;

export function searchLevels(query: string, limit = Infinity): Level[] {
  const q = query.trim().toLowerCase();
  if (!q) return LEVELS.slice(0, limit);
  const out: Level[] = [];
  for (const level of LEVELS) {
    if (level.name.toLowerCase().includes(q) || level.author.toLowerCase().includes(q)) {
      out.push(level);
      if (out.length >= limit) break;
    }
  }
  return out;
}
