from sqlalchemy import Column, String, Float, DateTime
from .database import Base


class Earthquake(Base):
    __tablename__ = "earthquakes"

    id = Column(String, primary_key=True)  # USGS event id
    magnitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)  # km
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    place = Column(String, nullable=True)
    time = Column(DateTime(timezone=True), nullable=False, index=True)
