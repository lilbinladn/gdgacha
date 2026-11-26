import { useMemo, useState } from "react";
import { CardModal } from "../components/CardModal";
import { CardTile } from "../components/ui";
import { formatNumber } from "../lib/format";
import { DIFFICULTIES, DIFFICULTY_LABEL, LEVELS, GENERATED_AT, rarityOf } from "../lib/levels";
import { RARITIES } from "../lib/rarity";
import { useGame } from "../state/GameContext";

const PAGE_STEP = 60;

export function IndexPage() {
  const { save } = useGame();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE_STEP);
  const [detail, setDetail] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEVELS.filter((level) => {
      if (difficulty !== "all" && level.difficulty !== difficulty) return false;
      if (rarity !== "all" && rarityOf(level.id) !== Number(rarity)) return false;
      if (ownedOnly && !save.owned[String(level.id)]) return false;
      if (q && !level.name.toLowerCase().includes(q) && !level.author.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, difficulty, rarity, ownedOnly, save.owned]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Demon index</h2>
            <p className="muted">
              Every rated demon in Geometry Dash — {formatNumber(LEVELS.length)} levels from GDDL,
              with AREDL positions for listed Extreme Demons.
            </p>
          </div>
        </div>

        <div className="filters">
          <label className="field field--grow">
            <span>Search</span>
            <input
              className="input"
              type="search"
              placeholder="Level or creator…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(PAGE_STEP);
              }}
            />
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select
              className="select"
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
                setLimit(PAGE_STEP);
              }}
            >
              <option value="all">All</option>
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {DIFFICULTY_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Rarity</span>
            <select
              className="select"
              value={rarity}
              onChange={(event) => {
                setRarity(event.target.value);
                setLimit(PAGE_STEP);
              }}
            >
              <option value="all">All</option>
              {RARITIES.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--check">
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={(event) => {
                setOwnedOnly(event.target.checked);
                setLimit(PAGE_STEP);
              }}
            />
            <span>Owned only</span>
          </label>
        </div>

        <p className="muted filters__count">
          Showing {formatNumber(visible.length)} of {formatNumber(filtered.length)} demons
        </p>

        <div className="card-grid">
          {visible.map((level) => {
            const owned = save.owned[String(level.id)];
            return (
              <CardTile
                key={level.id}
                level={level}
                rarity={rarityOf(level.id)}
                holo={owned?.holo}
                count={owned?.count}
                onClick={() => setDetail(level.id)}
              />
            );
          })}
        </div>

        {visible.length < filtered.length && (
          <div className="load-more">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setLimit((value) => value + PAGE_STEP * 2)}
            >
              Load more
            </button>
          </div>
        )}

        <p className="muted source-note">
          Level data generated {new Date(GENERATED_AT).toLocaleDateString()} from the GDDL and
          AREDL public APIs. Card rarities are derived locally from difficulty, GDDL tier and
          AREDL position.
        </p>
      </section>

      {detail != null && <CardModal levelId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
