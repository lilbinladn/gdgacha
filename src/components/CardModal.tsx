import { DIFFICULTY_LABEL, LEVEL_BY_ID, rarityOf } from "../lib/levels";
import { rarityMeta, rarityStyle } from "../lib/rarity";
import { useGame } from "../state/GameContext";
import { CardTile } from "./ui";

type Props = { levelId: number; onClose: () => void };

export function CardModal({ levelId, onClose }: Props) {
  const { save } = useGame();
  const level = LEVEL_BY_ID.get(levelId);
  if (!level) return null;

  const owned = save.owned[String(level.id)];
  const rarity = rarityOf(level.id);
  const meta = rarityMeta(rarity);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={level.name}>
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal__panel card-detail" style={rarityStyle(rarity)}>
        <div className="card-detail__left">
          <CardTile level={level} rarity={rarity} holo={owned?.holo} variant="large" />
        </div>
        <div className="card-detail__right">
          <div className="card-detail__top">
            <span className="rarity-tag" style={rarityStyle(rarity)}>
              {meta.name}
            </span>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <h2 className="card-detail__title">{level.name}</h2>
          <p className="card-detail__author">
            {DIFFICULTY_LABEL[level.difficulty]} · by {level.author}
          </p>
          <p className="card-detail__blurb">{meta.blurb}</p>

          <dl className="kv kv--grid">
            <div>
              <dt>Difficulty</dt>
              <dd>{DIFFICULTY_LABEL[level.difficulty]}</dd>
            </div>
            <div>
              <dt>AREDL rating</dt>
              <dd>{level.aredl != null ? `#${level.aredl}` : "Not listed"}</dd>
            </div>
            <div>
              <dt>AREDL points</dt>
              <dd>{level.points != null ? level.points.toFixed(1) : "—"}</dd>
            </div>
            <div>
              <dt>GDDL tier</dt>
              <dd>{level.tier.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Enjoyment</dt>
              <dd>{level.enjoyment ? `${level.enjoyment.toFixed(1)} / 10` : "—"}</dd>
            </div>
            <div>
              <dt>Level ID</dt>
              <dd>{level.id}</dd>
            </div>
          </dl>

          {level.desc && <p className="card-detail__desc">{level.desc}</p>}

          <div className="card-detail__owned">
            {owned ? (
              <>
                <strong>Owned ×{owned.count}</strong>
                {owned.holo && <span className="chip chip--holo">Holo</span>}
              </>
            ) : (
              <span className="muted">Not collected yet — keep opening packs.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
