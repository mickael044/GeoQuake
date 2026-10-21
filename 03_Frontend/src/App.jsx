import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
const RADII = [10, 25, 50, 100, 250];
const ZOOM = { 10: 11, 25: 10, 50: 9, 100: 8, 250: 7 };
const DEFAULT_OPTS = { days: 365, minMag: 2.5, base: "osm", circle: true, legend: true, lang: "az" };
const DAYS = [1, 7, 30, 365];
const MAGS = [2.5, 3, 4, 5, 6];
const BASES = {
  osm: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors", maxZoom: 19 },
  topo: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)", maxZoom: 17 },
  sat: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri", maxZoom: 18 },
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
// Layihə versiyası (Semantic Versioning: MAJOR.MINOR.PATCH). Hər yeniləmədə burada dəyiş.
const APP_VERSION = "1.4.0";
const BAKU = [40.4093, 49.8671];
// ---------- Dillər / Languages ----------
const T = {
  az: {
    langName: "Azərbaycanca",
    placeholder: "Ərazi adı, məs. Baku", placeLabel: "Ərazi adı",
    search: "Axtar", searching: "Axtarılır...", nearMe: "📍 Mənə yaxın", nearMeTitle: "Mövqeyimə yaxın zəlzələlər",
    radiusLabel: "Radius (km)", menuBtn: "☰ Menyu",
    waking: "Server oyanır, bu 30–60 saniyə çəkə bilər…",
    loadFail: "Məlumat yüklənmədi. Server oyanır ola bilər — 30–60 saniyədən sonra yenidən cəhd edin.",
    enterPlace: "Ərazi adı daxil edin.", notFound: (n) => `"${n}" tapılmadı. Başqa ad yoxlayın.`,
    noGeo: "Brauzeriniz geolokasiyanı dəstəkləmir.", geoDenied: "Mövqe icazəsi verilmədi. Ərazi adı ilə axtarın.",
    selectedPoint: "Seçilmiş nöqtə",
    time: "Vaxt", coords: "Koordinat", depth: "Dərinlik", distance: "Məsafə", away: "uzaqda",
    listTitle: "Yaxın zəlzələlər", sortLabel: "Sıralama", onlyOnMap: "Yalnız xəritədə görünənlər",
    sorts: { time: "Ən yeni", mag: "Ən güclü", dist: "Ən yaxın" },
    legendDepthAria: "Rəng dərinliyi göstərir", legendDepth: "Rəng = dərinlik (km):",
    legendSizeAria: "Ölçü magnitude göstərir", legendSize: "Ölçü = magnitude:",
    hintStart: "Ərazi adı yazıb Axtar düyməsinə basın və ya “Mənə yaxın” seçin.",
    noResults: (r) => `Bu ərazidə ${r} km radiusda zəlzələ tapılmadı.`,
    noneVisible: "Xəritənin görünən hissəsində zəlzələ yoxdur.",
    agoMin: "dəq əvvəl", agoHour: "saat əvvəl", agoDay: "gün əvvəl",
    menu: "Menyu", close: "Bağla", options: "Seçimlər",
    language: "Dil",
    period: "Zaman dövrü", days: { 1: "Son 24 saat", 7: "Son 7 gün", 30: "Son 30 gün", 365: "Son 1 il" },
    minMag: "Minimum magnitude", mapType: "Xəritə növü",
    bases: { osm: "Küçə xəritəsi (OpenStreetMap)", topo: "Relyef (OpenTopoMap)", sat: "Peyk (Esri)" },
    showCircle: "Radius dairəsini göstər", showLegend: "Rəng və ölçü izahını göstər", reset: "Defolt ayarlara qayıt",
    about: "Haqqında",
    aboutText: "GeoQuake zəlzələ məlumatlarını göstərir; zəlzələnin nə vaxt baş verəcəyini proqnozlaşdırmır.",
    srcQuakes: "Zəlzələ məlumatı", srcMap: "Xəritə", srcSearch: "Ərazi axtarışı",
    contact: "Developerlə əlaqə", contactText: "Sual, təklif və ya xəta barədə yaza bilərsiniz.",
    developer: "Developer", email: "E-poçt", linkedin: "LinkedIn",
    version: "Versiya",
  },
  en: {
    langName: "English",
    placeholder: "Place name, e.g. Baku", placeLabel: "Place name",
    search: "Search", searching: "Searching...", nearMe: "📍 Near me", nearMeTitle: "Earthquakes near my location",
    radiusLabel: "Radius (km)", menuBtn: "☰ Menu",
    waking: "The server is waking up, this can take 30–60 seconds…",
    loadFail: "Could not load data. The server may still be waking up — please try again in 30–60 seconds.",
    enterPlace: "Please enter a place name.", notFound: (n) => `"${n}" was not found. Try another name.`,
    noGeo: "Your browser does not support geolocation.", geoDenied: "Location permission was denied. Search by place name instead.",
    selectedPoint: "Selected point",
    time: "Time", coords: "Coordinates", depth: "Depth", distance: "Distance", away: "away",
    listTitle: "Nearby earthquakes", sortLabel: "Sort by", onlyOnMap: "Only those visible on the map",
    sorts: { time: "Newest", mag: "Strongest", dist: "Nearest" },
    legendDepthAria: "Color shows depth", legendDepth: "Color = depth (km):",
    legendSizeAria: "Size shows magnitude", legendSize: "Size = magnitude:",
    hintStart: "Type a place name and press Search, or choose “Near me”.",
    noResults: (r) => `No earthquakes found within ${r} km of this location.`,
    noneVisible: "No earthquakes in the visible part of the map.",
    agoMin: "min ago", agoHour: "h ago", agoDay: "d ago",
    menu: "Menu", close: "Close", options: "Options",
    language: "Language",
    period: "Time period", days: { 1: "Last 24 hours", 7: "Last 7 days", 30: "Last 30 days", 365: "Last year" },
    minMag: "Minimum magnitude", mapType: "Map type",
    bases: { osm: "Street map (OpenStreetMap)", topo: "Terrain (OpenTopoMap)", sat: "Satellite (Esri)" },
    showCircle: "Show radius circle", showLegend: "Show color and size legend", reset: "Reset to defaults",
    about: "About",
    aboutText: "GeoQuake shows earthquake data; it does not predict when an earthquake will happen.",
    srcQuakes: "Earthquake data", srcMap: "Map", srcSearch: "Place search",
    contact: "Contact the developer", contactText: "Questions, suggestions or bug reports are welcome.",
    developer: "Developer", email: "Email", linkedin: "LinkedIn",
    version: "Version",
  },
};

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
const fmtDate = (iso, lang) => new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "az-AZ");
const fmtDepth = (d) => (d == null ? "?" : Number(d).toFixed(1).replace(/\.0$/, ""));
const usgsLink = (id) => `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`;
const fmtCoord = (lat, lon) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? "E" : "W"}`;
function ago(iso, t) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (min < 60) return `${min} ${t.agoMin}`;
  if (min < 1440) return `${Math.round(min / 60)} ${t.agoHour}`;
  return `${Math.round(min / 1440)} ${t.agoDay}`;
}
const SORTS = {
  time: { fn: (a, b) => new Date(b.time) - new Date(a.time) },
  mag: { fn: (a, b) => (b.magnitude ?? -1) - (a.magnitude ?? -1) },
  dist: { fn: (a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0) },
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
  const t = T[opts.lang] || T.az;
  const [map, setMap] = useState(null);
  const markers = useRef({});

  // Render serverini əvvəlcədən oyat; 3 saniyədən çox çəksə istifadəçiyə bildir
  useEffect(() => {
    let done = false;
    const timer = setTimeout(() => !done && setWaking(true), 3000);
    axios
      .get(`${API}/health`, { timeout: TIMEOUT })
      .catch(() => {})
      .finally(() => {
        done = true;
        clearTimeout(timer);
        setWaking(false);
      });
    return () => clearTimeout(timer);
  }, []);

  async function run(task) {
    setLoading(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e.userMessage || t.loadFail);
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
      setError(t.enterPlace);
      return;
    }
    run(async () => {
      const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: name, format: "json", limit: 1 },
      });
      if (!geo.data.length) {
        setQuakes([]);
        const err = new Error("not found");
        err.userMessage = t.notFound(name);
        throw err;
      }
      await fetchQuakes(parseFloat(geo.data[0].lat), parseFloat(geo.data[0].lon), radius);
    });
  }

  function nearMe() {
    if (!navigator.geolocation) {
      setError(t.noGeo);
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => run(() => fetchQuakes(pos.coords.latitude, pos.coords.longitude, radius)),
      () => {
        setLoading(false);
        setError(t.geoDenied);
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
    document.documentElement.lang = opts.lang;
  }, [opts.lang]);

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
            placeholder={t.placeholder}
            aria-label={t.placeLabel}
          />
          <button onClick={search} disabled={loading}>
            {loading ? t.searching : t.search}
          </button>
          <button className="near" onClick={nearMe} disabled={loading} title={t.nearMeTitle}>
            {t.nearMe}
          </button>
        </div>
        <div className="radii" role="group" aria-label={t.radiusLabel}>
          {RADII.map((r) => (
            <button key={r} className={r === radius ? "active" : ""} onClick={() => changeRadius(r)} disabled={loading}>
              {r} km
            </button>
          ))}
        </div>
        <button className="menubtn" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" aria-expanded={menuOpen}>
          {t.menuBtn}
        </button>
      </header>

      {waking && <p className="notice">{t.waking}</p>}
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
                <Popup>{t.selectedPoint}</Popup>
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
                    <tr><th>{t.time}</th><td>{fmtDate(q.time, opts.lang)}</td></tr>
                    <tr><th>{t.coords}</th><td>{fmtCoord(q.latitude, q.longitude)}</td></tr>
                    <tr><th>{t.depth}</th><td>{fmtDepth(q.depth)} km</td></tr>
                    <tr><th>{t.distance}</th><td>{q.distance_km} km</td></tr>
                  </tbody>
                </table>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <aside className="list">
          <h2>
            {t.listTitle} ({visible.length}
            {visible.length !== quakes.length ? ` / ${quakes.length}` : ""})
          </h2>
          <div className="listtools">
            <label>
              {t.sortLabel}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{t.sorts[k]}</option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={onlyOnMap} onChange={(e) => setOnlyOnMap(e.target.checked)} />
              {t.onlyOnMap}
            </label>
          </div>
          {opts.legend && (<>
          <div className="legend" aria-label={t.legendDepthAria}>
            <b>{t.legendDepth}</b>
            {DEPTHS.map((l) => (
              <span key={l.label}>
                <i style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
          <div className="legend" aria-label={t.legendSizeAria}>
            <b>{t.legendSize}</b>
            {SIZE_SAMPLES.map((m) => (
              <span key={m}>
                <i className="sz" style={{ width: 2 * markerSize(m), height: 2 * markerSize(m) }} /> M{m}
              </span>
            ))}
          </div>
          </>)}
          {!searched && <p className="hint">{t.hintStart}</p>}
          {searched && quakes.length === 0 && <p className="hint">{t.noResults(radius)}</p>}
          {searched && quakes.length > 0 && visible.length === 0 && <p className="hint">{t.noneVisible}</p>}
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
                      {ago(q.time, t)} · {fmtDate(q.time, opts.lang)}
                    </div>
                    <div className="meta">
                      {t.depth}: {fmtDepth(q.depth)} km · {q.distance_km} km {t.away}
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
          <aside className="drawer" role="dialog" aria-modal="true" aria-label={t.menu} onClick={(e) => e.stopPropagation()}>
            <div className="drawerhead">
              <h2>{t.menu}</h2>
              <button onClick={() => setMenuOpen(false)} aria-label={t.close} autoFocus>✕</button>
            </div>

            <h3>{t.options}</h3>
            <label className="opt">
              {t.language}
              <select value={opts.lang} onChange={(e) => changeOpt({ lang: e.target.value })}>
                <option value="az">{T.az.langName}</option>
                <option value="en">{T.en.langName}</option>
              </select>
            </label>
            <label className="opt">
              {t.period}
              <select value={opts.days} onChange={(e) => changeOpt({ days: Number(e.target.value) })}>
                {DAYS.map((d) => <option key={d} value={d}>{t.days[d]}</option>)}
              </select>
            </label>
            <label className="opt">
              {t.minMag}
              <select value={opts.minMag} onChange={(e) => changeOpt({ minMag: Number(e.target.value) })}>
                {MAGS.map((m) => <option key={m} value={m}>{m}+</option>)}
              </select>
            </label>
            <label className="opt">
              {t.mapType}
              <select value={opts.base} onChange={(e) => changeOpt({ base: e.target.value })}>
                {Object.keys(BASES).map((k) => <option key={k} value={k}>{t.bases[k]}</option>)}
              </select>
            </label>
            <label className="opt check">
              <input type="checkbox" checked={opts.circle} onChange={(e) => changeOpt({ circle: e.target.checked })} />
              {t.showCircle}
            </label>
            <label className="opt check">
              <input type="checkbox" checked={opts.legend} onChange={(e) => changeOpt({ legend: e.target.checked })} />
              {t.showLegend}
            </label>
            <button className="reset" onClick={() => changeOpt({ ...DEFAULT_OPTS, lang: opts.lang })}>{t.reset}</button>

            <h3>{t.about}</h3>
            <p className="aboutp">
              {t.aboutText}
            </p>
            <ul className="aboutl">
              <li>{t.srcQuakes}: <a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">USGS</a></li>
              <li>{t.srcMap}: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></li>
              <li>{t.srcSearch}: Nominatim</li>
              <li><a href="https://github.com/mickael044/GeoQuake" target="_blank" rel="noreferrer">GitHub</a></li>
            </ul>

            <h3>{t.contact}</h3>
            <p className="aboutp">{t.contactText}</p>
            <ul className="aboutl">
              <li>{t.developer}: Mikayil Hasanov</li>
              <li>
                {t.email}: <a href={`mailto:${CONTACT_EMAIL}?subject=GeoQuake`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                {t.linkedin}: <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">Mikayil Hasanov</a>
              </li>
            </ul>

            <p className="aboutp" style={{ marginTop: 24, color: "#5d7183" }}>
              GeoQuake · {t.version}: v{APP_VERSION}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
