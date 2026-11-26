import type { SaveData } from "./types";

const SAVE_PREFIX = "demon-gacha:save:v1:";
const GUEST_KEY = "demon-gacha:guest-id";

export const PACK_INTERVAL_MS = 3 * 60 * 1000;
export const MAX_PACKS = 10;
export const CARDS_PER_PACK = 5;

export function emptySave(): SaveData {
  return {
    version: 1,
    packs: 1, // a fresh account gets one pack to open straight away
    lastPackAt: Date.now(),
    packsOpened: 0,
    owned: {},
    recent: [],
    createdAt: Date.now(),
  };
}

export function loadSave(profileId: string): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + profileId);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...emptySave(),
      ...parsed,
      owned: parsed.owned ?? {},
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return emptySave();
  }
}

export function persistSave(profileId: string, save: SaveData) {
  try {
    localStorage.setItem(SAVE_PREFIX + profileId, JSON.stringify(save));
  } catch {
    // Storage full or blocked (private mode) — the session still works in memory.
  }
}

export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `guest-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return "guest-local";
  }
}

/**
 * Hands out every pack earned since the last check (one per PACK_INTERVAL_MS,
 * capped at MAX_PACKS). Time spent away from the site counts, so the timer
 * keeps running in the background.
 */
export function accrue(save: SaveData, now: number): SaveData {
  if (save.packs >= MAX_PACKS) return save;
  const elapsed = now - save.lastPackAt;
  if (elapsed < PACK_INTERVAL_MS) return save;

  const gained = Math.floor(elapsed / PACK_INTERVAL_MS);
  const packs = Math.min(MAX_PACKS, save.packs + gained);
  const lastPackAt =
    packs >= MAX_PACKS ? now : save.lastPackAt + gained * PACK_INTERVAL_MS;

  return { ...save, packs, lastPackAt };
}
