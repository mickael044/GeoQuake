# Changelog

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`.
The current version is shown in the app: **☰ Menu → bottom of the panel**.
Update `APP_VERSION` in `03_Frontend/src/App.jsx` with every release.

## [1.4.0] — 2026-10-21
### Added
- Language switch (Azərbaycanca / English) in Menu → Options
- "Contact the developer" section (email, LinkedIn) in the menu
- Version number shown in the menu

## [1.3.0]
### Added
- Menu with Options: time period, minimum magnitude, map type (street / terrain / satellite), radius circle and legend toggles
- About section with data sources

## [1.2.0]
### Added
- USGS-style earthquake list: sorting (newest / strongest / nearest), "only visible on map" filter
- Click a list item to focus the earthquake on the map; popup with USGS link
### Changed
- Marker size now shows magnitude, marker color shows depth
### Fixed
- Map no longer jumps back to its starting view after zooming or panning

## [1.1.0]
### Added
- Radius selector (10 / 25 / 50 / 100 / 250 km)
- "Near me" button (browser geolocation)
- Distance shown for every earthquake
- Cold-start notice for the free Render server and a `/health` endpoint
### Changed
- More reliable database connection (Neon), faster nearby queries

## [1.0.0]
### Added
- Place search, interactive map with earthquake markers (USGS data), FastAPI backend with PostgreSQL
