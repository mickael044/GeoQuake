# 🌍 GeoQuake

![version](https://img.shields.io/badge/version-1.4.0-1d6fd8) ![python](https://img.shields.io/badge/python-3.10%2B-blue) ![license](https://img.shields.io/badge/data-USGS-green)

**GeoQuake** is a full-stack web app that shows recent earthquakes around any place in the world. It pulls data from the USGS Earthquake API, stores it in PostgreSQL, filters it by distance from the location you choose, and draws it on an interactive map and a sortable list.

🔗 **Live demo:** https://geoquake-web.onrender.com/ · 📘 **API docs (Swagger):** https://geoquake.onrender.com/docs

> ℹ️ The demo runs on Render's free plan. After a period of inactivity the first load can take 30–60 seconds; the app shows a notice while the server wakes up.

The interface is available in **Azərbaycanca** and **English** (☰ Menu → Options → Language).

---

## ✨ Features

- 🔎 Search any place (OpenStreetMap Nominatim) or use **📍 Near me**
- 📏 Radius selector: 10 / 25 / 50 / 100 / 250 km, shown as a circle on the map
- 🗺 Interactive map (Leaflet): **marker size = magnitude, marker color = depth** (darker = deeper)
- 📋 Earthquake list with sorting (newest / strongest / nearest), an "only visible on the map" filter, and click-to-focus
- ℹ️ Popup with time, coordinates, depth, distance and a link to the official USGS event page
- ☰ Menu with options: time period (24 h – 1 year), minimum magnitude, map type (street / terrain / satellite), radius-circle and legend toggles — saved in your browser
- 🌐 Azerbaijani / English interface
- 🔢 Version number shown in the menu, [changelog](03_Frontend/src/CHANGELOG.md)
- ⏳ Cold-start notice for the free-tier server and a lightweight `/health` endpoint

---

## 🏛 Architecture

```
User → Frontend (React + Leaflet, Render Static Site)
            │  HTTPS / JSON
            ▼
       FastAPI backend (Render Web Service)
            │  SQLAlchemy                  │  httpx
            ▼                              ▼
       PostgreSQL (Neon)             USGS Earthquake API
```

The backend asks USGS for the requested area, stores new events in PostgreSQL (so the database works as a cache), then returns the events within the radius with their distance from the chosen point (haversine formula).

## 🧰 Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, httpx, Uvicorn |
| Database | PostgreSQL ([Neon](https://neon.tech) in the cloud), `psycopg[binary]` |
| Frontend | React 18, Vite, react-leaflet / Leaflet, Axios |
| Data | [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/) |
| Maps & search | OpenStreetMap, OpenTopoMap, Esri World Imagery, Nominatim |
| Hosting | Render (frontend + backend), Neon (database) |

---

## 📡 API

Interactive documentation: `/docs` (Swagger UI).

| Endpoint | Description |
|---|---|
| `GET /health` | Lightweight health check (no database access) |
| `GET /earthquakes?limit=100` | Stored earthquakes, newest first (`limit` 1–1000) |
| `GET /earthquakes/nearby` | Earthquakes around a point, with `distance_km` |

`/earthquakes/nearby` parameters:

| Parameter | Default | Allowed |
|---|---|---|
| `lat` | required | −90 … 90 |
| `lon` | required | −180 … 180 |
| `radius_km` | 300 | > 0 … 2000 |
| `days` | 365 | 1 … 3650 |
| `min_magnitude` | 2.5 | 0 … 10 |

Example:

```bash
curl "https://geoquake.onrender.com/earthquakes/nearby?lat=40.41&lon=49.87&radius_km=100&days=30"
```

```json
[
  {
    "id": "us7000xxxx",
    "magnitude": 4.6,
    "depth": 10.0,
    "latitude": 40.12,
    "longitude": 49.35,
    "place": "45 km SW of Baku, Azerbaijan",
    "time": "2026-10-10T08:15:00Z",
    "distance_km": 52.3
  }
]
```
Invalid input returns `422`; if USGS is unreachable the API returns `502`, and `503` if the database is unavailable.

---

## 📁 Project structure

```
GeoQuake/
├── 00_Requirements/      # requirements and analysis
├── 02_Backend/           # FastAPI backend
│   ├── app/              # main.py, models.py, schemas.py, usgs.py, database.py
│   ├── requirements.txt
│   └── .env.example      # DATABASE_URL example
├── 03_Frontend/          # React + Vite frontend
│   ├── src/              # App.jsx, App.css, main.jsx, CHANGELOG.md
│   └── package.json
├── 04_QA/                # test scenarios
└── README.md
```

---

## 🚀 Run locally

**Requirements:** Python 3.10+, Node.js 18+, PostgreSQL, Git.

```bash
git clone https://github.com/mickael044/GeoQuake.git
cd GeoQuake
```

**1. Database** — create a PostgreSQL database (for example `geoquake`). Tables are created automatically when the backend starts.

**2. Backend**

```bash
cd 02_Backend
cp .env.example .env          # then set DATABASE_URL for your database
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000 · Docs: http://127.0.0.1:8000/docs

**3. Frontend** (new terminal)

```bash
cd 03_Frontend
npm install
npm run dev
```
Open the address Vite prints (usually http://localhost:5173). By default the frontend calls the backend on port 8000 of the same host; set `VITE_API_URL` to use another backend.

> Never commit your `.env` file. It is listed in `.gitignore`.

---

## ☁️ Deployment

| Part | Where | Notes |
|---|---|---|
| Frontend | Render Static Site | Set `VITE_API_URL=https://geoquake.onrender.com` **before the build** |
| Backend | Render Web Service | Set the `DATABASE_URL` environment variable (Neon connection string) |
| Database | Neon PostgreSQL | Keep the connection string only in Render's environment variables |

---

## 🧪 Testing

Manual test scenarios for the API and the UI are in [`04_QA/test_scenarios.md`](04_QA/test_scenarios.md).

## 🔒 Privacy

The site uses [GoatCounter](https://www.goatcounter.com/) for anonymous, cookie-free visit statistics. No personal data is collected. Your menu options are stored only in your own browser (`localStorage`).

## 🗺 Roadmap

- Statistics page (magnitude and depth charts, earthquakes over time)
- Seismic **risk classification** (LOW / MEDIUM / HIGH) from historical data — a statistical assessment, *not* a prediction
- User accounts and saved locations
- Docker setup (`docker-compose up --build`) and automated tests

## ⚠️ Disclaimer

GeoQuake **does not predict earthquakes**. It only displays past events reported by USGS and must not replace official safety guidance.

## 👤 Author

**Mikayil Hasanov** — AI & Machine Learning Engineer, Geophysics Engineering student
[LinkedIn](https://www.linkedin.com/in/mikayil-hasanov-23b1b1385/) · [GitHub](https://github.com/mickael044)

## 📄 Data sources

Earthquake data: [USGS](https://earthquake.usgs.gov/) · Maps: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, © OpenTopoMap, Esri · Geocoding: Nominatim
