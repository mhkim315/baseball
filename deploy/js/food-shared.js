export const CATEGORY_COLORS = { chicken: "#dc2626", korean: "#ca8a04", western: "#2563eb", cafe: "#7c3aed" };

export const CATEGORY_ORDER = ["all", "chicken", "korean", "western", "cafe"];

export const DIRECTION_OFFSETS = {
  NW: { dx: -5.5, dy: -5.5 },
  N: { dx: 0, dy: -6.5 },
  NE: { dx: 5.5, dy: -5.5 },
  W: { dx: -6.5, dy: 0 },
  E: { dx: 6.5, dy: 0 },
  SW: { dx: -5.5, dy: 5.5 },
  S: { dx: 0, dy: 6.5 },
  SE: { dx: 5.5, dy: 5.5 },
};

export const DEFAULT_LABEL_DIRECTION = "E";

export function floorKey(store) {
  return String(store.floor || "기타").trim() || "기타";
}

export function categoryKey(store) {
  const raw = String(store.category || "cafe").trim();
  return raw in CATEGORY_COLORS ? raw : "cafe";
}

export function categoryColor(store) {
  return CATEGORY_COLORS[categoryKey(store)] || CATEGORY_COLORS.cafe;
}

export function floorSort(a, b) {
  const na = Number.parseFloat(String(a).replace(/[^0-9.]/g, "")) || 0;
  const nb = Number.parseFloat(String(b).replace(/[^0-9.]/g, "")) || 0;
  return na === nb ? String(a).localeCompare(String(b), "ko") : na - nb;
}

export function uniqueFloors(stores) {
  return [...new Set(stores.map(floorKey))].sort(floorSort);
}

export function renderTab(root, items, selected, onSelect) {
  if (!root) return;
  root.innerHTML = "";
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", item.id === selected ? "true" : "false");
    button.textContent = item.label;
    button.addEventListener("click", () => onSelect(item.id));
    root.appendChild(button);
  }
}

export function appendConnector(layer, coords, color, className = "food-marker-connector") {
  const left = Number(coords.left ?? coords.leftPct) || 0;
  const top = Number(coords.top ?? coords.topPct) || 0;
  const labelLeft = Number(coords.labelLeft ?? coords.labelLeftPct) || 0;
  const labelTop = Number(coords.labelTop ?? coords.labelTopPct) || 0;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", `${left}%`);
  line.setAttribute("y1", `${top}%`);
  line.setAttribute("x2", `${labelLeft}%`);
  line.setAttribute("y2", `${labelTop}%`);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "2.5");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(line);
  layer.appendChild(svg);
}
