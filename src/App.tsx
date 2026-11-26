import { useState } from "react";
import { LoginModal } from "./components/LoginModal";
import { NavBar } from "./components/NavBar";
import { useRoute } from "./lib/router";
import { Collection } from "./pages/Collection";
import { Home } from "./pages/Home";
import { IndexPage } from "./pages/IndexPage";
import { GameProvider, useGame } from "./state/GameContext";

function Shell() {
  const [route, navigate] = useRoute();
  const [loginOpen, setLoginOpen] = useState(false);
  const { authError, clearAuthError, booting } = useGame();

  return (
    <div className="app">
      <NavBar
        route={route}
        navigate={navigate}
        onLogin={() => setLoginOpen(true)}
        onOpenProfile={() => setLoginOpen(true)}
      />

      {authError && (
        <div className="banner banner--error">
          <span>{authError}</span>
          <button type="button" className="icon-btn" onClick={clearAuthError} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {booting ? (
        <div className="boot">Loading your packs…</div>
      ) : (
        <main className="container">
          {route === "home" && <Home navigate={navigate} />}
          {route === "collection" && <Collection navigate={navigate} />}
          {route === "index" && <IndexPage />}
        </main>
      )}

      <footer className="foot">
        <p>
          Demon Gacha — a fan-made card collector. Level data from{" "}
          <a href="https://gdladder.com" target="_blank" rel="noreferrer">
            GDDL
          </a>{" "}
          and{" "}
          <a href="https://aredl.net" target="_blank" rel="noreferrer">
            AREDL
          </a>
          . Not affiliated with RobTop Games.
        </p>
      </footer>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignedOut={() => setLoginOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
