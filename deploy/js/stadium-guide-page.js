import { loadFoodLayouts, loadFoodPlaces, loadStadiumSurroundings, loadStadiumEats } from "./data-loader.js";
import { TICKET_POLICY } from "./ticket-config.js";
import {
  disposeStadiumMap,
  isMapLibreAvailable,
  mapCenterFromSpec,
  mountStadiumMap,
  resizeStadiumMap,
  resolveStadiumSpots,
} from "./stadium-map.js";
import { showError } from "./router.js";
import { TEAMS, STADIUMS, getStadiumByTeam } from "./team-config.js";
import { renderBottomTab } from "./bottom-tab.js";
import { escapeHtml } from "./escape.js";
import {
  CATEGORY_COLORS,
  CATEGORY_ORDER,
  DIRECTION_OFFSETS,
  DEFAULT_LABEL_DIRECTION,
  floorKey,
  categoryKey,
  categoryColor,
  floorSort,
  uniqueFloors,
  renderTab,
  appendConnector,
} from "./food-shared.js";

const CATEGORY_LABELS = {
  all: "전체",
  chicken: "치킨",
  korean: "한·분·일",
  western: "양식",
  cafe: "음료·간식",
};
const state = {
  team: null,
  stadium: null,
  stores: [],
  layouts: null,
  surroundings: null,
  floor: "",
  category: "all",
  activeTab: "seats",
  selectedShopName: "",
};

function shopName(store) {
  return String(store.shop || "이름 미상").trim() || "이름 미상";
}

function standZoneLabel(value) {
  const labels = { outside: "외부/광장", infield: "내야", outfield: "외야" };
  return labels[value] || value || "—";
}

function storesForCurrentFilter() {
  return state.stores.filter((store) => floorKey(store) === state.floor && (state.category === "all" || categoryKey(store) === state.category));
}

function groupedStoresByShop(stores) {
  const groups = new Map();
  for (const store of stores) {
    const key = shopName(store);
    const group = groups.get(key) || [];
    group.push(store);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([name, storesForShop]) => ({ name, stores: storesForShop }));
}

function storesForSelectedShop(visibleStores) {
  if (!state.selectedShopName) return visibleStores;
  return visibleStores.filter((store) => shopName(store) === state.selectedShopName);
}

function layoutBucket() {
  const stadium = state.layouts?.stadiums?.[state.stadium.id];
  const floor = stadium?.floors?.[state.floor];
  if (!floor) return {};
  return state.category === "all" ? floor.all || {} : floor.categories?.[state.category] || {};
}

function coordsForStore(store, originalIndex) {
  const saved = layoutBucket()[String(originalIndex)] || {};
  const left = Number.isFinite(Number(saved.leftPct)) ? Number(saved.leftPct) : Number(store.leftPct);
  const top = Number.isFinite(Number(saved.topPct)) ? Number(saved.topPct) : Number(store.topPct);
  const direction = DIRECTION_OFFSETS[saved.labelDirection] ? saved.labelDirection : DEFAULT_LABEL_DIRECTION;
  const offset = DIRECTION_OFFSETS[direction];
  const labelLeft = Math.min(100, Math.max(0, left + offset.dx));
  const labelTop = Math.min(100, Math.max(0, top + offset.dy));
  return { left, top, labelLeft, labelTop, direction };
}

function categoriesForFloor() {
  const present = new Set(state.stores.filter((store) => floorKey(store) === state.floor).map(categoryKey));
  return CATEGORY_ORDER.filter((id) => id === "all" || present.has(id)).map((id) => ({ id, label: CATEGORY_LABELS[id] || id }));
}

function renderFoodTabs() {
  const floors = uniqueFloors(state.stores);
  if (!state.floor || !floors.includes(state.floor)) state.floor = floors[0] || "";
  renderTab(document.getElementById("food-floor-tabs"), floors.map((id) => ({ id, label: id })), state.floor, (id) => {
    state.floor = id;
    state.category = "all";
    state.selectedShopName = "";
    renderFood();
  });
  const cats = categoriesForFloor();
  if (!cats.some((cat) => cat.id === state.category)) state.category = "all";
  renderTab(document.getElementById("food-category-tabs"), cats, state.category, (id) => {
    state.category = id;
    state.selectedShopName = "";
    renderFood();
  });
}

