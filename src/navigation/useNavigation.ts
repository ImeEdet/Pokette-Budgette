import { useEffect, useState } from "react";
const pages: Record<string, string> = {
  dashboard: "Dashboard",
  wallets: "Wallets",
  budget: "Budget",
  transactions: "Transactions",
  more: "More",
  reports: "Reports",
};
export function readRoute(hash = window.location.hash) {
  const [slug, id] = hash.replace(/^#\/?/, "").split("/");
  const page = pages[slug] ?? "Dashboard";
  return {
    page,
    detail: (page === "Wallets" || page === "Budget") && id ? id : null,
  };
}
export function useNavigation() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  function go(page: string, detail: string | null = null) {
    const hash = `#/${page.toLowerCase()}${detail ? "/" + detail : ""}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setRoute({ page, detail });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  return { ...route, go };
}
