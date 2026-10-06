# GeoQuake — Requirements

## Məqsəd
İstifadəçi ərazi adı daxil edir (məs. "Baku") və həmin əraziyə yaxın zəlzələləri xəritədə və siyahıda görür.

## Əsas funksiyalar
1. Ərazi axtarışı: ad → koordinat (OpenStreetMap Nominatim).
2. Backend USGS Earthquake API-dən məlumatı alır və PostgreSQL-də saxlayır.
3. `GET /earthquakes` — saxlanılmış zəlzələlərin siyahısı.
4. `GET /earthquakes/nearby` — verilmiş koordinata yaxın zəlzələlər (radius km).
5. Frontend: axtarış sahəsi, Search düyməsi, Leaflet xəritəsi, zəlzələ siyahısı (magnitude, depth, tarix).

## Zəlzələ modeli
id, magnitude, depth, latitude, longitude, place, time

## Texnologiyalar
Python + FastAPI, PostgreSQL, React (Vite), Leaflet + OpenStreetMap, Axios.

## Əhatədən kənar
Autentifikasiya, bildirişlər, filtrlər, admin panel.
