#!/usr/bin/env node
/**
 * Builds src/data/levels.json from two public community sources:
 *
 *  - GDDL (gdladder.com)   -> every rated demon in Geometry Dash, with its
 *                             difficulty (Easy..Extreme Demon) and tier rating.
 *  - AREDL (api.aredl.net) -> the All Rated Extreme Demons List: the AREDL
 *                             position + points for every Extreme Demon.
 *
 * Run with:  node scripts/fetch-levels.mjs
 * Pages are cached in scripts/.cache, so an interrupted run resumes where it
 * stopped instead of starting over.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, "scripts", ".cache");
const OUT = path.join(ROOT, "src", "data", "levels.json");

const GDDL = "https://gdladder.com/api/levels";
const AREDL = "https://api.aredl.net/v2/api/aredl/levels";
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Insane", "Extreme"];
const PAGE_SIZE = 25; // GDDL caps limit at 25
const PACING_MS = 60; // per request, per worker
const CONCURRENCY = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapPool(items, worker, concurrency = CONCURRENCY) {
  const out = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return out;
}

async function getJSON(url, tries = 8) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "demon-gacha/1.0" },
      });
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * attempt;
        console.warn(`  ! ${res.status} — retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === tries) throw err;
      await sleep(800 * attempt);
    }
  }
  throw new Error(`Gave up on ${url}`);
}

async function fetchGDDL() {
  const rows = [];
  for (const difficulty of DIFFICULTIES) {
    const file = path.join(CACHE, `gddl-${difficulty}.json`);
    let store = existsSync(file)
      ? JSON.parse(await readFile(file, "utf8"))
      : { total: 0, pages: {} };

    if (!store.total) {
      const first = await getJSON(`${GDDL}?difficulty=${difficulty}&limit=${PAGE_SIZE}&page=0`);
      store.total = first.total;
      store.pages["0"] = first.data;
      await sleep(PACING_MS);
    }

    const pageCount = Math.ceil(store.total / PAGE_SIZE);
    const missing = [];
    for (let page = 0; page < pageCount; page++) {
      if (!store.pages[String(page)]) missing.push(page);
    }
    if (missing.length) console.log(`  ${difficulty}: ${missing.length} pages to fetch`);

    let fetched = 0;
    await mapPool(missing, async (page) => {
      const body = await getJSON(`${GDDL}?difficulty=${difficulty}&limit=${PAGE_SIZE}&page=${page}`);
      store.pages[String(page)] = body.data;
      fetched++;
      if (fetched % 15 === 0) await writeFile(file, JSON.stringify(store));
      await sleep(PACING_MS);
    });

    await writeFile(file, JSON.stringify(store));
    const collected = Object.values(store.pages).flat();
    rows.push(...collected);
    console.log(`· GDDL ${difficulty}: ${collected.length}/${store.total} levels`);
  }
  return rows;
}

async function fetchAREDL() {
  const file = path.join(CACHE, "aredl.json");
  if (existsSync(file)) {
    console.log("· AREDL (cached)");
    return JSON.parse(await readFile(file, "utf8"));
  }
  const data = await getJSON(AREDL);
  await writeFile(file, JSON.stringify(data));
  console.log(`· AREDL: ${data.length} levels`);
  return data;
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(path.dirname(OUT), { recursive: true });

  const [gddl, aredl] = await Promise.all([fetchGDDL(), fetchAREDL()]);

  const aredlById = new Map();
  for (const level of aredl) {
    if (level.level_id) aredlById.set(Number(level.level_id), level);
  }

  const seen = new Set();
  const levels = [];

  for (const row of gddl) {
    const id = Number(row.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!DIFFICULTIES.includes(row.difficulty)) continue;

    const entry = aredlById.get(id) ?? null;
    const name = String(row.name ?? "").trim();
    if (!name) continue;

    levels.push({
      id,
      name,
      author: String(row.publisherName ?? "Unknown").trim(),
      difficulty: row.difficulty,
      // GDDL tier: community difficulty score (higher = harder).
      tier: Math.round((row.rating ?? 0) * 100) / 100,
      // AREDL leaderboard position + points, only for listed Extreme Demons.
      aredl: entry?.position ?? null,
      points: entry?.points ?? null,
      // Community enjoyment out of 10, from GDDL.
      enjoyment: Math.round((row.enjoyment ?? 0) * 10) / 10,
      desc: entry?.description ? String(entry.description).slice(0, 300) : null,
    });
  }

  levels.sort((a, b) => b.tier - a.tier);

  const counts = {};
  for (const level of levels) counts[level.difficulty] = (counts[level.difficulty] ?? 0) + 1;

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: [
      { name: "GDDL", url: "https://gdladder.com", note: "every rated demon + tier rating" },
      { name: "AREDL", url: "https://aredl.net", note: "All Rated Extreme Demons List" },
    ],
    counts,
    levels,
  };

  const json = JSON.stringify(payload);
  await writeFile(OUT, json);
  console.log(
    `✓ ${levels.length} demons -> ${path.relative(ROOT, OUT)} (${(Buffer.byteLength(json) / 1024).toFixed(0)} KiB)`,
  );
  console.log("  ", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
