import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

interface Spot {
  id?: string;
  lng: number;
  lat: number;
  name?: string;
  description?: string;
  kind?: string;
}

interface StadiumMapProps {
  spots: Spot[];
  center: number[];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  focusedSpotId?: string;
  onPinClick?: (spotId: string) => void;
}

function pinSvgHtml(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="26" height="34" aria-hidden="true" focusable="false">
  <path fill="${fill}" stroke="#ffffff" stroke-width="1.25" stroke-linejoin="round" d="M16 2C9.2 2 4 7.4 4 14.2c0 8.8 12 25.8 12 25.8s12-17 12-25.8C28 7.4 22.8 2 16 2z"/>
  <circle cx="16" cy="14.5" r="4.2" fill="#ffffff"/>
  <circle cx="16" cy="14.5" r="2" fill="${fill}"/>
</svg>`;
}

const KIND_FILL: Record<string, string> = {
  stadium: "#c2410c",
  parking: "#1d4ed8",
  transit: "#16a34a",
  bus: "#7c3aed",
};

const KIND_LABEL: Record<string, string> = {
  stadium: "구장",
  parking: "주차",
  transit: "지하철·기차",
  bus: "버스정류장",
};

function spotKind(raw: string | undefined, index: number): string {
  const k = (raw || "").toLowerCase();
  if (k === "stadium" || k === "ballpark") return "stadium";
  if (k === "parking" || k === "lot") return "parking";
  if (k === "transit" || k === "subway" || k === "train") return "transit";
  if (k === "bus" || k === "busstop") return "bus";
  return index === 0 ? "stadium" : "parking";
}

export default function StadiumMap({ spots, center, zoom = 15, className, style, focusedSpotId, onPinClick }: StadiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; popup: maplibregl.Popup }>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: OPENFREEMAP_STYLE,
      center: center as [number, number],
      zoom,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    mapRef.current = map;
    const markers = markersRef.current;

    map.once("load", () => {
      for (let i = 0; i < spots.length; i++) {
        const spot = spots[i];
        const kind = spotKind(spot.kind, i);
        const fill = KIND_FILL[kind] || "#6b7280";
        const label = KIND_LABEL[kind] || "";

        const el = document.createElement("div");
        el.innerHTML = pinSvgHtml(fill);
        el.firstElementChild?.setAttribute("aria-label", spot.name || label);
        el.style.cursor = "pointer";

        const popupBody = document.createElement("div");
        const nameEl = document.createElement("h4");
        nameEl.textContent = spot.name || label;
        nameEl.style.cssText = "margin:0 0 4px;font-size:13px";
        popupBody.appendChild(nameEl);
        if (spot.description) {
          const descEl = document.createElement("p");
          descEl.textContent = spot.description;
          descEl.style.cssText = "margin:0;font-size:12px;color:#666";
          popupBody.appendChild(descEl);
        }

        const popup = new maplibregl.Popup({ offset: [0, -6], maxWidth: "280px" }).setDOMContent(popupBody);

        const marker = new maplibregl.Marker({ element: el.firstElementChild as HTMLElement, anchor: "bottom" })
          .setLngLat([spot.lng, spot.lat])
          .setPopup(popup)
          .addTo(map);

        const spotId = spot.id || String(i);
        markers.set(spotId, { marker, popup });

        el.firstElementChild?.addEventListener("click", () => {
          marker.togglePopup();
          onPinClick?.(spotId);
        });
      }
      map.resize();
    });

    map.on("error", () => {
      /* ignore tile errors silently */
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // Fly to focused spot when focusedSpotId changes
  useEffect(() => {
    if (!focusedSpotId || !mapRef.current) return;
    const entry = markersRef.current.get(focusedSpotId);
    if (!entry) return;

    const { marker, popup } = entry;
    const lngLat = marker.getLngLat();

    mapRef.current.flyTo({ center: lngLat, zoom: Math.max(mapRef.current.getZoom(), 16), duration: 600 });

    // Close other popups, open this one
    markersRef.current.forEach((e) => {
      if (e.marker !== marker) e.popup.remove();
    });
    if (!popup.isOpen()) {
      marker.togglePopup();
    }
  }, [focusedSpotId]);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden border border-border ${className || ""}`}
      style={{ height: 320, ...style }}
    />
  );
}