function selectShop(name) {
  state.selectedShopName = name;
  renderFood();
  document.getElementById("food-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderMarkers(stores) {
  const layer = document.getElementById("food-marker-layer");
  if (!layer) return;
  layer.innerHTML = "";
  stores.forEach((store) => {
    const originalIndex = state.stores.indexOf(store);
    const coords = coordsForStore(store, originalIndex);
    if (!Number.isFinite(coords.left) || !Number.isFinite(coords.top)) return;
    appendConnector(layer, coords, categoryColor(store));

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `food-marker food-marker--${categoryKey(store)}`;
    marker.style.left = `${coords.left}%`;
    marker.style.top = `${coords.top}%`;
    marker.title = shopName(store);
    marker.setAttribute("aria-label", `${shopName(store)} 위치`);
    marker.setAttribute("aria-pressed", state.selectedShopName === shopName(store) ? "true" : "false");
    marker.addEventListener("click", () => selectShop(shopName(store)));
    layer.appendChild(marker);

    const label = document.createElement("button");
    label.type = "button";
    label.className = `food-marker-label food-marker-label--${categoryKey(store)} food-marker-label--dir-${coords.direction.toLowerCase()}`;
    label.style.left = `${coords.labelLeft}%`;
    label.style.top = `${coords.labelTop}%`;
    label.textContent = shopName(store);
    label.title = store.menu ? `${shopName(store)} - ${store.menu}` : shopName(store);
    label.setAttribute("aria-pressed", state.selectedShopName === shopName(store) ? "true" : "false");
    label.addEventListener("click", () => selectShop(shopName(store)));
    layer.appendChild(label);
  });
}

function renderSeats() {
  const img = document.getElementById("seat-image");
  if (img) {
    img.src = state.stadium.seatImage;
    img.alt = `${state.stadium.label} 좌석 배치도`;
  }
}

function dDayLabel(dDay) {
  if (dDay === null || dDay === undefined) return "고정좌석";
  if (dDay < 0) return `D${dDay}`;
  return `D-${dDay}`;
}

function renderTicketInfo() {
  const root = document.getElementById("ticket-info");
  const body = document.getElementById("ticket-info-body");
  if (!root || !body) return;

  const tp = TICKET_POLICY[state.team.teamShort];
  if (!tp) {
    root.hidden = true;
    return;
  }

  let html = `<div class="ticket-team-block">`;
  html += `<h4 class="ticket-team-name" style="color:${tp.color}">${escapeHtml(tp.name)}</h4>`;
  html += `<p class="ticket-platform">예매: ${escapeHtml(tp.platform)}</p>`;
  html += `<div class="ticket-table-wrap"><table class="ticket-tier-table">`;
  html += `<thead><tr><th>등급</th><th>예매</th><th>시간</th><th>최대</th><th>좌석</th></tr></thead><tbody>`;
  for (const tier of tp.tiers) {
    const when = dDayLabel(tier.dDay);
    const time = tier.time || "—";
    const max = tier.maxTickets != null ? `${tier.maxTickets}매` : "—";
    html += `<tr><td>${escapeHtml(tier.name)}</td><td>${when}</td><td>${time}</td><td>${max}</td><td>${escapeHtml(tier.seats || "")}</td></tr>`;
  }
  html += `</tbody></table></div>`;
  const notes = tp.tiers.filter((t) => t.note).map((t) => t.note).filter(Boolean);
  if (notes.length) {
    html += `<ul class="ticket-notes">`;
    for (const n of notes) html += `<li>${escapeHtml(n)}</li>`;
    html += `</ul>`;
  }
  html += `</div>`;

  body.innerHTML = html;
  root.hidden = false;
}

function renderFoodDetail(visibleStores) {
  const root = document.getElementById("food-detail");
  if (!root) return;
  const selectedStores = storesForSelectedShop(visibleStores);
  if (!state.selectedShopName || !selectedStores.length) {
    root.innerHTML = '<p class="food-detail-hint">지도 마커나 상호명을 선택하면 매장 정보가 표시됩니다.</p>';
    return;
  }
  const store = selectedStores[0];
  const category = categoryKey(store);
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const menuText = escapeHtml([...new Set(selectedStores.map((item) => item.menu).filter(Boolean))].join(" / ") || "대표 메뉴 정보가 준비 중입니다.");
  const zoneLines = selectedStores.map((item) => `${escapeHtml(floorKey(item))} · ${escapeHtml(item.zone || "—")}`);
  const zoneText = zoneLines.join("<br>");
  const standText = escapeHtml([...new Set(selectedStores.map((item) => standZoneLabel(item.standZone)))].join(", "));
  const detailText = escapeHtml([...new Set(selectedStores.map((item) => item.detail).filter(Boolean))].join(" / "));
  root.innerHTML = `
    <div class="food-detail-heading">
      <div>
        <h4>${escapeHtml(state.selectedShopName)}</h4>
        <p>${menuText}</p>
      </div>
      <span class="food-detail-chip food-detail-chip--${category}">${categoryLabel}</span>
    </div>
    <dl class="food-detail-rows">
      <div><dt>위치</dt><dd>${zoneText}</dd></div>
      <div><dt>구분</dt><dd>${standText}</dd></div>
      ${detailText ? `<div><dt>상세</dt><dd>${detailText}</dd></div>` : ""}
    </dl>
  `;
}

function renderFood() {
  renderFoodTabs();
  const list = document.getElementById("food-list");
  const count = document.getElementById("food-count");
  const visibleStores = storesForCurrentFilter();
  if (state.selectedShopName && !visibleStores.some((store) => shopName(store) === state.selectedShopName)) state.selectedShopName = "";
  const markerStores = storesForSelectedShop(visibleStores);
  if (count) count.textContent = "등록 매장";
  renderMarkers(markerStores);
  renderFoodDetail(visibleStores);
  if (!list) return;
  list.innerHTML = "";
  if (!visibleStores.length) {
    list.innerHTML = "<li>선택한 조건에 해당하는 매장이 없습니다.</li>";
    return;
  }
  groupedStoresByShop(visibleStores).forEach((group, groupIndex) => {
    const li = document.createElement("li");
    li.id = `food-store-${groupIndex}`;
    if (state.selectedShopName === group.name) li.setAttribute("data-active", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `food-store-button food-store-button--${categoryKey(group.stores[0])}`;
    button.textContent = group.stores.length > 1 ? `${group.name} (${group.stores.length})` : group.name;
    button.setAttribute("aria-pressed", state.selectedShopName === group.name ? "true" : "false");
    button.addEventListener("click", () => selectShop(group.name));
    li.appendChild(button);
    list.appendChild(li);
  });
}

function stadiumMapBlock() {
  const hubId = state.stadium?.id;
  if (!hubId || !state.surroundings?.stadiums) return null;
  return state.surroundings.stadiums[hubId] || null;
}

function refreshStadiumMap() {
  const root = document.getElementById("stadium-map-root");
  if (!root || state.activeTab !== "map") return;
  const block = stadiumMapBlock();
  disposeStadiumMap();
  const spotsOk = resolveStadiumSpots(block).length > 0;
  const centerOk =
    Array.isArray(block?.center) &&
    block.center.length >= 2 &&
    Number.isFinite(Number(block.center[0])) &&
    Number.isFinite(Number(block.center[1]));
  if (!spotsOk && !centerOk) {
    root.innerHTML =
      '<p class="muted stadium-map-fallback">이 구장용 지도 설정이 없습니다. <code>data/stadium-surroundings.json</code>의 <code>stadiums.' +
      (state.stadium?.id || "?") +
      '</code>에 <code>spots</code> 또는 <code>center</code>를 채워 주세요.</p>';
    return;
  }
  if (!isMapLibreAvailable()) {
    root.innerHTML =
      '<p class="muted stadium-map-fallback">MapLibre 스크립트를 불러오지 못했습니다. 페이지를 새로고침하거나 네트워크를 확인해 주세요.</p>';
    return;
  }
  mountStadiumMap(root, {
    center: mapCenterFromSpec(block),
    zoom: block.zoom,
    spots: block.spots,
  });
  requestAnimationFrame(() => resizeStadiumMap());
}

function setActiveTab(tab, { updateUrl = true } = {}) {
  const next = ["seats", "food", "map", "eats"].includes(tab) ? tab : "seats";
  if (state.activeTab === "map" && next !== "map") {
    disposeStadiumMap();
  }
  state.activeTab = next;
  for (const button of document.querySelectorAll("[data-stadium-tab]")) {
    const active = button.dataset.stadiumTab === state.activeTab;
    button.setAttribute("aria-selected", active ? "true" : "false");
  }
  document.getElementById("seat-panel").hidden = state.activeTab !== "seats";
  document.getElementById("food-panel").hidden = state.activeTab !== "food";
  const mapPanel = document.getElementById("map-panel");
  if (mapPanel) mapPanel.hidden = state.activeTab !== "map";
  const eatsPanel = document.getElementById("eats-panel");
  if (eatsPanel) eatsPanel.hidden = state.activeTab !== "eats";
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", state.activeTab);
    history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
  }
  if (state.activeTab === "map") {
    requestAnimationFrame(() => refreshStadiumMap());
  }
  if (state.activeTab === "eats" && eatsMap) {
    requestAnimationFrame(() => eatsMap.resize());
  }
}

// ── 주변맛집 ────────────────────────────────────────────────

const EATS_CATEGORY_STYLE = {
  "치킨·호프": { fill: "#e11d48", icon: "🍗", label: "치킨" },
  "고깃집": { fill: "#dc2626", icon: "🥩", label: "고기" },
  "밥집·국밥": { fill: "#d97706", icon: "🍚", label: "밥집" },
  "카페·디저트": { fill: "#7c3aed", icon: "☕", label: "카페" },
  "술집·이자카야": { fill: "#0891b2", icon: "🍺", label: "술집" },
  "면·분식": { fill: "#059669", icon: "🍜", label: "면·분식" },
};

function eatsPinSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="26" height="34" aria-hidden="true">
    <path fill="${fill}" stroke="#fff" stroke-width="1.25" stroke-linejoin="round" d="M16 2C9.2 2 4 7.4 4 14.2c0 8.8 12 25.8 12 25.8s12-17 12-25.8C28 7.4 22.8 2 16 2z"/>
    <circle cx="16" cy="14.5" r="4.2" fill="#fff"/>
    <text x="16" y="19" text-anchor="middle" font-size="12">${fill === "#e11d48" ? "🍗" : fill === "#dc2626" ? "🥩" : fill === "#d97706" ? "🍚" : fill === "#7c3aed" ? "☕" : fill === "#0891b2" ? "🍺" : "🍜"}</text>
  </svg>`;
}

let eatsMap = null;
let eatsMarkers = [];

function clearEatsMarkers() {
  for (const m of eatsMarkers) m.remove();
  eatsMarkers = [];
}

function renderEats(eatsData) {
  const root = document.getElementById("eats-map-root");
  const detail = document.getElementById("eats-detail");
  if (!root) return;

  const spots = eatsData?.spots || [];
  if (!spots.length) {
    root.innerHTML = '<p class="muted stadium-map-fallback">이 구장의 주변맛집 데이터가 아직 준비되지 않았습니다.</p>';
    return;
  }

  if (!isMapLibreAvailable()) {
    root.innerHTML = '<p class="muted stadium-map-fallback">MapLibre 스크립트를 불러오지 못했습니다.</p>';
    return;
  }

  if (!eatsMap) {
    eatsMap = new window.maplibregl.Map({
      container: "eats-map-root",
      style: "https://tiles.openfreemap.org/styles/bright",
      center: eatsData.center || [127.0097, 37.2998],
      zoom: 14.5,
    });
    eatsMap.addControl(new window.maplibregl.NavigationControl());
  }

  clearEatsMarkers();
  if (detail) detail.innerHTML = '<p class="food-detail-hint">지도 마커를 선택하면 상세 정보가 표시됩니다.</p>';

  // 카테고리별 범례
  const legendEl = document.getElementById("eats-legend");
  if (legendEl) {
    legendEl.innerHTML = Object.entries(EATS_CATEGORY_STYLE).map(([cat, s]) =>
      `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:0.8rem">
        <svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4" fill="${s.fill}"/></svg>
        ${s.label}
      </span>`
    ).join("");
  }

  // 카테고리 목록 추출
  const cats = [...new Set(spots.map(s => s.cat).filter(Boolean))];
  let activeCat = cats[0] || "";

  // 카테고리 필터 탭
  function renderFilterTabs() {
    renderTab(document.getElementById("eats-cat-tabs"),
      cats.map(c => ({ id: c, label: (EATS_CATEGORY_STYLE[c]?.icon || "") + " " + c })),
      activeCat, (id) => { activeCat = id; renderFilteredSpots(); renderFilterTabs(); });
  }
  renderFilterTabs();

  function renderFilteredSpots() {
    clearEatsMarkers();
    if (detail) detail.innerHTML = '<p class="food-detail-hint">지도 마커를 선택하면 상세 정보가 표시됩니다.</p>';
    const filtered = spots.filter(s => s.cat === activeCat);
    if (!filtered.length) return;

    filtered.forEach((spot, i) => {
    const catStyle = EATS_CATEGORY_STYLE[spot.cat] || { fill: "#6b7280" };

    // 핀 마커 + 라벨
    const el = document.createElement("div");
    el.className = "eats-marker-wrap";
    el.style.cursor = "pointer";
    el.title = `${spot.cat} · ${spot.name}`;
    el.innerHTML = `
      <div class="eats-marker-pin">${eatsPinSvg(catStyle.fill)}</div>
      <div class="eats-marker-label">${spot.name}</div>
    `;

    const popup = new window.maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
      `<strong>${spot.name}</strong><br><span class="muted">${spot.cat} · ${spot.phone || ""}</span>`
    );

    const marker = new window.maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([spot.lng, spot.lat])
      .setPopup(popup)
      .addTo(eatsMap);

    el.addEventListener("click", () => {
      if (detail) {
        detail.innerHTML = `<div class="food-detail-heading">
          <div><h4>${spot.name}</h4><p>${spot.phone || ""}</p></div>
          <span class="food-detail-chip food-detail-chip--${spot.cat?.includes("치킨") ? "chicken" : spot.cat?.includes("카페") ? "cafe" : spot.cat?.includes("술") ? "western" : "korean"}">${spot.cat || ""}</span>
        </div>
        <dl class="food-detail-rows">
          <div><dt>주소</dt><dd>${spot.address || "—"}</dd></div>
          <div><dt>전화</dt><dd>${spot.phone || "—"}</dd></div>
        </dl>`;
        detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

      eatsMarkers.push(marker);
    });
  }

  // 초기 렌더링
  renderFilteredSpots();

  // 범례 업데이트 안 함 (카테고리 탭이 대신)
  const legendEl2 = document.getElementById("eats-legend");
  if (legendEl2) legendEl2.style.display = "none";
}

function bindSubTabs() {
  for (const button of document.querySelectorAll("[data-stadium-tab]")) {
    button.addEventListener("click", () => setActiveTab(button.dataset.stadiumTab));
  }
}

function selectedTeam() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("team") || "").trim();
  if (raw) {
    const team = TEAMS.find((t) => t.id === raw);
    if (team) return team;
  }
  return TEAMS[0];
}

function renderTeamSelector() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const nav = document.createElement("nav");
  nav.className = "team-selector";
  nav.setAttribute("aria-label", "구단 선택");
  const currentTeam = selectedTeam();
  for (const t of TEAMS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = t.buttonLabel;
    btn.setAttribute("aria-pressed", t.id === currentTeam.id ? "true" : "false");
    btn.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("team", t.id);
      url.searchParams.delete("stadium");
      history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
      window.location.reload();
    });
    nav.appendChild(btn);
  }
  header.after(nav);
}

async function main() {
  const team = selectedTeam();
  state.team = team;
  state.stadium = getStadiumByTeam(team);

  renderBottomTab("stadium");

  try {
    const subtitle = document.getElementById("stadium-guide-subtitle");
    if (subtitle) {
      subtitle.textContent = `${team.teamName} · ${team.ballparkName}`;
    }

    renderTeamSelector();

    const seatImg = document.getElementById("seat-image");
    if (seatImg) {
      seatImg.src = state.stadium.seatImage;
      seatImg.alt = `${state.stadium.label} 좌석 배치도`;
    }

    const foodMap = document.getElementById("food-map-image");
    if (foodMap) {
      foodMap.src = state.stadium.foodMapImage;
      foodMap.alt = `${state.stadium.label} 먹거리 지도`;
    }

    const [places, layouts, surroundings] = await Promise.all([
      loadFoodPlaces(),
      loadFoodLayouts(),
      loadStadiumSurroundings().catch(() => ({ stadiums: {} })),
    ]);

    const eats = await loadStadiumEats().catch(() => null);
    state.surroundings = surroundings;
    state.stores = places?.stadiums?.[state.stadium.id] || [];
    state.layouts = layouts || { stadiums: {} };
    state.floor = uniqueFloors(state.stores)[0] || "";
    state.category = "all";
    renderFood();
    renderTicketInfo();
    if (eats) {
      const hubId = state.stadium?.id;
      const eatsStadium = eats?.stadiums?.[hubId];
      if (eatsStadium) {
        renderEats({ center: eatsStadium.center, spots: eatsStadium.spots || [] });
      }
    }

    bindSubTabs();
    const initialTab = new URLSearchParams(window.location.search).get("tab");
    const tab = initialTab === "food" ? "food" : initialTab === "map" ? "map" : initialTab === "eats" ? "eats" : "seats";
    setActiveTab(tab, { updateUrl: false });
  } catch (error) {
    console.error(error);
    showError("구장안내 정보를 불러오지 못했습니다.");
  }
}

main();
