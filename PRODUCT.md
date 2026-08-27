# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hoy: el usuario principal (dueño del proyecto) usando la app para llevar sus propias finanzas personales (gastos, cuentas, presupuesto, patrimonio). Meta futura (no implementada aún): abrir el producto a usuarios ajenos entre sí. El modelo de datos ya aísla todo por `userId`, pero no hay todavía roles, planes, onboarding ni landing pensados para terceros — eso es una decisión de producto pendiente, no un hecho actual.

## Product Purpose

Llevar el control de finanzas personales: registrar gastos, organizarlos por cuenta (tarjeta de crédito/débito/efectivo) y categoría, dar seguimiento a un presupuesto mensual, registrar gastos fijos recurrentes, calcular patrimonio neto (activos y deudas) y simular escenarios financieros futuros.

## Positioning

El diferenciador frente a apps de finanzas genéricas (Mint, YNAB, etc.) es la captura automática de gastos: un Shortcut de iOS lee las notificaciones bancarias del teléfono y las envía a la app vía token de API, sin que el usuario tenga que capturar el gasto a mano. La app también manda notificaciones push propias (resumen diario vía cron, aviso al alcanzar cierto % del presupuesto).

## Operating Context

- PWA instalable (service worker, manifest, prompt de instalación) pensada para uso principalmente desde el celular.
- Flujo típico: el banco manda una notificación push → el Shortcut de iOS la intercepta y llama a la API de la app con un token → el gasto queda registrado sin intervención manual. También existe alta manual (quick-add) para cuando no aplica la automatización.
- Cron diario que envía un resumen de gastos por push notification.
- Existe un mapeo de "nombre de tarjeta detectado por el Shortcut" → cuenta real, para cuando el texto de la notificación no coincide literal con el nombre de la cuenta.
- Simulador de escenarios para proyectar patrimonio a futuro con base en gastos fijos y proyecciones manuales.

## Capabilities and Constraints

- Next.js (App Router) + TypeScript, Postgres vía Drizzle ORM, next-auth para autenticación.
- Montos se guardan en centavos (enteros) para evitar errores de punto flotante.
- Tokens de API con expiración, para uso externo (Shortcuts/automatizaciones), independientes de la sesión web.
- Aislamiento de datos por `userId` en cada tabla (accounts, categories, expenses, fixed expenses, net worth, push subscriptions, api tokens), ya listo como base para eventualmente soportar más de un usuario ajeno.
- Sin roles, planes ni permisos diferenciados todavía — un único nivel de usuario.
- Multiusuario para terceros es una meta futura explícita, no un requisito activo de esta fase: no se debe diseñar todavía onboarding, landing de adquisición ni diferenciación de planes salvo que se pida explícitamente.

## Evidence on Hand

Sin testimonios, casos de estudio ni prensa (proyecto personal en desarrollo activo). No fabricar evidencia de este tipo en trabajo futuro.

## Product Principles

- Cero fricción en la captura: el gasto debe registrarse solo, la app es para revisar y decidir, no para tipear.
- Los números son la fuente de verdad: montos exactos en centavos, sin ambigüedad de cuenta/categoría gracias al mapeo de nombres de tarjeta.
- Diseñada para vivir en el bolsillo: experiencia mobile/PWA primero, escritorio es secundario.
- Visión de crecimiento contenida: la base de datos ya se preparó para múltiples usuarios ajenos, pero el producto de hoy sigue siendo de un solo usuario — no adelantar trabajo de adquisición/onboarding de terceros sin pedirlo explícitamente.
