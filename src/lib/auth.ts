/**
 * Discord sign-in for a static site.
 *
 * Uses the OAuth2 authorization-code grant with PKCE (S256) and no client
 * secret, which Discord supports for public clients. The code is exchanged
 * straight from the browser — Discord's token endpoint sends CORS headers, so
 * no backend is needed and nothing secret ever ships to the client.
 */

const CLIENT_ID = (import.meta.env.VITE_DISCORD_CLIENT_ID ?? "").trim();
const SESSION_KEY = "demon-gacha:session:v1";
const PKCE_KEY = "demon-gacha:pkce:v1";
const TOKEN_URL = "https://discord.com/api/oauth2/token";
const AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const ME_URL = "https://discord.com/api/users/@me";

export const DISCORD_CONFIGURED = /^\d{15,25}$/.test(CLIENT_ID);

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
};

export type Session = {
  user: DiscordUser;
  accessToken: string;
  expiresAt: number;
};

export function redirectUri(): string {
  // Must match a redirect registered in the Discord developer portal exactly.
  return `${location.origin}${location.pathname}`;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes).slice(0, length);
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function beginDiscordLogin(): Promise<void> {
  if (!DISCORD_CONFIGURED) {
    throw new Error(
      "Discord sign-in is not configured. Set VITE_DISCORD_CLIENT_ID to your Discord application's client ID.",
    );
  }
  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = await challengeFor(verifier);
  const redirect = redirectUri();
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, redirect }));

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "consent");
  location.assign(url.toString());
}

function cleanUrl() {
  const { pathname, hash } = location;
  history.replaceState({}, "", `${pathname}${hash || "#/home"}`);
}

/** Completes the redirect back from Discord. Returns null when not a callback. */
export async function completeDiscordLogin(): Promise<Session | null> {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return null;

  const returnedState = params.get("state");
  const stored = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  cleanUrl();

  if (error) {
    throw new Error(
      params.get("error_description") || `Discord cancelled the sign-in (${error}).`,
    );
  }
  if (!stored) throw new Error("The sign-in attempt expired. Please try again.");

  const { verifier, state, redirect } = JSON.parse(stored) as {
    verifier: string;
    state: string;
    redirect: string;
  };
  if (returnedState !== state) throw new Error("Sign-in state mismatch. Please try again.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code: code as string,
    redirect_uri: redirect,
    code_verifier: verifier,
  });

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error(`Discord rejected the sign-in (HTTP ${tokenRes.status}).`);
  }
  const token = (await tokenRes.json()) as { access_token: string; expires_in: number };

  const meRes = await fetch(ME_URL, {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw new Error("Could not load your Discord profile.");

  const me = (await meRes.json()) as DiscordUser;
  return {
    user: me,
    accessToken: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 604800) * 1000,
  };
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session?.user?.id) return null;
    if (session.expiresAt && session.expiresAt < Date.now() + 60_000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function persistSession(session: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage failures
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function displayName(user: DiscordUser): string {
  return user.global_name?.trim() || user.username;
}

export function avatarUrl(user: DiscordUser, size = 64): string | null {
  if (!user.avatar) return null;
  const extension = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=${size}`;
}
