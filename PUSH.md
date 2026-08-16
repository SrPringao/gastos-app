# Notificaciones push en Gastos

Guia de uso de este proyecto. El canal ya esta implementado. Aqui esta como funciona y como mandar un aviso nuevo.

No usamos TypeORM. Usamos **Drizzle**. Next no crea tablas al hacer `pnpm dev`. El esquema vive en `lib/db/schema.ts` y se aplica a Postgres con:

```bash
pnpm db:push
```

No hay que crear la tabla a mano en SQL. Un `db:push` (con Postgres arriba) alcanza. Si el schema ya esta en codigo y la tabla no existe en la BD, es porque falta ese comando.

---

## Para que sirve el mailto (VAPID_SUBJECT)

No le manda correos al usuario. No es el canal de la notificacion.

Web Push exige un par de llaves VAPID para que Apple/FCM sepan **quien es tu servidor**. `VAPID_SUBJECT` es el contacto de ese servidor: un `mailto:tu@email.com` o una URL HTTPS.

- Apple/Google lo usan si hay abuso o un problema con tus push.
- El usuario **nunca** ve ese correo.
- No tiene que ser el email de login de la app.

Pon uno real tuyo, por ejemplo `mailto:franco@tudominio.com`.

Las keys `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` identifican la app. **No las regeneres** en un entorno que ya tiene dispositivos suscritos: todas las filas de `push_subscriptions` dejan de servir.

---

## Como funciona el canal

```
Usuario instala la PWA y acepta notificaciones
  -> el navegador se suscribe con la clave VAPID publica
  -> POST /api/push-notifications/subscribe guarda endpoint + keys
  -> tu codigo llama sendToUser({ userId, title, body, url, tag })
  -> el servidor cifra y entrega el mensaje a Apple/FCM
  -> public/sw.js muestra el banner aunque la app este cerrada
  -> al tocar, abre la URL
```

En iPhone solo llega si la PWA esta instalada (Anadir a pantalla de inicio) y se abrio desde el icono. Safari en pestana no entrega push.

Un usuario puede tener varios dispositivos (iPhone + Mac). `sendToUser` manda a **todas** las filas de ese `userId`.

Si el usuario no tiene suscripciones, `sendToUser` **no lanza error**. Devuelve `{ sent: 0, failed: 0 }`.

---

## Como notificar (lo unico que ocupas)

Importa el servicio y llama esto desde codigo de servidor (API route, server action, cron, etc.). **No** desde un componente `"use client"`.

```ts
import { sendToUser } from "@/lib/services/push-notifications";

await sendToUser({
  userId,
  title: "Presupuesto al 80%",
  body: "Ya gastaste 8,000 de 10,000 este mes",
  url: "/gastos",
  tag: "budget-80",
});
```

| Campo    | Obligatorio | Que hace |
|----------|-------------|----------|
| `userId` | si          | A quien. Es el uuid de `users.id`. |
| `title`  | si          | Titulo del banner. |
| `body`   | si          | Texto corto. Sin HTML. Payload chico (< 3 KB). |
| `url`    | no          | Ruta al tocar. Default `/`. Ej. `/gastos`, `/gastos-fijos`. |
| `tag`    | no          | Id del aviso. El mismo tag **reemplaza** el banner anterior (util para "40%" -> "80%" sin apilar 10). |
| `data`   | no          | Extra JSON para el SW. Casi nunca lo necesitas. |

El metodo regresa `{ sent, failed }`. No hace falta checarlo salvo para logs.

### Donde ponerlo

En el mismo lugar donde ya ocurre el evento, **despues** de guardar en BD. Ejemplos:

```ts
// Al crear un gasto (atajo o formulario)
await createExpense(userId, input);
await sendToUser({
  userId,
  title: "Gasto registrado",
  body: `${description} · $${amount}`,
  url: "/gastos",
  tag: `expense-${Date.now()}`,
});
```

```ts
// Al cruzar umbral de presupuesto (una sola vez por mes/umbral)
await sendToUser({
  userId,
  title: "Presupuesto al 80%",
  body: "Ya gastaste 8,000 de 10,000 este mes",
  url: "/gastos",
  tag: `budget-80-${monthKey}`,
});
```

```ts
// Recordatorio de gasto fijo
await sendToUser({
  userId,
  title: "Renta pendiente",
  body: "Hoy es el dia de pago de Renta",
  url: "/gastos-fijos",
  tag: `fixed-${fixedExpenseId}-${monthKey}`,
});
```

Usa `tag` estable por evento (`budget-80-2026-08`, `fixed-12-2026-08`) para no spamear si el codigo se corre dos veces.

No llames `sendToUser` dos veces por el mismo evento (guardar + cron + API). Un disparo por hecho.

---

## Archivos del canal (no los toques para un aviso nuevo)

| Pieza | Ruta |
|-------|------|
| Tabla | `lib/db/schema.ts` → `push_subscriptions` |
| Envio | `lib/services/push-notifications.ts` → `sendToUser` |
| Helpers del navegador | `lib/push-notifications.ts` |
| Service Worker | `public/sw.js` |
| Prompt de permiso | `components/push-notification-prompt.tsx` |
| Tarjeta de prueba (dashboard) | `components/push-notifications-card.tsx` |
| GET clave publica | `/api/push-notifications/vapid-public-key` |
| Guardar dispositivo | `POST /api/push-notifications/subscribe` |
| Listar / borrar | `/api/push-notifications/subscriptions` |
| Prueba a ti mismo | `POST /api/push-notifications/send-test` |

Para un aviso nuevo **solo** importas `sendToUser`. No agregues endpoints ni toques el SW.

Todavia no hay tabla de preferencias (`weekly_insights`, etc.). Cuando quieras tipos on/off, se agrega aparte. Hasta entonces, decide en el codigo si mandas o no.

---

## Checklist para que llegue al iPhone

1. Postgres arriba y `pnpm db:push` (tabla `push_subscriptions`).
2. Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
3. App en HTTPS (o localhost). En iPhone tiene que ser el host real con HTTPS.
4. PWA instalada con Safari y abierta desde el icono.
5. Permiso aceptado (modal o tarjeta del dashboard).
6. Fila en BD con endpoint `https://web.push.apple.com/...`.
7. Mismas VAPID keys que cuando se suscribio.
8. Ajustes iOS → Notificaciones → Gastos, no silenciadas.

Si el subscribe funciona y no llega el banner: casi siempre es que no esta en standalone, VAPID distintas, o la suscripcion ya murio (410). Quita el dispositivo y vuelve a activar.

Para probar el canal sin evento de negocio: dashboard → **Enviar prueba**.
