from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from .models import Earthquake

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


def fetch_and_store(db: Session, lat: float, lon: float, radius_km: float, days: int, min_magnitude: float) -> int:
    """USGS-dən məlumatı alır və PostgreSQL-ə yazır (mövcud id-lər yenilənir)."""
    now = datetime.now(timezone.utc)
    params = {
        "format": "geojson",
        "latitude": lat,
        "longitude": lon,
        "maxradiuskm": radius_km,
        "starttime": (now - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S"),
        "minmagnitude": min_magnitude,
        "orderby": "time",
        "limit": 500,
    }
    resp = httpx.get(USGS_URL, params=params, timeout=20)
    resp.raise_for_status()

    rows = []
    for f in resp.json().get("features", []):
        lon_, lat_, depth = f["geometry"]["coordinates"][:3]
        p = f["properties"]
        rows.append(
            {
                "id": f["id"],
                "magnitude": p.get("mag"),
                "depth": depth,
                "latitude": lat_,
                "longitude": lon_,
                "place": p.get("place"),
                "time": datetime.fromtimestamp(p["time"] / 1000, tz=timezone.utc),
            }
        )

    if rows:
        stmt = insert(Earthquake).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={c: stmt.excluded[c] for c in ("magnitude", "depth", "latitude", "longitude", "place", "time")},
        )
        db.execute(stmt)
        db.commit()
    return len(rows)
