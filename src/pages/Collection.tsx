import { useMemo, useState } from "react";
import { CardModal } from "../components/CardModal";
import { CardTile, ProgressBar } from "../components/ui";
import { formatNumber, formatPercent, percent } from "../lib/format";
import { DIFFICULTIES, DIFFICULTY_LABEL, LEVEL_BY_ID, TOTAL_LEVELS, rarityOf } from "../lib/levels";
import { RARITIES } from "../lib/rarity";
import type { Route } from "../lib/router";
import { useGame } from "../state/GameContext";

type Row = {
  levelId: number;
  count: number;
  holo: boolean;
  firstAt: number;
  rarity: number;
};

export function Collection({ navigate }: { navigate: (route: Route) => void }) {
  const { save, ownedCount, holoCount, totalCards } = useGame();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState<"rarity" | "newest" | "name">("rarity");
  const [detail, setDetail] = useState<number | null>(null);

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [];
    for (const [key, owned] of Object.entries(save.owned)) {
      const levelId = Number(key);
      if (!LEVEL_BY_ID.has(levelId)) continue;
      all.push({
        levelId,
        count: owned.count,
        holo: owned.holo,
        firstAt: owned.firstAt,
        rarity: rarityOf(levelId),
      });
    }

    const q = query.trim().toLowerCase();
    const filtered = all.filter((row) => {
      const level = LEVEL_BY_ID.get(row.levelId);
      if (!level) return false;
      if (difficulty !== "all" && level.difficulty !== difficulty) return false;
      if (rarity !== "all" && row.rarity !== Number(rarity)) return false;
      if (q && !level.name.toLowerCase().includes(q) && !level.author.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === "newest") return b.firstAt - a.firstAt;
      if (sort === "name") {
        return (LEVEL_BY_ID.get(a.levelId)?.name ?? "").localeCompare(
          LEVEL_BY_ID.get(b.levelId)?.name ?? "",
        );
      }
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      return (LEVEL_BY_ID.get(b.levelId)?.tier ?? 0) - (LEVEL_BY_ID.get(a.levelId)?.tier ?? 0);
    });

    return filtered;
  }, [save.owned, query, difficulty, rarity, sort]);

  return (
    <div className="page">
      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Your collection</h2>
            <p className="muted">
              {formatNumber(ownedCount)} unique demons · {formatNumber(totalCards)} cards ·{" "}
              {formatNumber(holoCount)} foil
            </p>
          </div>
          <button type="button" className="link" onClick={() => navigate("index")}>
            Browse all demons
          </button>
        </div>
        <ProgressBar value={ownedCount} max={TOTAL_LEVELS} />
        <p className="muted collection__pct">
          {formatPercent(percent(ownedCount, TOTAL_LEVELS))} of every rated demon in Geometry Dash
        </p>
      </section>

      <section className="panel">
        <div className="filters">
          <label className="field field--grow">
            <span>Search</span>
            <input
              className="input"
              type="search"
              placeholder="Level or creator…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select
              className="select"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
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
              onChange={(event) => setRarity(event.target.value)}
            >
              <option value="all">All</option>
              {RARITIES.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Sort</span>
            <select
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
            >
              <option value="rarity">Rarest first</option>
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>

        <p className="muted filters__count">
          {formatNumber(rows.length)} card{rows.length === 1 ? "" : "s"} shown
        </p>

        {rows.length === 0 ? (
          <p className="empty">
            {ownedCount === 0
              ? "Your collection is empty. Head back home and open a pack."
              : "No cards match those filters."}
          </p>
        ) : (
          <div className="card-grid">
            {rows.map((row) => {
              const level = LEVEL_BY_ID.get(row.levelId);
              if (!level) return null;
              return (
                <CardTile
                  key={row.levelId}
                  level={level}
                  rarity={row.rarity}
                  holo={row.holo}
                  count={row.count}
                  onClick={() => setDetail(row.levelId)}
                />
              );
            })}
          </div>
        )}
      </section>

      {detail != null && <CardModal levelId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
