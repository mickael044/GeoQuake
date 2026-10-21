import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
const RADII = [10, 25, 50, 100, 250];
const ZOOM = { 10: 11, 25: 10, 50: 9, 100: 8, 250: 7 };
const DEFAULT_OPTS = { days: 365, minMag: 2.5, base: "osm", circle: true, legend: true };
const DAYS = [{ v: 1, l: "Son 24 saat" }, { v: 7, l: "Son 7 gün" }, { v: 30, l: "Son 30 gün" }, { v: 365, l: "Son 1 il" }];
const MAGS = [2.5, 3, 4, 5, 6];
const BASES = {
  osm: { label: "Küçə xəritəsi (OpenStreetMap)", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors", maxZoom: 19 },
  topo: { label: "Relyef (OpenTopoMap)", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)", maxZoom: 17 },
  sat: { label: "Peyk (Esri)", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri", maxZoom: 18 },
};
function loadOpts() {
  try {
    return { ...DEFAULT_OPTS, ...JSON.parse(localStorage.getItem("geoquake.opts") || "{}") };
  } catch {
    return DEFAULT_OPTS;
  }
}
function saveOpts(o) {
  try {
    localStorage.setItem("geoquake.opts", JSON.stringify(o));
  } catch {
    /* brauzer saxlamağa icazə vermir — vacib deyil */
  }
}
// Developerlə əlaqə (Menu → Developerlə əlaqə)
const CONTACT_EMAIL = "mikayilhesenov2007@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/mikayil-hasanov-23b1b1385/";
const BAKU = [40.4093, 49.8671];
const TIMEOUT = 90000; // Render pulsuz planında oyanma 30-60 san çəkə bilər

// Rəng = dərinlik (dərin → tünd), ölçü = magnitude
const DEPTHS = [
  { max: 10, color: "#fff2a8", label: "0–10" },
  { max: 30, color: "#fdbf6f", label: "10–30" },
  { max: 70, color: "#f4793a", label: "30–70" },
  { max: 300, color: "#b2282e", label: "70–300" },
  { max: Infinity, color: "#4b0a2b", label: "300+" },
];
const depthColor = (d) => (DEPTHS.find((x) => (d ?? 0) < x.max) || DEPTHS[DEPTHS.length - 1]).color;
const markerSize = (m) => Math.max(4, Math.pow(m || 0, 1.6)); // M3≈6, M5≈13, M7≈22
const SIZE_SAMPLES = [3, 5, 7];
const fmtDate = (iso) => new Date(iso).toLocaleString("az-AZ");
const fmtDepth = (d) => (d == null ? "?" : Number(d).toFixed(1).replace(/\.0$/, ""));
const usgsLink = (id) => `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`;
const fmtCoord = (lat, lon) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? "E" : "W"}`;
function ago(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (min < 60) return `${min} dəq əvvəl`;
  if (min < 1440) return `${Math.round(min / 60)} saat əvvəl`;
  return `${Math.round(min / 1440)} gün əvvəl`;
}
const SORTS = {
  time: { label: "Ən yeni", fn: (a, b) => new Date(b.time) - new Date(a.time) },
  mag: { label: "Ən güclü", fn: (a, b) => (b.magnitude ?? -1) - (a.magnitude ?? -1) },
  dist: { label: "Ən yaxın", fn: (a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0) },
};

function Recenter({ lat, lon, zoom, focusKey }) {
  const map = useMap();
  // Yalnız yeni axtarış və ya radius dəyişəndə işləyir; istifadəçinin sürüşdürməsi/zoom-u bunu tetikləmir
  useEffect(() => {
    map.setView([lat, lon], zoom);
  }, [lat, lon, zoom, focusKey, map]);
  return null;
}

function BoundsTracker({ onBounds }) {
  const map = useMapEvents({ moveend: () => onBounds(map.getBounds()) });
  useEffect(() => onBounds(map.getBounds()), [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [point, setPoint] = useState(null); // { lat, lon }
  const [radius, setRadius] = useState(100);
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [sort, setSort] = useState("time");
  const [onlyOnMap, setOnlyOnMap] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [focusKey, setFocusKey] = useState(0);
  const [opts, setOpts] = useState(loadOpts);
  const [menuOpen, setMenuOpen] = useState(false);
  const [map, setMap] = useState(null);
  const markers = useRef({});

  // Render serverini əvvəlcədən oyat; 3 saniyədən çox çəksə istifadəçiyə bildir
  useEffect(() => {
    let done = false;
    const t = setTimeout(() => !done && setWaking(true), 3000);
    axios
      .get(`${API}/health`, { timeout: TIMEOUT })
      .catch(() => {})
      .finally(() => {
        done = true;
        clearTimeout(t);
        setWaking(false);
      });
    return () => clearTimeout(t);
  }, []);

  async function run(task) {
    setLoading(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e.userMessage || "Məlumat yüklənmədi. Server oyanır ola bilər — 30–60 saniyədən sonra yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuakes(lat, lon, r, o = opts) {
    const res = await axios.get(`${API}/earthquakes/nearby`, {
      params: { lat, lon, radius_km: r, days: o.days, min_magnitude: o.minMag },
      timeout: TIMEOUT,
    });
    setPoint({ lat, lon });
    setQuakes(res.data);
    setSelectedId(null);
    setFocusKey((k) => k + 1);
    setSearched(true);
  }

  function search() {
    const name = query.trim();
    if (!name) {
      setError("Ərazi adı daxil edin.");
      return;
    }
    run(async () => {
      const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: name, format: "json", limit: 1 },
      });
      if (!geo.data.length) {
        setQuakes([]);
        const err = new Error("not found");
        err.userMessage = `"${name}" tapılmadı. Başqa ad yoxlayın.`;
        throw err;
      }
      await fetchQuakes(parseFloat(geo.data[0].lat), parseFloat(geo.data[0].lon), radius);
    });
  }

  function nearMe() {
    if (!navigator.geolocation) {
      setError("Brauzeriniz geolokasiyanı dəstəkləmir.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => run(() => fetchQuakes(pos.coords.latitude, pos.coords.longitude, radius)),
      () => {
        setLoading(false);
        setError("Mövqe icazəsi verilmədi. Ərazi adı ilə axtarın.");
      },
      { timeout: 10000 }
    );
  }

  function changeRadius(r) {
    setRadius(r);
    if (point) run(() => fetchQuakes(point.lat, point.lon, r));
  }

  function changeOpt(patch) {
    const next = { ...opts, ...patch };
    setOpts(next);
    saveOpts(next);
    // Dövr və minimum magnitude məlumatı dəyişir -> yenidən yüklə
    if (point && ("days" in patch || "minMag" in patch)) run(() => fetchQuakes(point.lat, point.lon, radius, next));
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const visible = useMemo(() => {
    const list = onlyOnMap && bounds ? quakes.filter((q) => bounds.contains([q.latitude, q.longitude])) : quakes;
    return [...list].sort(SORTS[sort].fn);
  }, [quakes, sort, onlyOnMap, bounds]);

  function selectQuake(q) {
    setSelectedId(q.id);
    if (map) {
      map.setView([q.latitude, q.longitude], Math.max(map.getZoom(), 9));
      markers.current[q.id]?.openPopup();
    }
  }

  const center = point ? [point.lat, point.lon] : BAKU;

  return (
    <div className="app">
      <header className="bar">
        <h1>GeoQuake</h1>
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Ərazi adı, məs. Baku"
            aria-label="Ərazi adı"
          />
          <button onClick={search} disabled={loading}>
            {loading ? "Axtarılır..." : "Search"}
          </button>
          <button className="near" onClick={nearMe} disabled={loading} title="Mövqeyimə yaxın zəlzələlər">
            📍 Near me
          </button>
        </div>
        <div className="radii" role="group" aria-label="Radius (km)">
          {RADII.map((r) => (
            <button key={r} className={r === radius ? "active" : ""} onClick={() => changeRadius(r)} disabled={loading}>
              {r} km
            </button>
          ))}
        </div>
        <button className="menubtn" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" aria-expanded={menuOpen}>
          ☰ Menu
        </button>
      </header>

      {waking && <p className="notice">Server oyanır, bu 30–60 saniyə çəkə bilər…</p>}
      {error && <p className="error">{error}</p>}

      <main className="content">
        <MapContainer center={center} zoom={ZOOM[radius]} className="map" ref={setMap}>
          <BoundsTracker onBounds={setBounds} />
          <Recenter lat={center[0]} lon={center[1]} zoom={ZOOM[radius]} focusKey={focusKey} />
          <TileLayer key={opts.base} url={BASES[opts.base].url} attribution={BASES[opts.base].attr} maxZoom={BASES[opts.base].maxZoom} />
          {point && (
            <>
              {opts.circle && <Circle center={center} radius={radius * 1000} pathOptions={{ color: "#1d6fd8", weight: 1, fillOpacity: 0.05 }} />}
              <CircleMarker center={center} radius={6} pathOptions={{ color: "#1d6fd8", fillColor: "#1d6fd8", fillOpacity: 1 }}>
                <Popup>Seçilmiş nöqtə</Popup>
              </CircleMarker>
            </>
          )}
          {quakes.map((q) => (
            <CircleMarker
              key={q.id}
              ref={(el) => {
                if (el) markers.current[q.id] = el;
              }}
              center={[q.latitude, q.longitude]}
              radius={markerSize(q.magnitude)}
              pathOptions={{
                color: q.id === selectedId ? "#0b2545" : "#333",
                weight: q.id === selectedId ? 3 : 1,
                fillColor: depthColor(q.depth),
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => setSelectedId(q.id) }}
            >
              <Popup>
                <a href={usgsLink(q.id)} target="_blank" rel="noreferrer">
                  <b>M {q.magnitude ?? "?"}</b> — {q.place}
                </a>
                <table className="popup">
                  <tbody>
                    <tr><th>Vaxt</th><td>{fmtDate(q.time)}</td></tr>
                    <tr><th>Koordinat</th><td>{fmtCoord(q.latitude, q.longitude)}</td></tr>
                    <tr><th>Dərinlik</th><td>{fmtDepth(q.depth)} km</td></tr>
                    <tr><th>Məsafə</th><td>{q.distance_km} km</td></tr>
                  </tbody>
                </table>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <aside className="list">
          <h2>
            Yaxın zəlzələlər ({visible.length}
            {visible.length !== quakes.length ? ` / ${quakes.length}` : ""})
          </h2>
          <div className="listtools">
            <label>
              Sıralama
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={onlyOnMap} onChange={(e) => setOnlyOnMap(e.target.checked)} />
              Yalnız xəritədə görünənlər
            </label>
          </div>
          {opts.legend && (<>
          <div className="legend" aria-label="Rəng dərinliyi göstərir">
            <b>Rəng = dərinlik (km):</b>
            {DEPTHS.map((l) => (
              <span key={l.label}>
                <i style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
          <div className="legend" aria-label="Ölçü magnitude göstərir">
            <b>Ölçü = magnitude:</b>
            {SIZE_SAMPLES.map((m) => (
              <span key={m}>
                <i className="sz" style={{ width: 2 * markerSize(m), height: 2 * markerSize(m) }} /> M{m}
              </span>
            ))}
          </div>
          </>)}
          {!searched && <p className="hint">Ərazi adı yazıb Search düyməsinə basın və ya “Near me” seçin.</p>}
          {searched && quakes.length === 0 && <p className="hint">Bu ərazidə {radius} km radiusda zəlzələ tapılmadı.</p>}
          {searched && quakes.length > 0 && visible.length === 0 && <p className="hint">Xəritənin görünən hissəsində zəlzələ yoxdur.</p>}
          <ul>
            {visible.map((q) => (
              <li key={q.id} className={q.id === selectedId ? "sel" : ""}>
                <button className="item" onClick={() => selectQuake(q)}>
                  <span className="mag">
                    <i className="dot" style={{ background: depthColor(q.depth) }} />
                    M {q.magnitude ?? "?"}
                  </span>
                  <div>
                    <div className="place">{q.place}</div>
                    <div className="meta">
                      {ago(q.time)} · {fmtDate(q.time)}
                    </div>
                    <div className="meta">
                      Depth: {fmtDepth(q.depth)} km · {q.distance_km} km uzaqda
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="drawerhead">
              <h2>Menu</h2>
              <button onClick={() => setMenuOpen(false)} aria-label="Bağla" autoFocus>✕</button>
            </div>

            <h3>Options</h3>
            <label className="opt">
              Zaman dövrü
              <select value={opts.days} onChange={(e) => changeOpt({ days: Number(e.target.value) })}>
                {DAYS.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            </label>
            <label className="opt">
              Minimum magnitude
              <select value={opts.minMag} onChange={(e) => changeOpt({ minMag: Number(e.target.value) })}>
                {MAGS.map((m) => <option key={m} value={m}>{m}+</option>)}
              </select>
            </label>
            <label className="opt">
              Xəritə növü
              <select value={opts.base} onChange={(e) => changeOpt({ base: e.target.value })}>
                {Object.entries(BASES).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}
              </select>
            </label>
            <label className="opt check">
              <input type="checkbox" checked={opts.circle} onChange={(e) => changeOpt({ circle: e.target.checked })} />
              Radius dairəsini göstər
            </label>
            <label className="opt check">
              <input type="checkbox" checked={opts.legend} onChange={(e) => changeOpt({ legend: e.target.checked })} />
              Rəng və ölçü izahını göstər
            </label>
            <button className="reset" onClick={() => changeOpt(DEFAULT_OPTS)}>Defolt ayarlara qayıt</button>

            <h3>About</h3>
            <p className="aboutp">
              GeoQuake zəlzələ məlumatlarını göstərir; zəlzələnin nə vaxt baş verəcəyini proqnozlaşdırmır.
            </p>
            <ul className="aboutl">
              <li>Zəlzələ məlumatı: <a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">USGS</a></li>
              <li>Xəritə: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></li>
              <li>Ərazi axtarışı: Nominatim</li>
              <li><a href="https://github.com/mickael044/GeoQuake" target="_blank" rel="noreferrer">GitHub</a></li>
            </ul>

            <h3>Developerlə əlaqə</h3>
            <p className="aboutp">Sual, təklif və ya xəta barədə yaza bilərsiniz.</p>
            <ul className="aboutl">
              <li>Developer: Mikayil Hasanov</li>
              <li>
                E-poçt: <a href={`mailto:${CONTACT_EMAIL}?subject=GeoQuake`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                LinkedIn: <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">Mikayil Hasanov</a>
              </li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
