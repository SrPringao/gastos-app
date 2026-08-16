# Notificaciones Push PWA: guia de implementacion

Guia para copiar el mismo mecanismo de Cuantiva a otro proyecto PWA. El objetivo de esta primera etapa es **que el canal funcione** (suscribir dispositivo, guardar keys, enviar un push de prueba). Los eventos de negocio (que notificar y cuando) se conectan despues llamando a un unico metodo de envio.

La tabla real se llama `push_subscriptions`, no `push_notifications`. Cada fila es **un dispositivo/navegador** de un usuario.

---

## 1. Como funciona (idea general)

Web Push no envia el mensaje directo al iPhone. El flujo es:

```
Usuario instala PWA
  -> Service Worker (sw.js) queda activo
  -> El navegador pide permiso de notificaciones
  -> PushManager.subscribe() con tu clave VAPID publica
  -> Apple/Google te dan un endpoint + keys (p256dh, auth)
  -> El frontend POST /subscribe guarda eso en push_subscriptions
  -> Cuando quieras notificar, el backend usa web-push + VAPID privada
  -> Apple/FCM entrega el mensaje al dispositivo
  -> sw.js escucha "push" y llama showNotification()
  -> Al tocar, "notificationclick" abre la URL
```

En iOS/iPadOS esto **solo funciona si la PWA esta instalada** (Anadir a pantalla de inicio) y Safari es 16.4+. En Safari normal (pestana) iOS no entrega push. En Android/Chrome suele funcionar tambien sin instalar, pero la PWA instalada es mas fiable.

Los registros que mostraste son exactamente eso: `endpoint` de `https://web.push.apple.com/...`, keys de cifrado, `userAgent` y `deviceType`. Un mismo usuario puede tener varias filas (iPhone + Mac + otro Safari).

---

## 2. Requisitos

| Requisito | Por que |
|-----------|---------|
| HTTPS en produccion | Push y Service Worker lo exigen. `localhost` vale en desarrollo. |
| PWA real | `manifest.json` con `display: standalone`, iconos, SW en la raiz (`/sw.js`). |
| Meta Apple | `apple-mobile-web-app-capable=yes` y `apple-touch-icon`. |
| iOS 16.4+ / Safari | Push web en iPhone/iPad. |
| Par VAPID | Identifica tu servidor ante Apple/FCM. **No las cambies** o todas las suscripciones mueren. |
| Libreria `web-push` | En Node: `npm i web-push` y `@types/web-push`. |

Generar keys (una sola vez por entorno):

```bash
npx web-push generate-vapid-keys
```

