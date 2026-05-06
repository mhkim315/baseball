import { selectedTeamId } from "./router.js";

export const BOTTOM_TABS = [
  { id: "home",      label: "홈",       href: "index" },
  { id: "schedule",  label: "캘린더",  href: "schedule" },
  { id: "stadium",   label: "구장안내",  href: "stadium-guide" },
  { id: "cheering",  label: "응원",     href: "cheering" },
  { id: "standings", label: "순위",     href: "standings" },
];

function isCurrentTab(tabId) {
  const page = (window.location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  return tabId === "home"   ? page === "index" :
         tabId === "stadium" ? page === "stadium-guide" :
         page === tabId;
}

export function renderBottomTab() {
  const nav = document.createElement("nav");
  nav.className = "bottom-tab-bar";
  nav.setAttribute("aria-label", "주요 메뉴");

  const teamId = selectedTeamId();
  const currentPage = (window.location.pathname.split("/").pop() || "index").replace(/\.html$/, "");

  for (const tab of BOTTOM_TABS) {
    const a = document.createElement("a");
    a.href = tab.href === currentPage ? "" : buildTabUrl(tab.href, teamId, currentPage);
    a.className = "bottom-tab-item";
    if (isCurrentTab(tab.id)) {
      a.classList.add("bottom-tab-item--active");
      a.setAttribute("aria-current", "page");
    }

    const label = document.createElement("span");
    label.className = "bottom-tab-label";
    label.textContent = tab.label;

    a.appendChild(label);
    nav.appendChild(a);

    if (tab.href !== currentPage) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.assign(buildTabUrl(tab.href, teamId, currentPage));
      });
    }
  }

  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-tab");
}

function buildTabUrl(href, teamId, _currentPage) {
  const url = new URL(href, window.location.href);
  if (teamId) url.searchParams.set("team", teamId);
  return `${url.pathname.split("/").pop()}${url.search}`;
}
