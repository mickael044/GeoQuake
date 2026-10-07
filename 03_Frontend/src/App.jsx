import { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

function Recenter({ center }) {
  const map = useMap();
  map.setView(center, 7);
  return null;
}

const fmtDate = (iso) => new Date(iso).toLocaleString("az-AZ");
const radius = (m) => 4 + (m || 0) * 2;

export default function App() {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState([40.4093, 49.8671]); // Bakı
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search() {
    const name = query.trim();
    if (!name) {
      setError("Ərazi adı daxil edin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: name, format: "json", limit: 1 },
      });
      if (!geo.data.length) {
        setError(`"${name}" tapılmadı. Başqa ad yoxlayın.`);
        setQuakes([]);
        return;
      }
      const lat = parseFloat(geo.data[0].lat);
      const lon = parseFloat(geo.data[0].lon);
      const res = await axios.get(`${API}/earthquakes/nearby`, {
        params: { lat, lon, radius_km: 300 },
      });
      setCenter([lat, lon]);
      setQuakes(res.data);
      setSearched(true);
    } catch (e) {
      setError("Məlumat yüklənmədi. Backend işləyir?");
    } finally {
      setLoading(false);
    }
  }

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
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <main className="content">
        <MapContainer center={center} zoom={7} className="map">
          <Recenter center={center} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {quakes.map((q) => (
            <CircleMarker
              key={q.id}
              center={[q.latitude, q.longitude]}
              radius={radius(q.magnitude)}
              pathOptions={{ color: "#b3261e", fillOpacity: 0.45 }}
            >
              <Popup>
                <b>M {q.magnitude}</b> — {q.place}
                <br />
                Depth: {q.depth} km
                <br />
                {fmtDate(q.time)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <aside className="list">
          <h2>Yaxın zəlzələlər ({quakes.length})</h2>
          {!searched && <p className="hint">Ərazi adı yazıb Search düyməsinə basın.</p>}
          {searched && quakes.length === 0 && (
            <p className="hint">Bu ərazidə 300 km radiusda zəlzələ tapılmadı.</p>
          )}
          <ul>
            {quakes.map((q) => (
              <li key={q.id}>
                <span className="mag">M {q.magnitude ?? "?"}</span>
                <div>
                  <div className="place">{q.place}</div>
                  <div className="meta">
                    Depth: {q.depth} km · {fmtDate(q.time)}
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
