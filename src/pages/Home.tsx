import { useMemo, useState } from "react";
import { CardModal } from "../components/CardModal";
import { RevealOverlay } from "../components/RevealOverlay";
import { CardTile, PackArt, ProgressBar } from "../components/ui";
import { formatCountdown, formatNumber, formatPercent, percent } from "../lib/format";
import { rarityOdds } from "../lib/gacha";
import { LEVEL_BY_ID, TOTAL_LEVELS } from "../lib/levels";
import { rarityMeta, rarityStyle } from "../lib/rarity";
import type { Route } from "../lib/router";
import { MAX_PACKS } from "../lib/storage";
import type { CardInstance, Level, Pull } from "../lib/types";
import { useGame } from "../state/GameContext";

export function Home({ navigate }: { navigate: (route: Route) => void }) {
  const {
    packs,
    isFull,
    nextPackAt,
    now,
    openPacks,
    save,
    ownedCount,
    holoCount,
    totalCards,
    session,
    playerName,
  } = useGame();
  const [pulls, setPulls] = useState<Pull[] | null>(null);
  const [detail, setDetail] = useState<number | null>(null);

  const odds = useMemo(() => rarityOdds(), []);

  const recent = useMemo(() => {
    const rows: { card: CardInstance; level: Level }[] = [];
    for (const card of save.recent) {
      const level = LEVEL_BY_ID.get(card.levelId);
      if (level) rows.push({ card, level });
      if (rows.length >= 12) break;
    }
    return rows;
  }, [save.recent]);

  const handleOpen = (count: number) => {
    const result = openPacks(count);
    if (result.length) setPulls(result);
  };

  return (
    <div className="page">
      <section className="panel hero">
        <div className="hero__left">
          <p className="eyebrow">Packs available</p>
          <p className="hero__count">
            <strong>{packs}</strong>
            <span>/{MAX_PACKS}</span>
          </p>
          <p className="hero__hint">
            One pack every 3 minutes, up to {MAX_PACKS} stored. The timer runs on the clock, so
            packs are waiting even when you are away.
          </p>
        </div>

        <div className="hero__mid">
          <PackArt dim={packs === 0} />
          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              disabled={packs === 0}
              onClick={() => handleOpen(1)}
            >
              Open pack
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--lg"
              disabled={packs < 2}
              onClick={() => handleOpen(packs)}
            >
              Open all ({packs})
            </button>
          </div>
        </div>

        <div className="hero__right">
          <div className={`storage-chip${isFull ? " is-full" : ""}`}>
            {isFull ? "Pack storage full" : `${MAX_PACKS - packs} slots free`}
          </div>
          <p className="hero__next">
            {isFull ? (
              "Open a pack to start earning again."
            ) : (
              <>
                Next pack in <strong>{formatCountdown(nextPackAt - now)}</strong>
              </>
            )}
          </p>
          <ul className="hero__list">
            <li>5 cards per pack</li>
            <li>Last card is Rare or better</li>
            <li>8% chance a card is Holo</li>
          </ul>
          {session ? (
            <p className="hero__signed">
              Playing as <strong>{playerName}</strong>
            </p>
          ) : (
            <p className="hero__signed hero__signed--guest">
              Guest progress is saved on this device. Sign in with Discord to tie it to your
              account.
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Collection progress</h2>
          <button type="button" className="link" onClick={() => navigate("collection")}>
            Open collection
          </button>
        </div>
        <ProgressBar value={ownedCount} max={TOTAL_LEVELS} />
        <div className="stat-grid">
          <div className="stat">
            <strong>{formatPercent(percent(ownedCount, TOTAL_LEVELS))}</strong>
            <span>
              Completion ({formatNumber(ownedCount)}/{formatNumber(TOTAL_LEVELS)})
            </span>
          </div>
          <div className="stat">
            <strong>{formatNumber(totalCards)}</strong>
            <span>Cards owned</span>
          </div>
          <div className="stat">
            <strong>{formatPercent(percent(holoCount, TOTAL_LEVELS))}</strong>
            <span>
              Holo ({formatNumber(holoCount)}/{formatNumber(TOTAL_LEVELS)})
            </span>
          </div>
          <div className="stat">
            <strong>{formatNumber(save.packsOpened)}</strong>
            <span>Packs opened</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Rarity odds</h2>
          <span className="muted">Per card, before the guaranteed slot</span>
        </div>
        <div className="odds">
          {odds.map(({ rarity, chance }) => (
            <div key={rarity} className="odds__item" style={rarityStyle(rarity)}>
              <span className="odds__dot" />
              <span className="odds__name">{rarityMeta(rarity).name}</span>
              <span className="odds__chance">{chance.toFixed(chance < 1 ? 1 : 0)}%</span>
            </div>
          ))}
        </div>
        <p className="muted odds__note">
          Rarity comes from the level's difficulty, its GDDL tier and its AREDL position: Easy
          Demons start Common, Extreme Demons start Legendary, AREDL top 300 are Mythic and the
          top 50 are Celestial.
        </p>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Recent pulls</h2>
          <button type="button" className="link" onClick={() => navigate("collection")}>
            View all
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="empty">
            Nothing pulled yet. Open your first pack to start the collection — every demon from
            Easy to Extreme is in the pool.
          </p>
        ) : (
          <div className="card-grid card-grid--small">
            {recent.map(({ card, level }) => (
              <CardTile
                key={card.uid}
                level={level}
                rarity={card.rarity}
                holo={card.holo}
                onClick={() => setDetail(level.id)}
              />
            ))}
          </div>
        )}
      </section>

      {pulls && (
        <RevealOverlay
          pulls={pulls}
          packsLeft={packs}
          onClose={() => setPulls(null)}
          onOpenAgain={() => {
            const next = openPacks(1);
            if (next.length) setPulls(next);
          }}
          onInspect={(levelId) => setDetail(levelId)}
        />
      )}

      {detail != null && (
        <CardModal levelId={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
