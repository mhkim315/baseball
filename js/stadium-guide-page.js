import { loadFoodLayouts, loadFoodPlaces, loadStadiumSurroundings } from "./data-loader.js";
import {
  disposeStadiumMap,
  isMapLibreAvailable,
  mapCenterFromSpec,
  mountStadiumMap,
  resizeStadiumMap,
  resolveStadiumSpots,
} from "./stadium-map.js";
import { initShell, showError } from "./router.js";
import { getStadiumByTeam } from "./team-config.js";
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

function renderSeats(team) {
  const img = document.getElementById("seat-image");
  img.src = state.stadium.seatImage;
  img.alt = `${team.ballparkName} 좌석 배치도`;
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
  const next = tab === "food" ? "food" : tab === "map" ? "map" : "seats";
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
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", state.activeTab);
    history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
  }
  if (state.activeTab === "map") {
    requestAnimationFrame(() => refreshStadiumMap());
  }
}

function bindSubTabs() {
  for (const button of document.querySelectorAll("[data-stadium-tab]")) {
    button.addEventListener("click", () => setActiveTab(button.dataset.stadiumTab));
  }
}

async function main() {
  const team = initShell("stadium", "구장안내");
  try {
    state.team = team;
    state.stadium = getStadiumByTeam(team);
    const subtitle = document.getElementById("stadium-guide-subtitle");
    if (subtitle) subtitle.textContent = `${team.teamShort} · ${team.ballparkName}`;
    renderSeats(team);

    const foodMap = document.getElementById("food-map-image");
    foodMap.src = state.stadium.foodMapImage;
    foodMap.alt = `${team.ballparkName} 먹거리 지도`;
    const [places, layouts, surroundings] = await Promise.all([
      loadFoodPlaces(),
      loadFoodLayouts(),
      loadStadiumSurroundings().catch(() => ({ stadiums: {} })),
    ]);
    state.surroundings = surroundings;
    state.stores = places?.stadiums?.[state.stadium.id] || [];
    state.layouts = layouts || { stadiums: {} };
    state.floor = uniqueFloors(state.stores)[0] || "";
    state.category = "all";
    renderFood();

    bindSubTabs();
    const initialTab = new URLSearchParams(window.location.search).get("tab");
    const tab = initialTab === "food" ? "food" : initialTab === "map" ? "map" : "seats";
    setActiveTab(tab, { updateUrl: false });
  } catch (error) {
    console.error(error);
    showError("구장안내 정보를 불러오지 못했습니다.");
  }
}

main();
