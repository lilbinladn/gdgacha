import { useGame } from "../state/GameContext";
import type { Route } from "../lib/router";
import { DemonFace } from "./ui";

type Props = {
  route: Route;
  navigate: (route: Route) => void;
  onLogin: () => void;
  onOpenProfile: () => void;
};

const LINKS: { route: Route; label: string }[] = [
  { route: "home", label: "Home" },
  { route: "collection", label: "Collection" },
  { route: "index", label: "Index" },
];

export function NavBar({ route, navigate, onLogin, onOpenProfile }: Props) {
  const { session, playerName, playerAvatar, packs } = useGame();

  return (
    <header className="nav">
      <div className="nav__inner">
        <button type="button" className="brand" onClick={() => navigate("home")}>
          <span className="brand__mark">
            <DemonFace className="brand__face" />
          </span>
          <span className="brand__text">
            Demon <strong>Gacha</strong>
          </span>
        </button>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <button
              key={link.route}
              type="button"
              className={`nav__link${route === link.route ? " is-active" : ""}`}
              onClick={() => navigate(link.route)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="nav__right">
          <button type="button" className="nav__packs" onClick={() => navigate("home")}>
            <span className="nav__packs-icon" aria-hidden="true">
              ▤
            </span>
            <span>
              {packs}
              <span className="nav__packs-max">/10</span>
            </span>
          </button>

          {session ? (
            <button type="button" className="nav__user" onClick={onOpenProfile}>
              {playerAvatar ? (
                <img src={playerAvatar} alt="" className="nav__avatar" />
              ) : (
                <span className="nav__avatar nav__avatar--fallback">
                  {playerName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="nav__username">{playerName}</span>
            </button>
          ) : (
            <button type="button" className="btn btn--discord" onClick={onLogin}>
              <span className="discord-dot" aria-hidden="true" />
              Sign in with Discord
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
