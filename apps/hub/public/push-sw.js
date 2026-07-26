/*
 * Henry Onyx push service worker.
 *
 * Receives Web Push (RFC 8291) messages and renders the system notification,
 * then focuses/opens the deep link on click. The message body is the JSON
 * `{ title, body, url, tag, data }` produced by @henryco/push.
 */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Henry Onyx";
  const options = {
    body: payload.body || "",
    tag: payload.tag || undefined,
    icon: "/brand/icon-192.png",
    badge: "/brand/icon-192.png",
    data: { url: payload.url || "/", ...(payload.data || {}) },
    // Security alerts should persist until acknowledged.
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          // Reuse an open account tab if there is one.
          if ("focus" in client) {
            if ("navigate" in client) {
              try {
                client.navigate(targetUrl);
              } catch {
                /* cross-origin navigate can throw — fall back to focus */
              }
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});

// Take control as soon as it is installed/activated so the first subscribe works.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
