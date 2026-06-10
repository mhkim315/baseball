import { selectedTeamId } from "./router.js";

export const BOTTOM_TABS = [
  { id: "home",      label: "홈",       href: "index" },
  { id: "schedule",  label: "캘린더",  href: "schedule" },
  { id: "stadium",   label: "구장안내",  href: "stadium-guide" },
  { id: "cheering",  label: "응원",     href: "cheering" },
  { id: "standings", label: "순위",     href: "standings" },
];

function tabSvg(tabId) {
  const s = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;display:block">`;
  const e = `</svg>`;
  switch (tabId) {
    case "home":
      return s + `<path d="M3 10L12 3l9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10z"/>` + e;
    case "schedule":
      return s + `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4M16 2v4"/><circle cx="7" cy="14" r="1.2"/><circle cx="11" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><circle cx="7" cy="18" r="1.2"/><circle cx="11" cy="18" r="1.2"/>` + e;
    case "stadium":
      return s + `<path d="M4 14A8 8 0 0120 14"/><line x1="4" y1="14" x2="12" y2="22"/><line x1="20" y1="14" x2="12" y2="22"/><polygon points="12,7 16,14 12,21 8,14"/><circle cx="12" cy="14" r="1.5"/>` + e;
    case "cheering":
      return s + `<path d="M8 15h8l3 6H5z"/><line x1="8" y1="15" x2="16" y2="15" stroke-width="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="16" cy="11" r="1.3"/><circle cx="8" cy="11" r="1.3"/><circle cx="19" cy="13" r="1"/><circle cx="14" cy="6" r="0.8"/><circle cx="10" cy="6" r="0.8"/><circle cx="5" cy="13" r="1"/><line x1="12" y1="11" x2="14" y2="9"/><line x1="12" y1="11" x2="10" y2="9"/><line x1="13" y1="12" x2="16" y2="10"/><line x1="11" y1="12" x2="8" y2="10"/>` + e;
    case "standings":
      return s + `<path d="M6 4h12v7a6 6 0 01-12 0z"/><path d="M4 6V4a2 2 0 012-2h12a2 2 0 012 2v2"/><path d="M8 20h8"/><path d="M12 13v7"/>` + e;
    default:
      return "";
  }
}

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

    const iconEl = document.createElement("span");
    iconEl.className = "bottom-tab-icon";
    iconEl.innerHTML = tabSvg(tab.id);

    const label = document.createElement("span");
    label.className = "bottom-tab-label";
    label.textContent = tab.label;

    a.appendChild(iconEl);
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
