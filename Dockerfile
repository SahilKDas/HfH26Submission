FROM oven/bun:1.3.14-slim AS frontend
WORKDIR /src
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend /app/backend
COPY shared /app/shared
COPY --from=frontend /src/build /app/build
ENV PORT=8000 UNSPOOL_STATIC_ROOT=/app/build PYTHONDONTWRITEBYTECODE=1 DJANGO_DEBUG=0 PROFILE_COOKIE_SECURE=1
EXPOSE 8000
CMD ["sh", "-c", "python backend/manage.py migrate && gunicorn --chdir backend --bind 0.0.0.0:${PORT} --workers 2 --threads 4 unspool_backend.wsgi:application"]
