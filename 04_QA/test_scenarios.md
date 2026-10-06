# GeoQuake — Test ssenariləri

Ön şərt: PostgreSQL işləyir, backend `localhost:8000`, frontend `localhost:5173`.

## API

| # | Ssenari | Addımlar | Gözlənilən nəticə |
|---|---------|----------|-------------------|
| A1 | Nearby uğurlu | `GET /earthquakes/nearby?lat=40.41&lon=49.87&radius_km=300` | 200, siyahı; hər elementdə id, magnitude, depth, latitude, longitude, place, time, distance_km |
| A2 | Məsafə filtri | A1 nəticəsinə bax | Bütün `distance_km` ≤ 300; siyahı time üzrə yeni → köhnə |
| A3 | Bazaya yazılma | A1-dən sonra `GET /earthquakes` | 200, A1-dəki zəlzələlər siyahıdadır |
| A4 | Təkrar sorğu | A1-i iki dəfə göndər | Dublikat yazı yaranmır (id unikaldır) |
| A5 | Limit | `GET /earthquakes?limit=5` | ≤ 5 element |
| A6 | Yanlış lat | `GET /earthquakes/nearby?lat=999&lon=49` | 422 |
| A7 | lat/lon yoxdur | `GET /earthquakes/nearby` | 422 |
| A8 | Boş nəticə | Nearby, `lat=-60&lon=-120&radius_km=50&min_magnitude=7` | 200, `[]` |
| A9 | USGS əlçatmaz | İnternetsiz nearby sorğusu | 502, `USGS API əlçatan deyil` |

## Frontend

| # | Ssenari | Addımlar | Gözlənilən nəticə |
|---|---------|----------|-------------------|
| F1 | İlk açılış | Səhifəni aç | Axtarış sahəsi, Search düyməsi, xəritə görünür; siyahıda təlimat mətni |
| F2 | Uğurlu axtarış | "Baku" yaz → Search | Xəritə Bakıya keçir, markerlər və siyahı görünür |
| F3 | Siyahı məlumatı | Siyahının bir elementinə bax | Magnitude, depth (km) və tarix göstərilir |
| F4 | Marker popup | Markerə klik | Popup: magnitude, yer, depth, tarix |
| F5 | Enter ilə axtarış | Ad yaz → Enter | F2 ilə eyni nəticə |
| F6 | Boş giriş | Boş Search | "Ərazi adı daxil edin." xətası; sorğu göndərilmir |
| F7 | Tapılmayan ərazi | "asdfghjkl" → Search | "tapılmadı" mesajı, siyahı boşdur |
| F8 | Backend sönülü | Backend-i dayandır → Search | "Məlumat yüklənmədi" xətası |
| F9 | Yüklənmə | Search-ə bas | Düymə "Axtarılır..." göstərir və deaktivdir |
| F10 | Mobil görünüş | Pəncərəni <800px et | Xəritə və siyahı alt-alta düzülür |
