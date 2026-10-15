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
| Database | PostgreSQL ([Neon](https://neon.tech) in the cloud; local PostgreSQL for development), `psycopg[binary]` |
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


# 🌍 GeoQuake

**GeoQuake** — USGS (United States Geological Survey) API-dən real vaxt zəlzələ məlumatlarını çəkən, verilənlər bazasında saxlayan, istifadəçinin seçdiyi ərazidən məsafəyə görə filtrləyən və interaktiv xəritədə göstərən full-stack veb tətbiqdir.

🔗 **Canlı demo:** https://geoquake-web.onrender.com/

> ℹ️ Demo pulsuz Render planında işləyirsə, uzun müddət istifadə olunmadıqdan sonra ilk açılış 30–60 saniyə çəkə bilər.

---

## ✨ Funksiyalar

- Ərazi seçmək (axtarış və ya xəritə) və həmin əraziyə yaxın zəlzələləri görmək
- Məsafəyə görə filtrləmə (istifadəçinin nöqtəsindən uzaqlıq)
- Hər zəlzələ üçün: **magnitude**, **dərinlik**, **vaxt**, **yer**, **məsafə**
- OpenStreetMap + Leaflet üzərində interaktiv xəritə və zəlzələ markerləri
- USGS-dən alınan məlumatların PostgreSQL-də saxlanması

---

## 🧰 Texnologiyalar

| Qat | Texnologiya |
|---|---|
| Backend | Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic, Uvicorn |
| Database | PostgreSQL ([Neon](https://neon.tech) bulud bazası; lokal üçün PostgreSQL), `psycopg[binary]` |
| Frontend | React (Vite), Leaflet / OpenStreetMap, Axios, CSS3 |
| Xarici API | [USGS Earthquake Hazards Program API](https://earthquake.usgs.gov/fdsnws/event/1/) |
| Deploy | Render |

---

## 📁 Layihə strukturu

```
GeoQuake/
├── 00_Requirements/   # Tələblər və analiz sənədləri
├── 02_Backend/        # FastAPI backend (app/main.py giriş nöqtəsidir)
├── 03_Frontend/       # React (Vite) frontend
├── 04_QA/             # Test ssenariləri
├── .gitignore
└── README.md
```

---

## 🚀 Lokal işə salma

### Tələblər

- Python 3.10+
- Node.js 18+ və npm
- PostgreSQL (və ya SQLite ilə sürətli test)
- Git

### 1. Repository-ni klonlayın

```bash
git clone https://github.com/mickael044/GeoQuake.git
cd GeoQuake
```

### 2. Verilənlər bazası

PostgreSQL servisinin işlədiyinə əmin olun (Linux):

```bash
sudo systemctl start postgresql
```

Sonra GeoQuake üçün baza yaradın və backend-in bağlantı parametrlərini (məsələn, `DATABASE_URL`) öz mühitinizə uyğun təyin edin.

### 3. Backend (Terminal 1)

```bash
cd 02_Backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Backend `http://127.0.0.1:8000` ünvanında işləyəcək. FastAPI-nin avtomatik API sənədləşməsi `http://127.0.0.1:8000/docs` ünvanındadır.

### 4. Frontend (Terminal 2)

```bash
cd 03_Frontend
npm install
npm run dev
```

Vite dev serveri terminalda göstərilən ünvanda (adətən `http://localhost:5173`) açılacaq.

---

## 🏛 Arxitektura

```
İstifadəçi → Frontend (React, Render Static Site)
                 │  HTTP sorğuları
                 ▼
            FastAPI Backend (Render Web Service)
                 │  SQLAlchemy
                 ▼
            PostgreSQL (Neon)        USGS API (zəlzələ məlumatları)
```

- **Frontend** — istifadəçinin gördüyü və xəritə ilə işlədiyi hissə.
- **FastAPI backend** — frontend-dən gələn sorğuları qəbul edir, zəlzələ məlumatlarını emal edir və qaytarır.
- **Neon PostgreSQL** — məlumatların saxlandığı bulud bazası.
- **Swagger** — API endpointlərini brauzerdə yoxlamaq və test etmək üçün.

## ☁️ Deploy və canlı linklər

| Hissə | Ünvan |
|---|---|
| Web tətbiq | https://geoquake-web.onrender.com/ |
| Backend API | https://geoquake.onrender.com |
| API sənədləşməsi (Swagger) | https://geoquake.onrender.com/docs |
| Mənbə kodu | https://github.com/mickael044/GeoQuake |

Nümunə sorğu (Bakı ətrafındakı zəlzələlər):

```
GET https://geoquake.onrender.com/earthquakes/nearby?lat=40.41&lon=49.87
```

Backend üçün baza bağlantısını (Neon-un `DATABASE_URL` dəyərini) Render-in **Environment Variables** bölməsində saxlayın. Onu heç vaxt GitHub-a yükləməyin. Frontend üçün backend-in ictimai URL-ni (`https://geoquake.onrender.com`) göstərin.

---

## 🧪 Test

Test ssenariləri `04_QA/` qovluğundadır.

---

## 🗺 Gələcək planlar

- Seysmik risk qiymətləndirməsi (LOW / MEDIUM / HIGH) — yalnız tarixi məlumatlara əsaslanan statistik təhlil kimi
- İstifadəçi hesabları və seçilmiş əraziləri yadda saxlamaq
- Docker ilə bir əmrlə işə salma (`docker-compose up --build`)

---

## ⚠️ Qeyd

GeoQuake **zəlzələnin nə vaxt baş verəcəyini proqnozlaşdırmır**. Göstərilən məlumatlar USGS-in açıq məlumatlarına əsaslanır və rəsmi təhlükəsizlik tövsiyəsi əvəzinə istifadə edilməməlidir.

## 📄 Mənbə

Zəlzələ məlumatları: [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/).
