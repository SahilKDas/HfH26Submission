/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `unspool-shell-${version}`;
const shell = ['/', ...build, ...files].filter((path, index, all) => all.indexOf(path) === index);

worker.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(shell)));
});
worker.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => worker.clients.claim()));
});
worker.addEventListener('message', (event) => { if (event.data?.type === 'SKIP_WAITING') void worker.skipWaiting(); });
worker.addEventListener('fetch', (event) => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== worker.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    try { return await fetch(request); }
    catch { if (request.mode === 'navigate') return (await caches.match('/')) ?? Response.error(); return Response.error(); }
  })());
});
