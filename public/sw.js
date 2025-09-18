self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	event.respondWith(
		caches.open('kl-static-v1').then(async (cache) => {
			const cached = await cache.match(request);
			if (cached) return cached;
			try {
				const res = await fetch(request);
				if (request.url.startsWith(self.location.origin)) {
					cache.put(request, res.clone());
				}
				return res;
			} catch (e) {
				return cached || Response.error();
			}
		})
	);
});