Variables de entorno del backend:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tu-email@dominio.com
```

`VAPID_SUBJECT` debe ser un `mailto:` o una URL HTTPS de contacto. La privada a veces viene con `=` al final; `web-push` espera URL-safe Base64 **sin padding**. Si falla al arrancar, quita los `=`.

---

## 3. Esquema de base de datos

### 3.1 Lo que usa Cuantiva hoy

```sql
CREATE TABLE push_subscriptions (
  id INT NOT NULL AUTO_INCREMENT,
  userId CHAR(36) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  userAgent VARCHAR(255) NULL,
  deviceType VARCHAR(50) NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_endpoint (userId, endpoint),
  KEY idx_userId (userId)
);
```

Campos:

- `endpoint`: URL unica del push service (Apple o FCM). Ahi se "entrega" el mensaje.
- `p256dh` y `auth`: llaves del navegador para cifrar el payload. Sin ellas Apple/FCM rechazan el envio.
- `userAgent` / `deviceType`: solo diagnostico (`mobile`, `tablet`, `desktop`).
- Unicidad `(userId, endpoint)`: si el mismo dispositivo se vuelve a suscribir, se actualizan las keys.

### 3.2 Esquema recomendado para el proyecto nuevo

Mejoras respecto al actual (detalle en seccion 8):

```sql
CREATE TABLE push_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  endpoint TEXT NOT NULL,
  endpoint_hash CHAR(64) NOT NULL,
  p256dh TEXT NOT NULL,
  auth VARCHAR(255) NOT NULL,
  user_agent VARCHAR(512) NULL,
  device_type VARCHAR(32) NULL,
  expiration_time BIGINT NULL,
  last_seen_at DATETIME(6) NULL,
  last_error VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_endpoint_hash (endpoint_hash),
  KEY idx_user_id (user_id)
);
```

`endpoint_hash` = SHA-256 del endpoint. Sirve para UNIQUE sin pelear con el limite de indice de MySQL sobre TEXT.

Cuando quieras **elegir que notificar**, no mezcles eso en esta tabla. Anade preferencias aparte:

```sql
CREATE TABLE notification_preferences (
  user_id CHAR(36) NOT NULL,
  event_key VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, event_key)
);
```

Ejemplos de `event_key` futuros: `weekly_insights`, `task_assigned`, `mention`. Por ahora **no hace falta crear esta tabla**. El servicio de envio acepta `userId + title + body + url` y listo.

---

## 4. Backend (contrato minimo)

Tres endpoints bastan para la etapa 1. El cuarto (`send`) es para pruebas; en produccion el envio debe ser interno (servicio), no un POST publico.

### GET `/push-notifications/vapid-public-key`

Publico (sin auth). Respuesta: `{ "publicKey": "BLxxxx..." }`.

El frontend la usa en `pushManager.subscribe({ applicationServerKey })`.

### POST `/push-notifications/subscribe` (usuario autenticado)

Body:

```json
{
  "endpoint": "https://web.push.apple.com/...",
  "p256dh": "BBxxxx...",
  "auth": "xxxx==",
  "userAgent": "Mozilla/5.0 ...",
  "deviceType": "mobile"
}
```

Logica:

1. Si existe `(userId, endpoint)` (o el `endpoint_hash`): actualizar keys, userAgent, deviceType, `last_seen_at`.
2. Si el endpoint ya existe pero con **otro** `userId` (mismo iPhone, otro login): reasignar al usuario actual. Un endpoint no puede pertenecer a dos cuentas.
3. Si no existe: insertar.

### GET `/push-notifications/subscriptions`

Lista las del usuario logueado (para settings / "desactivar este dispositivo").

### DELETE `/push-notifications/subscriptions/:id`

Borra en BD. El frontend tambien debe llamar `subscription.unsubscribe()` en el navegador.

### Envio (servicio interno, no necesariamente HTTP)

Firma sugerida:

```ts
sendToUser(params: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}): Promise<{ sent: number; failed: number }>
```

Implementacion con `web-push`:

```ts
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY.replace(/=/g, ''),
);

const payload = JSON.stringify({
  title,
  body,
  url: url || '/',
  tag: tag || 'default',
  data: data || {},
});

for (const sub of subscriptions) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { TTL: 86400, urgency: 'normal' },
    );
  } catch (err) {
    // 404 / 410 / 403: suscripcion muerta -> borrar fila
    if ([404, 410, 403].includes(err.statusCode)) {
      await repo.remove(sub);
    }
  }
}
```

Reglas:

- Si el usuario no tiene suscripciones: **no lances error**. Devuelve `{ sent: 0 }`. El producto sigue funcionando.
- Payload pequeno (menos de ~3 KB). Title + body + url. No mandes HTML ni blobs.
- Envia a **todas** las filas del usuario (iPhone y Mac a la vez).
- Este metodo es el unico que conectaras despues a cada evento de negocio.

Opcional: un `POST /push-notifications/send` protegido por admin solo para probar. No lo uses como API de producto.

---

## 5. Frontend: suscribirse

### 5.1 Registrar el Service Worker

El SW debe vivir en `public/sw.js` (o equivalente) para que el scope sea `/`. Registrarlo al cargar la app:

```js
navigator.serviceWorker.register('/sw.js', { scope: '/' });
```

No caches `sw.js` de forma agresiva en nginx/CDN (`Cache-Control: no-cache` o max-age corto). Si el SW viejo se queda, las notificaciones no se actualizan.

### 5.2 Prompt ( copiar la idea de Cuantiva )

1. Usuario logueado.
2. En iOS: solo si `display-mode: standalone` o `navigator.standalone === true`. Si esta en Safari de pestana, **no pidas permiso** (va a fallar o no entregar).
3. Si `Notification.permission === 'denied'`, no insistas.
4. Si ya hay `pushManager.getSubscription()`, no vuelvas a preguntar.
5. Guarda un flag en `localStorage` si dice "Ahora no".
6. El click de "Activar" debe ser un gesto del usuario: ahi llamas `Notification.requestPermission()` y luego `subscribe()`.

Orden correcto (importante):

1. `navigator.serviceWorker.ready`
2. GET vapid public key
3. Convertir la key de Base64 URL a `Uint8Array`
4. `Notification.requestPermission()`
5. `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
6. Extraer `endpoint`, `getKey('p256dh')`, `getKey('auth')` a Base64
7. POST `/subscribe` con Bearer token

