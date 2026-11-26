import type { DiscordUser } from "./auth";

/**
 * Owner of the site: the account allowed to add packs to itself at any time.
 *
 * Matched against a Discord username or numeric user id, set with the
 * VITE_OWNER_DISCORD build variable (comma separated for several owners).
 * This is a convenience, not a security boundary — saves live in localStorage,
 * so a determined visitor can always edit their own numbers.
 */
const CONFIGURED = String(import.meta.env.VITE_OWNER_DISCORD ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_OWNERS = ["micahisthebigm"];

const OWNERS = new Set([...DEFAULT_OWNERS, ...CONFIGURED]);

export function matchesOwner(
  user: Pick<DiscordUser, "id" | "username" | "global_name"> | null,
): boolean {
  if (!user) return false;
  const names = [user.id, user.username, user.global_name ?? ""];
  return names.some((name) => name && OWNERS.has(name.toLowerCase()));
}
