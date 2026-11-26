import { useEffect, useState } from "react";

export type Route = "home" | "collection" | "index";

const ROUTES: Route[] = ["home", "collection", "index"];

function parseRoute(): Route {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0].toLowerCase();
  return (ROUTES.find((route) => route === raw) ?? "home") as Route;
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(parseRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: Route) => {
    if (location.hash === `#/${next}`) return;
    location.hash = `#/${next}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return [route, navigate];
}
