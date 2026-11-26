import type { CSSProperties } from "react";
import { DIFFICULTY_COLOR, DIFFICULTY_SHORT } from "../lib/levels";
import { rarityMeta, rarityStyle } from "../lib/rarity";
import type { Difficulty, Level } from "../lib/types";

export function DemonFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <path d="M12 25 4 5l18 9z" fill="currentColor" opacity="0.9" />
      <path d="M52 25 60 5 42 14z" fill="currentColor" opacity="0.9" />
      <path
        d="M32 12c11.6 0 20 8.6 20 20.4C52 45 43.4 54 32 54S12 45 12 32.4C12 20.6 20.4 12 32 12Z"
        fill="currentColor"
      />
      <path d="M20 28l10 6-10 6z" fill="#0b0a12" />
      <path d="M44 28l-10 6 10 6z" fill="#0b0a12" />
      <path d="M22 44h20l-4 5h-4l-2 5-2-5h-4z" fill="#0b0a12" />
    </svg>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className="diff-badge"
      style={{ "--d": DIFFICULTY_COLOR[difficulty] } as CSSProperties}
    >
      <DemonFace className="diff-badge__icon" />
      {DIFFICULTY_SHORT[difficulty]}
    </span>
  );
}

export function RarityTag({ rarity }: { rarity: number }) {
  const meta = rarityMeta(rarity);
  return (
    <span className="rarity-tag" style={rarityStyle(rarity)}>
      {meta.name}
    </span>
  );
}

type CardTileProps = {
  level: Level;
  rarity: number;
  holo?: boolean;
  count?: number;
  isNew?: boolean;
  variant?: "grid" | "reveal" | "large";
  onClick?: () => void;
};

export function CardTile({
  level,
  rarity,
  holo = false,
  count,
  isNew,
  variant = "grid",
  onClick,
}: CardTileProps) {
  return (
    <button
      type="button"
      className={`card card--${variant}${holo ? " card--holo" : ""}${isNew ? " card--new" : ""}`}
      style={rarityStyle(rarity)}
      onClick={onClick}
      aria-label={`${level.name}, ${rarityMeta(rarity).name}, ${DIFFICULTY_SHORT[level.difficulty]} demon`}
    >
      <span className="card__sheen" aria-hidden="true" />
      <span className="card__head">
        <DifficultyBadge difficulty={level.difficulty} />
        <span className="card__rarity">{rarityMeta(rarity).name}</span>
      </span>
      <span className="card__art">
        <DemonFace className="card__face" />
        {holo && <span className="card__holo">HOLO</span>}
      </span>
      <span className="card__body">
        <span className="card__name">{level.name}</span>
        <span className="card__author">by {level.author}</span>
      </span>
      <span className="card__foot">
        {level.aredl != null ? (
          <span className="chip chip--aredl">AREDL #{level.aredl}</span>
        ) : (
          <span className="chip chip--ghost">No AREDL</span>
        )}
        <span className="chip chip--ghost">GDDL {level.tier.toFixed(1)}</span>
      </span>
      {isNew && <span className="card__flag card__flag--new">NEW</span>}
      {count != null && count > 1 && <span className="card__flag card__flag--count">×{count}</span>}
    </button>
  );
}

export function PackArt({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`pack-art${dim ? " pack-art--dim" : ""}`} aria-hidden="true">
      {[-2, -1, 1, 2].map((offset) => (
        <span
          key={offset}
          className="pack-sheet"
          style={{
            transform: `translateX(${offset * 18}px) rotate(${offset * 5}deg)`,
          }}
        />
      ))}
      <span className="pack-face">
        <span className="pack-face__spark" />
        <DemonFace className="pack-face__face" />
        <span className="pack-face__title">DEMON</span>
        <span className="pack-face__sub">5 CARDS</span>
      </span>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const width = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span className="progress__fill" style={{ width: `${width}%` }} />
    </div>
  );
}