Helpers:

```js
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function getDeviceType() {
  const ua = navigator.userAgent;
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (isIpadOs || /ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android/i.test(ua)) return 'mobile';
  return 'desktop';
}
```

Nota: iPadOS moderno se reporta como Macintosh. Por eso en tus datos hay filas `desktop` con Safari en Mac que en realidad pueden ser iPad. El snippet de arriba corrige eso.

En settings, un toggle "Notificaciones en este dispositivo" que llame subscribe / unsubscribe.

---

## 6. Service Worker: recibir y mostrar

El SW es el unico que puede mostrar el push con la app cerrada. Minimo viable (sin mezclar cache si no lo necesitas):

```js
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'Nueva notificacion' };
  }

  const title = data.title || 'Tu App';
  const options = {
    body: data.body || 'Tienes una nueva notificacion',
    icon: '/icon.png',
    badge: '/icon.png',
    data: { url: data.url || '/', ...(data.data || {}) },
    tag: data.tag || 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          if (client.navigate) return client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
```

Detalles iOS:

- `userVisibleOnly: true` es obligatorio. iOS no permite push silenciosos.
- `vibrate` se ignora en iOS; no pasa nada si lo dejas.
- El icono debe ser PNG accesible en el origin de la PWA.
- `event.data.text()` y `event.data.json()` **consumen el body una vez**. No llames los dos. Usa `json()` y fallback.

Si ya tienes un `sw.js` de cache, **anade estos dos listeners** al mismo archivo. No registres dos service workers.

---

## 7. Orden de implementacion (etapa 1: solo el canal)

Hazlo en este orden. No conectes eventos de negocio todavia.

1. Generar VAPID y ponerlas en `.env`.
2. Crear tabla `push_subscriptions`.
3. Endpoints vapid + subscribe + list + delete + servicio `sendToUser`.
4. `sw.js` con `push` y `notificationclick`.
5. Registrar SW en el layout de la PWA.
6. Prompt de permiso solo en standalone (iOS) + POST subscribe.
7. Probar:
   - Instalar PWA en iPhone (Compartir → Anadir a pantalla de inicio).
   - Abrir la app instalada, aceptar notificaciones.
   - Verificar fila en `push_subscriptions` con `web.push.apple.com`.
   - Desde el servidor, `sendToUser` con un titulo/body de prueba.
   - Bloquear el iPhone: debe aparecer el banner.
   - Tocar: abre la PWA en la URL indicada.

Cuando eso funcione, cada feature nueva es una linea:

```ts
await push.sendToUser({
  userId,
  title: 'Tarea asignada',
  body: 'Te asignaron "Revisar reporte"',
  url: '/tareas/123',
  tag: 'task-123',
});
```

`tag` igual reemplaza la notificacion anterior del mismo id (util para "avance 40%" → "avance 80%" sin apilar 10 banners).

---

## 8. Que mejorar respecto a Cuantiva

### Esquema

