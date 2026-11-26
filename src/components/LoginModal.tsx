import { useState } from "react";
import { beginDiscordLogin, DISCORD_CONFIGURED, redirectUri } from "../lib/auth";
import { useGame } from "../state/GameContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onSignedOut: () => void;
};

export function LoginModal({ open, onClose, onSignedOut }: Props) {
  const { session, playerName, save, signOut, resetProgress } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleDiscord = async () => {
    setBusy(true);
    setError(null);
    try {
      await beginDiscordLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Discord sign-in.");
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    onSignedOut();
    onClose();
  };

  const handleReset = () => {
    if (confirm("Reset this profile's collection and packs? This cannot be undone.")) {
      resetProgress();
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Account">
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal__panel modal__panel--narrow">
        <div className="modal__head">
          <h2>{session ? "Your account" : "Sign in"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {session ? (
          <>
            <p className="modal__text">
              Signed in as <strong>{playerName}</strong>. Your packs, cards and holo pulls are
              saved to this Discord account on this device.
            </p>
            <dl className="kv">
              <div>
                <dt>Packs opened</dt>
                <dd>{save.packsOpened}</dd>
              </div>
              <div>
                <dt>Cards owned</dt>
                <dd>{Object.keys(save.owned).length}</dd>
              </div>
            </dl>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={handleReset}>
                Reset progress
              </button>
              <button type="button" className="btn btn--primary" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="modal__text">
              Sign in with Discord to save your collection, pack timer and holo cards under your
              account.
            </p>
            <button
              type="button"
              className="btn btn--discord btn--wide"
              onClick={handleDiscord}
              disabled={busy}
            >
              <span className="discord-dot" aria-hidden="true" />
              {busy ? "Redirecting…" : "Continue with Discord"}
            </button>

            {!DISCORD_CONFIGURED && (
              <div className="notice">
                <strong>Discord login needs one setup step.</strong>
                <p>
                  Create an application at discord.com/developers, add this exact redirect URL,
                  then build with your client ID:
                </p>
                <code>{redirectUri()}</code>
                <code>VITE_DISCORD_CLIENT_ID=your_client_id</code>
                <p className="notice__hint">
                  Until then you can play as a guest — progress stays on this device.
                </p>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <button type="button" className="btn btn--ghost btn--wide" onClick={onClose}>
              Continue as guest
            </button>
          </>
        )}
      </div>
    </div>
  );
}
