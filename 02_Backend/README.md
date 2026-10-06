# GeoQuake Backend

```bash
createdb geoquake                      # PostgreSQL
cd 02_Backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                   # DATABASE_URL-i yoxla
uvicorn app.main:app --reload          # http://localhost:8000/docs
```
