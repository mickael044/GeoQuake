import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
const RADII = [10, 25, 50, 100, 250];
const ZOOM = { 10: 11, 25: 10, 50: 9, 100: 8, 250: 7 };
const BAKU = [40.4093, 49.8671];
const TIMEOUT = 90000; // Render pulsuz planında oyanma 30-60 san çəkə bilər

const LEGEND = [
  { color: "#388e3c", label: "< 3" },
  { color: "#fbc02d", label: "3 – 3.9" },
  { color: "#f57c00", label: "4 – 4.9" },
  { color: "#d32f2f", label: "5 – 5.9" },
  { color: "#7f0000", label: "6+" },
];
const magColor = (m) => (m >= 6 ? "#7f0000" : m >= 5 ? "#d32f2f" : m >= 4 ? "#f57c00" : m >= 3 ? "#fbc02d" : "#388e3c");
const markerSize = (m) => 4 + (m || 0) * 2;
const fmtDate = (iso) => new Date(iso).toLocaleString("az-AZ");

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
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

  async function fetchQuakes(lat, lon, r) {
    const res = await axios.get(`${API}/earthquakes/nearby`, {
      params: { lat, lon, radius_km: r },
      timeout: TIMEOUT,
    });
    setPoint({ lat, lon });
    setQuakes(res.data);
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
      </header>

      {waking && <p className="notice">Server oyanır, bu 30–60 saniyə çəkə bilər…</p>}
      {error && <p className="error">{error}</p>}

      <main className="content">
        <MapContainer center={center} zoom={ZOOM[radius]} className="map">
          <Recenter center={center} zoom={ZOOM[radius]} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {point && (
            <>
              <Circle center={center} radius={radius * 1000} pathOptions={{ color: "#1d6fd8", weight: 1, fillOpacity: 0.05 }} />
              <CircleMarker center={center} radius={6} pathOptions={{ color: "#1d6fd8", fillColor: "#1d6fd8", fillOpacity: 1 }}>
                <Popup>Seçilmiş nöqtə</Popup>
              </CircleMarker>
            </>
          )}
          {quakes.map((q) => (
            <CircleMarker
              key={q.id}
              center={[q.latitude, q.longitude]}
              radius={markerSize(q.magnitude)}
              pathOptions={{ color: magColor(q.magnitude), fillColor: magColor(q.magnitude), fillOpacity: 0.55 }}
            >
              <Popup>
                <b>M {q.magnitude ?? "?"}</b> — {q.place}
                <br />
                Depth: {q.depth} km
                <br />
                Məsafə: {q.distance_km} km
                <br />
                {fmtDate(q.time)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <aside className="list">
          <h2>Yaxın zəlzələlər ({quakes.length})</h2>
          <div className="legend" aria-label="Magnitude rəngləri">
            {LEGEND.map((l) => (
              <span key={l.label}>
                <i style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
          {!searched && <p className="hint">Ərazi adı yazıb Search düyməsinə basın və ya “Near me” seçin.</p>}
          {searched && quakes.length === 0 && <p className="hint">Bu ərazidə {radius} km radiusda zəlzələ tapılmadı.</p>}
          <ul>
            {quakes.map((q) => (
              <li key={q.id}>
                <span className="mag" style={{ color: magColor(q.magnitude) }}>
                  M {q.magnitude ?? "?"}
                </span>
                <div>
                  <div className="place">{q.place}</div>
                  <div className="meta">
                    Depth: {q.depth} km · {q.distance_km} km uzaqda · {fmtDate(q.time)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
