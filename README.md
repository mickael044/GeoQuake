# 🌍 GeoQuake

**GeoQuake** is a full-stack web application that fetches real-time earthquake data from the USGS (United States Geological Survey) API, stores it in a database, filters it by distance from a location chosen by the user, and displays it on an interactive map.

🔗 **Live demo:** https://geoquake-web.onrender.com/

> ℹ️ If the demo runs on Render's free plan, the first load after a period of inactivity may take 30–60 seconds.

---

## ✨ Features

- Choose an area (search or map) and see nearby earthquakes
- Filtering by distance from the user's location
- For each earthquake: **magnitude**, **depth**, **time**, **place**, **distance**
- Interactive map with earthquake markers (OpenStreetMap + Leaflet)
- Earthquake data fetched from USGS and stored in PostgreSQL

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic, Uvicorn |
| Database | PostgreSQL ([Neon](https://neon.tech) in the cloud; local PostgreSQL for development), `psycopg2-binary` |
| Frontend | React (Vite), Leaflet / OpenStreetMap, Axios, CSS3 |
| External API | [USGS Earthquake Hazards Program API](https://earthquake.usgs.gov/fdsnws/event/1/) |
| Deployment | Render |

---

## 📁 Project Structure

```
GeoQuake/
├── 00_Requirements/   # Requirements and analysis documents
├── 02_Backend/        # FastAPI backend (entry point: app/main.py)
├── 03_Frontend/       # React (Vite) frontend
├── 04_QA/             # Test scenarios
├── .gitignore
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL (or SQLite for a quick test)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mickael044/GeoQuake.git
cd GeoQuake
```

### 2. Database

Make sure the PostgreSQL service is running (Linux):

```bash
sudo systemctl start postgresql
```

Then create a database for GeoQuake and set the backend's connection settings (for example, `DATABASE_URL`) for your environment.

### 3. Backend (Terminal 1)

```bash
cd 02_Backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`. FastAPI's automatic API documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Frontend (Terminal 2)

```bash
cd 03_Frontend
npm install
npm run dev
```

The Vite dev server opens at the address printed in the terminal (usually `http://localhost:5173`).

---

## 🏛 Architecture

```
User → Frontend (React, Render Static Site)
            │  HTTP requests
            ▼
       FastAPI Backend (Render Web Service)
            │  SQLAlchemy
            ▼
       PostgreSQL (Neon)        USGS API (earthquake data)
```

- **Frontend** — the part users see and interact with, including the map.
- **FastAPI backend** — receives requests from the frontend, processes earthquake data and returns it.
- **Neon PostgreSQL** — cloud database where the data is stored.
- **Swagger** — used to explore and test API endpoints in the browser.

## ☁️ Deployment & Live Links

| Part | URL |
|---|---|
| Web app | https://geoquake-web.onrender.com/ |
| Backend API | https://geoquake.onrender.com |
| API docs (Swagger) | https://geoquake.onrender.com/docs |
| Source code | https://github.com/mickael044/GeoQuake |

Example request (earthquakes near Baku):

```
GET https://geoquake.onrender.com/earthquakes/nearby?lat=40.41&lon=49.87
```

Keep the database connection (the Neon `DATABASE_URL`) in Render's **Environment Variables** and never commit it to GitHub. Point the frontend to the backend's public URL (`https://geoquake.onrender.com`).

---

## 🧪 Testing

Test scenarios are in the `04_QA/` folder.

---

## 🗺 Roadmap

- Seismic risk assessment (LOW / MEDIUM / HIGH), based only on statistical analysis of historical data
- User accounts and saving favorite locations
- One-command startup with Docker (`docker-compose up --build`)

---

## ⚠️ Disclaimer

GeoQuake **does not predict when an earthquake will occur**. The data shown comes from USGS open data and must not be used as a substitute for official safety guidance.

## 📄 Data Source

Earthquake data: [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/).