- `endpoint VARCHAR(500)` se queda corto con algunos endpoints FCM. Usa `TEXT` + hash UNIQUE.
- UNIQUE solo `(userId, endpoint)` permite el mismo endpoint en dos usuarios. Mejor UNIQUE global y reasignar al login nuevo.
- `BIGINT` para `id` si esperas muchas filas.
- `last_seen_at` / `last_error` para limpiar dispositivos muertos.
- Preferencias por tipo de evento en tabla aparte, no columnas en `push_subscriptions`.

### Envio

- No hacer throw si no hay suscripciones (Cuantiva lanza `BadRequestException` y ensucia logs de crons).
- Borrar tambien en HTTP **404**, no solo 410/403.
- Evitar enviar dos veces el mismo push: en Cuantiva `notifications.create` ya dispara push y algunos crons vuelven a llamar `sendNotificationToUser`. Un solo disparo por evento.
- TTL + urgency en `sendNotification`.
- No loguear keys VAPID ni endpoints completos.

### Service Worker

- Parseo actual es fragil (text/json duplicado). Un `event.data.json()` basta.
- Separar cache PWA y push: el listener de `fetch` no debe interceptar el push service.

### Frontend / iOS

- Detectar iPadOS (`MacIntel` + `maxTouchPoints > 1`).
- Re-suscribir al login: si cambia el usuario, POST subscribe otra vez (reasigna endpoint).
- Al logout, no hace falta unsubscribe del push service si vas a reasignar; si quieres privacidad, unsubscribe y borra la fila.
- Header `Cache-Control` de `/sw.js`.
- Probar siempre **desde la icono de inicio**, no desde Safari.

### Producto

- Settings: lista de dispositivos (`deviceType` + fecha) y boton "cerrar sesion de notificaciones" por fila.
- Rate limit interno para no spamear.
- Cuando agregues tipos: `notification_preferences` + `if (!pref.enabled) return` dentro de `sendToUser` o un wrapper `sendEvent(userId, eventKey, payload)`.

---

## 9. Checklist iPhone / iPad

- [ ] App servida por HTTPS.
- [ ] `manifest.json` con `display: standalone` y `start_url`.
- [ ] Icono `apple-touch-icon` y meta `apple-mobile-web-app-capable`.
- [ ] Usuario anadio la app a pantalla de inicio **con Safari** (no Chrome iOS).
- [ ] Abrio la app desde el icono (barra de Safari no debe verse).
- [ ] Acepto el permiso de notificaciones **dentro de la PWA**.
- [ ] Fila en BD con `endpoint` `https://web.push.apple.com/...`.
- [ ] Mismas VAPID keys que cuando se suscribio.
- [ ] En Ajustes iOS → Notificaciones → tu PWA, no estan silenciadas.
- [ ] Envio de prueba con la app en background o pantalla bloqueada.

Si el subscribe funciona pero no llega el banner: casi siempre es PWA no standalone, VAPID distintas, o suscripcion 410 que hay que borrar y volver a suscribir.

---

## 10. Mapa rapido de archivos en Cuantiva (referencia)

| Pieza | Ruta |
|-------|------|
| Service Worker | `cuantiva-frontend/public/sw.js` |
| Subscribe / helpers | `cuantiva-frontend/lib/push-notifications.ts` |
| Modal de permiso | `cuantiva-frontend/components/push-notification-prompt.tsx` |
| Registro SW / install PWA | `cuantiva-frontend/components/pwa-installer.tsx` |
| Prompt en layout | `cuantiva-frontend/app/layout.tsx` |
| API Nest | `cuantiva-backend/src/push-notifications/` |
| Entidad / tabla | `entities/push-subscription.entity.ts` → `push_subscriptions` |
| Envio web-push | `push-notifications.service.ts` → `sendNotificationToUser` |
| Ejemplo de uso | `notifications.service.ts` (al crear una notificacion in-app) |

Copia el **canal** (SW + subscribe + tabla + `sendToUser`). No copies los eventos de percepciones/insights hasta que decidas que quieres notificar en el otro proyecto.
