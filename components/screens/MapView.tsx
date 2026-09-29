import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildDayMap, buildTripMap, type MapModel } from '@/lib/map';
import { rangeShort } from '@/lib/format';
import { C, mono, rule, sans, serif } from '@/lib/theme';
import type { Settings, Stop, Trip, TripMeta } from '@/lib/types';

// OpenStreetMap by default. The public OSM tile server is fine for light personal use; for real
// traffic point NEXT_PUBLIC_MAP_TILES at a tile provider (and set NEXT_PUBLIC_MAP_ATTRIBUTION).
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILES || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

interface Placed {
  marker: L.Marker;
  label: HTMLElement;
  anchor?: 'start' | 'end';
}

/** A marker built from DOM nodes with textContent, so trip text can never inject HTML. */
function markerIcon(n: string, label: string, fill: string): { icon: L.DivIcon; label: HTMLElement } {
  const root = document.createElement('div');
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.style.background = fill;
  dot.textContent = n;
  const lab = document.createElement('div');
  lab.className = 'label';
  lab.textContent = label;
  root.append(dot, lab);
  return { icon: L.divIcon({ className: 'tc-mk', html: root, iconSize: [0, 0] }), label: lab };
}

/** Length of a "nice" scale bar (1, 2 or 5 × 10^n metres) that fits in ~100px. */
function niceScale(metresPer100px: number): { label: string; width: number } {
  const pow = Math.pow(10, Math.floor(Math.log10(metresPer100px)));
  const d = [5, 2, 1].map((k) => k * pow).find((v) => v <= metresPer100px) ?? pow;
  return { label: d >= 1000 ? d / 1000 + ' km' : d + ' m', width: Math.round((d / metresPer100px) * 100) };
}

