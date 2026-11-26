import { useEffect, useMemo, useState } from "react";
import { rarityMeta, rarityStyle } from "../lib/rarity";
import { LEVEL_BY_ID } from "../lib/levels";
import type { Pull } from "../lib/types";
import { CardTile, DemonFace } from "./ui";

type Props = {
  pulls: Pull[];
  packsLeft: number;
  onClose: () => void;
  onOpenAgain: () => void;
  onInspect: (levelId: number) => void;
};

export function RevealOverlay({ pulls, packsLeft, onClose, onOpenAgain, onInspect }: Props) {
  const [revealed, setRevealed] = useState(0);
  const instant = pulls.length > 10;
  const best = useMemo(
    () => pulls.reduce((max, pull) => Math.max(max, pull.card.rarity), 0),
    [pulls],
  );
  const newCount = pulls.filter((pull) => pull.isNew).length;

  useEffect(() => {
    setRevealed(0);
  }, [pulls]);

  useEffect(() => {
    if (revealed >= pulls.length) return;
    const timer = window.setTimeout(
      () => setRevealed((value) => value + 1),
      instant ? 25 : 240,
    );
    return () => window.clearTimeout(timer);
  }, [revealed, pulls.length, instant]);

  const allShown = revealed >= pulls.length;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Pack opening">
      <div className="overlay__inner">
        <header className="overlay__head">
          <div>
            <p className="eyebrow">
              {pulls.length / 5} {pulls.length === 5 ? "pack" : "packs"} opened
            </p>
            <h2>
              {allShown ? (
                <>
                  {newCount > 0 ? `${newCount} new card${newCount === 1 ? "" : "s"}` : "All duplicates"}
                  <span className="overlay__best" style={rarityStyle(best)}>
                    best: {rarityMeta(best).name}
                  </span>
                </>
              ) : (
                "Opening…"
              )}
            </h2>
          </div>
          <div className="overlay__head-actions">
            {!allShown && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setRevealed(pulls.length)}
              >
                Reveal all
              </button>
            )}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>

        <div className={`reveal-grid${instant ? " reveal-grid--dense" : ""}`}>
          {pulls.map((pull, index) => {
            const level = LEVEL_BY_ID.get(pull.card.levelId);
            if (!level) return null;
            const open = index < revealed;
            return (
              <div
                key={pull.card.uid}
                className={`flip${open ? " is-open" : ""}`}
                style={rarityStyle(pull.card.rarity)}
              >
                <div className="flip__inner">
                  <div className="flip__back">
                    <DemonFace className="flip__back-face" />
                  </div>
                  <div className="flip__front">
                    <CardTile
                      level={level}
                      rarity={pull.card.rarity}
                      holo={pull.card.holo}
                      isNew={pull.isNew}
                      variant="reveal"
                      onClick={() => onInspect(level.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="overlay__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Back to packs
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onOpenAgain}
            disabled={packsLeft <= 0}
          >
            {packsLeft > 0 ? `Open another (${packsLeft} left)` : "No packs left"}
          </button>
        </footer>
      </div>
    </div>
  );
}
