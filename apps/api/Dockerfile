# StackNest API - image runtime FastAPI
# Multi-stage : stage build avec uv (resolve + install dans /app/.venv),
# stage runtime minimal avec uniquement le venv et le code.

FROM python:3.13-slim AS builder

# Installe uv (binaire statique, pas de pip)
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Layer cache : on copie d'abord les manifestes et on resoud
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Puis le code applicatif
COPY app ./app
RUN uv sync --frozen --no-dev


FROM python:3.13-slim AS runtime

# Utilisateur non-root
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

COPY --from=builder --chown=app:app /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER app

EXPOSE 8000

# Build args injectes par la CI depuis version.json (CA4 partie 2)
ARG APP_VERSION=0.0.0-dev
ARG GIT_COMMIT=unknown
ARG DEPLOYED_AT=1970-01-01T00:00:00Z
ENV APP_VERSION=$APP_VERSION \
    GIT_COMMIT=$GIT_COMMIT \
    DEPLOYED_AT=$DEPLOYED_AT

# Healthcheck : Docker / orchestrateur detecte un container down meme si
# le process uvicorn reste up mais ne sert plus (deadlock, etc.).
# On tape directement /health (STN-18) — tolerance 5s, 3 retries.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3).read()" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