export function MapView({
  meta,
  trip,
  dayIdx,
  mode,
  settings,
  onMode,
  onPickDay,
  onCity,
  onStop,
}: {
  meta: TripMeta;
  trip: Trip;
  dayIdx: number;
  mode: 'day' | 'trip';
  settings: Settings;
  onMode: (m: 'day' | 'trip') => void;
  onPickDay: (i: number) => void;
  onCity: (dayIdx: number) => void;
  onStop: (s: Stop) => void;
}) {
  const accent = settings.accent;
  const day = trip.days[dayIdx];
  const model: MapModel = useMemo(
    () => (mode === 'trip' ? buildTripMap(trip, `${meta.name} · ${rangeShort(meta.start, meta.end)}`) : buildDayMap(trip, day, accent)),
    [mode, trip, day, meta, accent],
  );

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const placedRef = useRef<Placed[]>([]);
  const handlers = useRef({ onCity, onStop });
  useEffect(() => {
    handlers.current = { onCity, onStop };
  });
  const [scale, setScale] = useState({ label: '', width: 0 });

  // Label side and crowding depend on where markers sit on screen, so recompute after every move.
  const relabel = () => {
    const map = mapRef.current;
    if (!map) return;
    const size = map.getSize();
    const pts = placedRef.current.map((p) => map.latLngToContainerPoint(p.marker.getLatLng()));
    placedRef.current.forEach((p, i) => {
      const left = p.anchor ? p.anchor === 'end' : pts[i].x > size.x / 2;
      p.label.classList.toggle('left', left);
      p.label.classList.toggle('hide', pts.slice(0, i).some((o) => o.distanceTo(pts[i]) < 30));
    });
    const c = size.divideBy(2);
    const m = map.containerPointToLatLng(c).distanceTo(map.containerPointToLatLng(c.add([100, 0])));
    if (m > 0) setScale(niceScale(m));
  };

  // Create the map once.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const map = L.map(el, { zoomControl: false, attributionControl: false, minZoom: 2, zoomSnap: 0.25 });
    L.tileLayer(TILE_URL, { maxZoom: 19, className: 'map-tiles', attribution: ATTRIBUTION }).addTo(map);
    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.setView([26, 32], 5);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on('moveend zoomend resize', relabel);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      placedRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw routes and markers whenever the model changes.
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.clearLayers();
    placedRef.current = [];
    model.routes.forEach((r) =>
      L.polyline(r.pts, { color: accent, weight: 2.5, dashArray: r.dash, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(group),
    );
    model.markers.forEach((k, i) => {
      const { icon, label } = markerIcon(k.n, k.label, k.fill);
      const marker = L.marker(k.ll, { icon, keyboard: false, zIndexOffset: i }).addTo(group);
      marker.on('click', () => {
        if (k.stop) handlers.current.onStop(k.stop);
        else if (k.day != null) handlers.current.onCity(k.day);
      });
      placedRef.current.push({ marker, label, anchor: k.anchor });
    });
    relabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, accent]);

  // Re-fit the view when the trip, mode or day changes (not on every edit to the same view).
  const fitKey = `${trip.id}|${mode}|${dayIdx}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !model.bounds.length) return;
    map.invalidateSize();
    const h = map.getSize().y;
    const top = Math.min(mode === 'day' ? 150 : 110, h * 0.25);
    const bottom = Math.min(210, h * 0.32);
    map.fitBounds(L.latLngBounds(model.bounds), { paddingTopLeft: [48, top], paddingBottomRight: [48, bottom], maxZoom: 16, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 'none',
    whiteSpace: 'nowrap',
    padding: '8px 16px',
    borderRadius: 6,
    font: sans(500, 12.5),
    cursor: 'pointer',
    background: active ? C.dark : 'transparent',
    color: active ? C.darkText : C.ink,
  });
  const pick = (c: { stop?: Stop; day?: number }) => {
    if (c.stop) onStop(c.stop);
    else if (c.day != null) onCity(c.day);
  };

  return (
    <div style={{ position: 'absolute', inset: '0 0 var(--tabbar) 0', overflow: 'hidden', background: C.sand }}>
      <div ref={elRef} className="map-root" style={{ position: 'absolute', inset: 0, zIndex: 0, isolation: 'isolate' }} />

      <div style={{ position: 'absolute', zIndex: 5, top: 'var(--top)', left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', padding: 3, borderRadius: 8, background: 'rgba(255,255,255,.92)', border: `1px solid ${rule(0.1)}`, pointerEvents: 'auto' }}>
            <div onClick={() => onMode('day')} style={seg(mode === 'day')}>Day</div>
            <div onClick={() => onMode('trip')} style={seg(mode === 'trip')}>Whole trip</div>
          </div>
          {scale.label && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                font: mono(500, 10.5),
                letterSpacing: '.06em',
                color: C.muted,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,.92)',
              }}
            >
              <span style={{ width: scale.width, height: 5, borderBottom: `1.5px solid ${C.muted}`, borderLeft: `1.5px solid ${C.muted}`, borderRight: `1.5px solid ${C.muted}` }} />
              {scale.label}
            </div>
          )}
        </div>
        {mode === 'day' && (
          <div className="scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -16px', padding: '0 16px', pointerEvents: 'auto' }}>
            {trip.days.map((d, i) => {
              const sel = i === dayIdx;
              const dd = new Date(meta.start + 'T00:00');
              dd.setDate(dd.getDate() + d.num - 1);
              return (
                <div
                  key={d.num}
                  onClick={() => onPickDay(i)}
                  style={{
                    flex: 'none',
                    whiteSpace: 'nowrap',
                    padding: '7px 10px',
                    borderRadius: 8,
                    font: mono(500, 11),
                    cursor: 'pointer',
                    background: sel ? C.dark : 'rgba(255,255,255,.92)',
                    color: sel ? C.darkText : C.ink,
                    border: `1px solid ${rule(0.1)}`,
                  }}
                >
                  D{d.num} · {dd.getDate()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, bottom: 14, pointerEvents: 'none' }}>
        <div style={{ padding: '0 18px 8px', font: serif(22, 1.1), textShadow: `0 0 8px ${C.sand}, 0 0 8px ${C.sand}` }}>{model.title}</div>
        <div className="scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 2px', pointerEvents: 'auto' }}>
          {model.cards.map((c, i) => (
            <div
              key={i}
              onClick={() => pick(c)}
              style={{
                flex: 'none',
                width: 210,
                padding: '12px 14px',
                borderRadius: 12,
                background: C.card,
                border: `1px solid ${rule(0.1)}`,
                boxShadow: '0 6px 18px rgba(34,36,40,.08)',
                cursor: 'pointer',
                display: 'flex',
                gap: 11,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: c.fill,
                  color: C.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: mono(500, 11),
                }}
              >
                {c.n}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: mono(400, 11.5), color: C.muted }}>{c.time}</div>
                <div style={{ marginTop: 5, font: serif(16, 1.15) }}>{c.title}</div>
                <div style={{ marginTop: 3, font: sans(400, 11.5, 1.3), color: C.muted }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
