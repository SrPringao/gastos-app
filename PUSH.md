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
| `title`  | si          | Lo que iOS pone en **negrita**. No pongas "Gastos": iOS ya muestra la app aparte. |
| `body`   | si          | La linea de detalle debajo. Corto, sin HTML. Payload < 3 KB. |
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

## Como se ve en iPhone (diseno)

iOS arma el banner asi, y **no puedes quitar** la linea `from Gastos`. La pone el sistema con el `name` / `short_name` del manifest. En una PWA no hay forma de dejar solo el icono + el texto.

```
[icono]  Presupuesto al 80%          Ahora
         from Gastos
         Ya gastaste $8,000 de $10,000
```

Por eso **nunca** uses `title: "Gastos"`. Si lo haces, queda:

```
Gastos
from Gastos
Esta es una notificacion de prueba
```

Eso es lo que viste: se duplica el nombre y se ve largo.

Patron correcto:

```ts
await sendToUser({
  userId,
  title: "Presupuesto al 80%",           // negrita: que paso
  body: "Ya gastaste $8,000 de $10,000", // detalle
  url: "/gastos",
  tag: "budget-80",
});
```

Donde se "disena":

| Lo que ves | Donde se controla | Se puede? |
|------------|-------------------|-----------|
| Titulo en negrita | `title` en `sendToUser` | si |
| Texto de abajo | `body` en `sendToUser` | si |
| `from Gastos` | iOS + `app/manifest.ts` (`name` / `short_name`) | no se oculta; solo puedes cambiar el nombre de la app |
| Icono gris con G | icono de la PWA (`public/icon.svg`, `apple-touch-icon`) | si, con un PNG 180/192. iOS casi ignora el `icon` del SW |
| Color, HTML, imagen grande | Web Push en iOS | no |

`public/sw.js` solo muestra lo que mando `sendToUser`. Para un aviso nuevo no lo edites: cambia `title` y `body` en la llamada.

---

## Archivos del canal (no los toques para un aviso nuevo)

| Pieza | Ruta |
|-------|------|
| Tabla | `lib/db/schema.ts` → `push_subscriptions` |
| Envio | `lib/services/push-notifications.ts` → `sendToUser` |
| Helpers del navegador | `lib/push-notifications.ts` |
| Service Worker | `public/sw.js` |
| Prompt de permiso | `components/push-notification-prompt.tsx` |
| Tarjeta en Config | `components/push-notifications-card.tsx` |
| Resumen diario (cron) | `GET /api/cron/daily-summary` |
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
5. Permiso aceptado (modal al instalar o Config → Activar).
6. Fila en BD con endpoint `https://web.push.apple.com/...`.
7. Mismas VAPID keys que cuando se suscribio.
8. Ajustes iOS → Notificaciones → Gastos, no silenciadas.

Si el subscribe funciona y no llega el banner: casi siempre es que no esta en standalone, VAPID distintas, o la suscripcion ya murio (410). Quita el dispositivo y vuelve a activar.

Para probar el canal sin evento de negocio: Config → **Enviar prueba**.

---

## Resumen diario automatico

Cada noche (10:00 pm hora Mexico, `0 4 * * *` UTC) Vercel llama `GET /api/cron/daily-summary`.

Para cada usuario con al menos un dispositivo suscrito:

- Suma los gastos del dia calendario en `America/Mexico_City`.
- Si no registro ninguno, **no manda** aviso.
- Si si: `title` tipo `3 gastos hoy`, `body` tipo `Registraste $1,240.00`, `tag` `daily-summary-YYYY-MM-DD`.

Protegido con `CRON_SECRET` (header `Authorization: Bearer ...`). En Vercel, pon la misma variable. El cron de Vercel manda ese Bearer solo.

No lo pruebes a mano sin el secret. Un ejemplo:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-dominio/api/cron/daily-summary
```
