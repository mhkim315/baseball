/**
 * OpenFreeMap vector tiles + MapLibre GL JS.
 * @see https://openfreemap.org/
 * @see https://openfreemap.org/quick_start/
 */
import { escapeHtml } from "./escape.js";
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

export const SPOT_KIND_STADIUM = "stadium";
export const SPOT_KIND_PARKING = "parking";

let mapInstance = null;
let markers = [];

function clearMarkers() {
  for (const m of markers) {
    try {
      m.remove();
    } catch {
      /* noop */
    }
  }
  markers = [];
}

/**
 * @param {unknown} raw
 * @param {number} index
 */
export function normalizeSpotKind(raw, index) {
  const k = String(raw ?? "").trim().toLowerCase();
  if (k === "stadium" || k === "ballpark") return SPOT_KIND_STADIUM;
  if (k === "parking" || k === "lot" || k === "p") return SPOT_KIND_PARKING;
  return index === 0 ? SPOT_KIND_STADIUM : SPOT_KIND_PARKING;
}

/**
 * @param {"stadium"|"parking"} kind
 * @param {{ draggable?: boolean }} options
 * @returns {HTMLElement}
 */
export function createPinMarkerElement(kind, options = {}) {
  const { draggable = false } = options;
  const isStadium = kind === SPOT_KIND_STADIUM;
  const fill = isStadium ? "#c2410c" : "#1d4ed8";
  const stroke = "#ffffff";
  const label = isStadium ? "구장" : "주차·주변 지점";

  const el = draggable ? document.createElement("div") : document.createElement("button");
  if (!draggable) {
    el.type = "button";
  }
  el.className = `stadium-map-pin stadium-map-pin--${kind}${draggable ? " stadium-map-pin--draggable" : ""}`;
  el.setAttribute("aria-label", label);
  el.title = label;
  if (draggable) el.style.cursor = "grab";

  el.innerHTML = pinSvgHtml(fill, stroke);
  return el;
}

function pinSvgHtml(fill, stroke) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="28" height="36" aria-hidden="true" focusable="false">
  <path fill="${fill}" stroke="${stroke}" stroke-width="1.25" stroke-linejoin="round" d="M16 2C9.2 2 4 7.4 4 14.2c0 8.8 12 25.8 12 25.8s12-17 12-25.8C28 7.4 22.8 2 16 2z"/>
  <circle cx="16" cy="14.5" r="4.2" fill="${stroke}"/>
  <circle cx="16" cy="14.5" r="2" fill="${fill}"/>
</svg>`;
}

function truncateLabel(s, max) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * 지도 라벨·팝업 제목용 짧은 이름 (`name` 우선, 없으면 설명 앞부분).
 * @param {{ name?: string, description?: string, kind?: string }} spot
 */
export function displaySpotName(spot) {
  const n = String(spot.name ?? "").trim();
  if (n) return truncateLabel(n, 26);
  const d = String(spot.description ?? "").trim();
  if (!d) return spot.kind === SPOT_KIND_STADIUM ? "구장" : "주차";
  const head = d.split(/\s*[（(—–]\s*/)[0]?.trim() || d;
  const cleaned = head.replace(/\s+/g, " ");
  return truncateLabel(cleaned, 26);
}

/** @param {{ spots?: unknown[], center?: [number, number] }} spec */
export function resolveStadiumSpots(spec) {
  const raw = Array.isArray(spec?.spots) ? spec.spots : [];
  const out = [];
  for (const s of raw) {
    const lng = Number(s.lng);
    const lat = Number(s.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const kind = normalizeSpotKind(s.kind ?? s.spotKind, out.length);
    out.push({
      id: String(s.id || `spot-${out.length}`),
      lng,
      lat,
      name: String(s.name ?? "").trim(),
      description: String(s.description ?? s.note ?? "").trim(),
      kind,
    });
  }
  return out;
}

/** 지도 초기 중심: 첫 지점 → 없으면 center */
export function mapCenterFromSpec(spec) {
  const spots = resolveStadiumSpots(spec);
  if (spots.length) return [spots[0].lng, spots[0].lat];
  const c = spec?.center;
  if (Array.isArray(c) && c.length >= 2 && Number.isFinite(Number(c[0])) && Number.isFinite(Number(c[1]))) {
    return [Number(c[0]), Number(c[1])];
  }
  return [127, 37.5];
}

export function isMapLibreAvailable() {
  return typeof window.maplibregl !== "undefined" && window.maplibregl?.Map;
}

export function disposeStadiumMap() {
  clearMarkers();
  if (mapInstance) {
    try {
      mapInstance.remove();
    } catch {
      /* noop */
    }
    mapInstance = null;
  }
}

/**
 * @param {HTMLElement} container
 * @param {{ center?: [number, number], zoom?: number, spots?: Array<{ id?: string, lng: number, lat: number, description?: string, kind?: string }> }} spec
 */
export function mountStadiumMap(container, spec) {
  if (!isMapLibreAvailable()) {
    container.innerHTML =
      '<p class="stadium-map-fallback muted">지도 라이브러리를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.</p>';
    return null;
  }

  disposeStadiumMap();
  container.innerHTML = "";

  const center = mapCenterFromSpec(spec);
  const zoom = Number.isFinite(spec.zoom) ? spec.zoom : 15;

  mapInstance = new window.maplibregl.Map({
    container,
    style: OPENFREEMAP_STYLE,
    center,
    zoom,
    attributionControl: true,
  });

  mapInstance.addControl(new window.maplibregl.NavigationControl({ showCompass: true }), "top-right");

  const spots = resolveStadiumSpots(spec);
  mapInstance.once("load", () => {
    for (const spot of spots) {
      const root = document.createElement("div");
      root.className = "stadium-map-spot-marker-root";
      root.setAttribute("role", "group");

      const pinEl = createPinMarkerElement(spot.kind, { draggable: false });
      const shortName = displaySpotName(spot);
      root.setAttribute("aria-label", `${shortName} 지점`);
      pinEl.setAttribute("aria-label", `${shortName} 위치`);
      pinEl.title = shortName;

      const nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = `stadium-map-spot-name stadium-map-spot-name--${spot.kind}`;
      nameBtn.textContent = shortName;
      nameBtn.title = "상세 정보";
      nameBtn.setAttribute("aria-label", `${shortName} 상세 정보`);

      root.appendChild(pinEl);
      root.appendChild(nameBtn);

      const titleHtml = escapeHtml(shortName);
      const desc = spot.description;
      const body =
        `<div class="stadium-map-spot-popup-wrap">` +
        `<h4 class="stadium-map-spot-popup-title">${titleHtml}</h4>` +
        (desc
          ? `<p class="stadium-map-spot-popup">${escapeHtml(desc)}</p>`
          : '<p class="stadium-map-spot-popup muted">설명이 없습니다.</p>') +
        `</div>`;

      const popup = new window.maplibregl.Popup({
        offset: [0, -6],
        maxWidth: "min(320px, 92vw)",
        anchor: "bottom",
      }).setHTML(body);

      const marker = new window.maplibregl.Marker({ element: root, anchor: "bottom" })
        .setLngLat([spot.lng, spot.lat])
        .setPopup(popup)
        .addTo(mapInstance);

      const toggle = () => {
        marker.togglePopup();
      };
      pinEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });
      nameBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });

      markers.push(marker);
    }
    mapInstance.resize();
  });

  return mapInstance;
}

export function resizeStadiumMap() {
  mapInstance?.resize();
}

