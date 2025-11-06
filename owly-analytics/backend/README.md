# Owly Analytics Backend

Privacy-first digital behavior analytics backend built with FastAPI.

## Quick Start

### 1. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings (optional)
```

### 2. Start Database

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Install Dependencies

```bash
# Install Poetry (if not installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Or with pip
pip install -r requirements.txt  # (you'll need to generate this from pyproject.toml)
```

### 4. Run Server

```bash
# With Poetry
poetry run python -m app.main

# Or activate virtual environment
poetry shell
python -m app.main

# Development mode (with auto-reload)
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

The server will start at `http://localhost:3000`

### 5. Check API Documentation

- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## API Endpoints

### Data Ingestion

- `POST /api/v1/data/page-views` - Store page views
- `POST /api/v1/data/interactions` - Store interactions
- `POST /api/v1/data/typed-content` - Store typed content
- `POST /api/v1/data/sessions` - Create session
- `PATCH /api/v1/data/sessions/{id}` - Update session

### Analytics

- `GET /api/v1/analytics/overview?days=7` - Get overview statistics
- `GET /api/v1/analytics/time-series?days=7` - Get time-series data
- `GET /api/v1/analytics/categories?days=7` - Get category breakdown

### Health

- `GET /health` - Health check
- `GET /` - Root endpoint

## Development

### Database Migrations (TODO)

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

### Testing (TODO)

```bash
pytest
```

### Code Formatting

```bash
# Format code
black app/

# Lint
ruff check app/
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API routes
│   ├── core/            # Core utilities
│   ├── db/              # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI app
├── docker-compose.yml   # Docker setup
├── pyproject.toml       # Dependencies
└── README.md
```

## Next Steps

1. Add ML processing (sentiment analysis, categorization)
2. Add user authentication
3. Add data export endpoints
4. Add real-time WebSocket updates
5. Add Celery workers for background processing
6. Add Alembic migrations
7. Add comprehensive tests

## Environment Variables

See `.env.example` for all available configuration options.

## License

Private - All rights reserved
