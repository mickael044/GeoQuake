from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EarthquakeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    magnitude: Optional[float]
    depth: Optional[float]
    latitude: float
    longitude: float
    place: Optional[str]
    time: datetime
    distance_km: Optional[float] = None
