from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from typing import List

import logging

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db
from .usgs import fetch_and_store

logger = logging.getLogger("geoquake")
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GeoQuake API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """DB-siz yüngül yoxlama: frontend serveri oyatmaq üçün istifadə edir."""
    return {"status": "ok"}


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


@app.get("/earthquakes", response_model=List[schemas.EarthquakeOut])
def list_earthquakes(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Bazada saxlanılan ən son zəlzələlər."""
    return db.query(models.Earthquake).order_by(models.Earthquake.time.desc()).limit(limit).all()


@app.get("/earthquakes/nearby", response_model=List[schemas.EarthquakeOut])
def nearby_earthquakes(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(300, gt=0, le=2000),
    days: int = Query(365, ge=1, le=3650),
    min_magnitude: float = Query(2.5, ge=0, le=10),
    db: Session = Depends(get_db),
):
    """USGS-dən məlumatı yeniləyir, sonra bazadan yaxın zəlzələləri qaytarır."""
    try:
        fetch_and_store(db, lat, lon, radius_km, days, min_magnitude)
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"USGS API əlçatan deyil: {type(e).__name__}: {e}",
        )
    except SQLAlchemyError:
        db.rollback()
        logger.exception("DB error while storing USGS data")
        raise HTTPException(status_code=503, detail="Verilənlər bazası əlçatan deyil. Bir az sonra yenidən cəhd edin.")

    since = datetime.now(timezone.utc) - timedelta(days=days)
    # Bounding box: bütün cədvəli Python-a yükləmək əvəzinə əvvəlcə bazada süzürük
    dlat = radius_km / 111.0
    dlon = radius_km / (111.0 * max(cos(radians(lat)), 0.01))
    query = (
        db.query(models.Earthquake)
        .filter(models.Earthquake.time >= since)
        .filter(models.Earthquake.magnitude >= min_magnitude)
        .filter(models.Earthquake.latitude.between(lat - dlat, lat + dlat))
    )
    if lon - dlon >= -180 and lon + dlon <= 180:  # tarix xətti yaxınlığında süzmə tətbiq olunmur
        query = query.filter(models.Earthquake.longitude.between(lon - dlon, lon + dlon))
    try:
        candidates = query.all()
    except SQLAlchemyError:
        db.rollback()
        logger.exception("DB error while reading earthquakes")
        raise HTTPException(status_code=503, detail="Verilənlər bazası əlçatan deyil. Bir az sonra yenidən cəhd edin.")

    result = []
    for q in candidates:
        d = haversine_km(lat, lon, q.latitude, q.longitude)
        if d <= radius_km:
            item = schemas.EarthquakeOut.model_validate(q)
            item.distance_km = round(d, 1)
            result.append(item)
    result.sort(key=lambda x: x.time, reverse=True)
    return result
