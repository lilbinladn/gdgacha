import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  avatarUrl,
  clearSession,
  completeDiscordLogin,
  displayName,
  loadSession,
  persistSession,
  type Session,
} from "../lib/auth";
import { rollPack } from "../lib/gacha";
import { matchesOwner } from "../lib/owner";
import { accrue, emptySave, getGuestId, loadSave, MAX_PACKS, PACK_INTERVAL_MS, persistSave } from "../lib/storage";
import type { Pull, SaveData } from "../lib/types";

const EMPTY_SAVE = emptySave();

type GameValue = {
  booting: boolean;
  authError: string | null;
  clearAuthError: () => void;
  session: Session | null;
  playerName: string;
  playerAvatar: string | null;
  save: SaveData;
  now: number;
  packs: number;
  isFull: boolean;
  nextPackAt: number;
  ownedCount: number;
  holoCount: number;
  totalCards: number;
  isOwner: boolean;
  openPacks: (count: number) => Pull[];
  grantPacks: (count: number) => void;
  signOut: () => void;
  resetProgress: () => void;
};

const GameContext = createContext<GameValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [guestId] = useState(() => getGuestId());
  const [save, setSave] = useState<SaveData | null>(null);
  const loadedFor = useRef<string | null>(null);

  const profileId = session?.user.id ?? guestId;

  // Finish a Discord redirect once, on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await completeDiscordLogin();
        if (next && !cancelled) {
          persistSession(next);
          setSession(next);
        }
      } catch (err) {
        if (!cancelled) {
          setAuthError(err instanceof Error ? err.message : "Discord sign-in failed.");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the save belonging to the active profile (Discord account or guest).
  useEffect(() => {
    const loaded = loadSave(profileId);
    loadedFor.current = profileId;
    setSave(loaded);
  }, [profileId]);

  // Persist after the correct profile's save has been loaded.
  useEffect(() => {
    if (!save || loadedFor.current !== profileId) return;
    persistSave(profileId, save);
  }, [save, profileId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Hand out packs earned while away.
  useEffect(() => {
    setSave((prev) => {
      if (!prev) return prev;
      const next = accrue(prev, now);
      return next === prev ? prev : next;
    });
  }, [now]);

  const openPacks = useCallback(
    (count: number): Pull[] => {
      const current = save;
      if (!current) return [];
      const opening = Math.min(count, current.packs);
      if (opening <= 0) return [];

      const pulls: Pull[] = [];
      const owned = { ...current.owned };
      const recent = [...current.recent];

      for (let pack = 0; pack < opening; pack++) {
        for (const card of rollPack()) {
          const key = String(card.levelId);
          const existing = owned[key];
          pulls.push({ card, isNew: !existing });
          owned[key] = existing
            ? { ...existing, count: existing.count + 1, holo: existing.holo || card.holo }
            : { count: 1, holo: card.holo, firstAt: card.at };
          recent.unshift(card);
        }
      }

      const wasFull = current.packs >= MAX_PACKS;
      setSave({
        ...current,
        packs: current.packs - opening,
        packsOpened: current.packsOpened + opening,
        owned,
        recent: recent.slice(0, 60),
        // Leaving a full storage restarts the earn timer.
        lastPackAt: wasFull ? Date.now() : current.lastPackAt,
      });

      return pulls;
    },
    [save],
  );

  const owner = useMemo(() => matchesOwner(session?.user ?? null), [session]);

  // Owner-only: top up packs on demand, ignoring the earn timer and the cap.
  const grantPacks = useCallback((count: number) => {
    setSave((prev) => {
      if (!prev || count <= 0) return prev;
      return {
        ...prev,
        packs: prev.packs + count,
        // Overflowing the normal cap restarts the earn timer, as opening does.
        lastPackAt: prev.packs >= MAX_PACKS ? Date.now() : prev.lastPackAt,
      };
    });
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const resetProgress = useCallback(() => {
    setSave(emptySave());
  }, []);

  const value = useMemo<GameValue>(() => {
    const safeSave = save ?? EMPTY_SAVE;
    const ownedKeys = Object.keys(safeSave.owned);
    // The owner has no storage cap.
    const cap = owner ? Number.POSITIVE_INFINITY : MAX_PACKS;
    return {
      booting,
      authError,
      clearAuthError: () => setAuthError(null),
      session,
      playerName: session ? displayName(session.user) : "Guest",
      playerAvatar: session ? avatarUrl(session.user) : null,
      save: safeSave,
      now,
      packs: safeSave.packs,
      isFull: safeSave.packs >= cap,
      nextPackAt:
        safeSave.packs >= cap ? 0 : safeSave.lastPackAt + PACK_INTERVAL_MS,
      ownedCount: ownedKeys.length,
      holoCount: ownedKeys.filter((key) => safeSave.owned[key]?.holo).length,
      totalCards: ownedKeys.reduce((sum, key) => sum + (safeSave.owned[key]?.count ?? 0), 0),
      isOwner: owner,
      openPacks,
      grantPacks,
      signOut,
      resetProgress,
    };
  }, [authError, booting, grantPacks, now, openPacks, owner, resetProgress, save, session, signOut]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside <GameProvider>");
  return value;
}
