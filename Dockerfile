FROM node:22-bookworm-slim AS frontend
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM debian:bookworm-slim AS native
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake git libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY backend backend
RUN cmake -S backend -B backend/build -DCMAKE_BUILD_TYPE=Release && cmake --build backend/build --parallel

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=native /src/backend/build/unspool_server /app/unspool_server
COPY --from=frontend /src/build /app/build
ENV PORT=10000 UNSPOOL_STATIC_ROOT=/app/build
EXPOSE 10000
CMD ["/app/unspool_server"]
