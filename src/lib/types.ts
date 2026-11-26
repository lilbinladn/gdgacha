export type Difficulty = "Easy" | "Medium" | "Hard" | "Insane" | "Extreme";

export type Level = {
  id: number;
  name: string;
  author: string;
  difficulty: Difficulty;
  /** GDDL tier rating (community difficulty score, higher = harder). */
  tier: number;
  /** YouTube showcase video id (11 chars), used for the card thumbnail. */
  yt: string | null;
  /** AREDL leaderboard position, only for listed Extreme Demons. */
  aredl: number | null;
  /** AREDL points for the position. */
  points: number | null;
  /** GDDL community enjoyment out of 10. */
  enjoyment: number;
  desc: string | null;
};

/** One physical card in the player's collection. */
export type CardInstance = {
  uid: string;
  levelId: number;
  rarity: number;
  holo: boolean;
  at: number;
};

export type OwnedCard = {
  count: number;
  holo: boolean;
  firstAt: number;
};

export type SaveData = {
  version: number;
  packs: number;
  lastPackAt: number;
  packsOpened: number;
  owned: Record<string, OwnedCard>;
  recent: CardInstance[];
  createdAt: number;
};

export type Pull = { card: CardInstance; isNew: boolean };
