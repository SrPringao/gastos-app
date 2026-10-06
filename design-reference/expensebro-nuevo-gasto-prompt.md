# ExpenseBro — Rediseño del flujo **Nuevo gasto** (3 pasos)

Prompt para Claude Code. Continúa el rediseño "Apple dark" que ya está implementado. Reutiliza:

- `EbSheet`, `AmountHero`, `GroupedList`/`ListRow`, `Segmented` y `AccountThumb` (de los modales de Patrimonio y de Cuentas).
- Los tokens `--eb-*`.
- `CategoryTile` y `lib/category-style.ts`.
- La limpieza de nombres de comercio.

No crees estilos nuevos si ya existen.

Archivos de referencia (copiar a `design-reference/`). Son la fuente de verdad visual, así que copia valores exactos:

- `Phone-Gasto-1.dc.html`: Paso 1, monto y nota.
- `Phone-Gasto-2.dc.html`: Paso 2, método de pago.
- `Phone-Gasto-3.dc.html`: Paso 3, confirmación, fecha y categoría.

Reemplaza los 3 modales actuales ("Monto", "Método de pago", "Detalles del gasto"). **Conserva** la lógica de guardado, los campos y las validaciones que existen hoy: monto, nota/descripción, método, categoría opcional y fecha. Los puntos marcados como **(nuevo)** son funcionalidad adicional.

Se abre desde el + del TabBar, desde "Nuevo gasto" en escritorio y desde cualquier otro punto de entrada que exista hoy. Haz un commit por cada parte del plan.

---

## 1. Contenedor: `ExpenseFlowSheet`

- **Una sola hoja** (`EbSheet`) con los 3 pasos dentro; no son 3 modales. Al cambiar de paso, el contenido se desliza:
  - Hacia adelante: `translateX(24px)→0` con fade, en 220ms.
  - Hacia atrás: en sentido inverso.
  - Respeta `prefers-reduced-motion`.
  - **La hoja no cambia de altura** entre pasos.
- **Móvil:**
  - Ocupa el alto completo, igual que los modales de Patrimonio: `top: calc(env(safe-area-inset-top) + 46px)`.
  - Radio superior de 14, grabber, fondo `#111113` y scrollbar oculta.
  - La página de atrás se ve reducida a `scale(.94)` con opacidad .55.
- **Escritorio:** ventana centrada de 480px de ancho, radio 26, con el mismo contenido.
- **Barra superior** (`grid 1fr auto 1fr`):

  | Paso | Izquierda | Centro | Derecha |
  |---|---|---|---|
  | 1 | "Cancelar" | "Nuevo gasto" | "Siguiente" (600) |
  | 2 | "‹ Atrás" (chevron de 20px + texto) | "¿Cómo pagaste?" | vacío (el paso avanza al tocar un método) |
  | 3 | "‹ Atrás" | "Confirmar" | vacío (la acción es el botón grande del final) |

  - Botones de texto: 17px, color `#8C95FF`, padding `12px 10px`.
  - "Siguiente" en gris `#636366` y deshabilitado mientras el monto sea 0.
- **Indicador de pasos** debajo de la barra (centrado, gap 6px, `aria-label="Paso N de 3"`): 3 barras de 28×4 px, radio 2.
  - Paso actual: `#5E6BFF` con `box-shadow: 0 0 8px rgba(94,107,255,0.6)`.
  - Pasos completados: `rgba(94,107,255,0.5)`.
  - Pasos pendientes: `rgba(255,255,255,0.14)`.
- **Estado:** un solo objeto `{ amount, note, merchantKey?, methodId, date, categoryId }` que se conserva al ir y volver entre pasos.
- **Cerrar:** con swipe hacia abajo, Escape o "Cancelar". Si ya hay monto capturado, primero muestra un action sheet: "Descartar gasto" / "Seguir editando".
- **Swipe lateral:** en móvil, un swipe hacia la derecha equivale a "Atrás".

---

## 2. Paso 1: Monto y nota

Contenido con padding `18px 16px 40px` y gap 20.

1. **`AmountHero` con tinte índigo**, en versión grande:
   - padding `28px 16px 22px`, radio 22
   - etiqueta: "¿Cuánto gastaste?"
   - "$" en 34px/700 `#8C95FF`
   - valor en **56px**/700 blanco, -0.03em
   - ".00" en 26px/600 `#636366`
   - Al abrir, el input recibe foco con teclado decimal (`inputmode="decimal"`).
   - **Botones rápidos** dentro de la misma tarjeta (fila centrada, gap 8, margen superior 6): **+$100 · +$200 · +$500 · +$1k**.
     - Medidas: alto 34, radio 17, padding `0 14px`.
     - Fondo `rgba(255,255,255,0.08)` + `inset 0 1px 0 rgba(255,255,255,0.08)`, texto 14px/600.
     - **Suman** al monto actual (el texto con "+" lo deja claro).
     - Haptic ligero (`navigator.vibrate?.(8)`) si está disponible.
2. **Nota:** `GroupedList` con una fila de 52px: ícono de lápiz de 18px `#8E8E93` + input de 16px con placeholder "Añadir una nota". Enter equivale a "Siguiente".
3. **Recientes (nuevo):**
   - Encabezado "RECIENTES" (13px uppercase tertiary).
   - Fila de chips con wrap, gap 8. Cada chip:
     - alto 36, radio 18, padding `0 12px 0 4px`
     - fondo `rgba(255,255,255,0.06)` + `inset 0 0 0 1px rgba(255,255,255,0.06)`
     - texto 14px `#C7C7CC`
     - `CategoryTile` de 28px, radio 8, con el ícono de la categoría o el gris con la inicial si no tiene
   - **Datos:** hasta 6 comercios/notas distintos de los últimos 30 días, ordenados por frecuencia y recencia. Usa el nombre limpio (helper existente) y deduplica por nombre normalizado.
   - **Al tocar un chip:**
     - Llena la nota con ese nombre.
     - Guarda internamente `merchantKey`.
     - Precarga, sin avanzar, el **método** y la **categoría** que se usaron la última vez con ese comercio, para que el paso 2 los muestre preseleccionados.
     - No cambia el monto.
   - Pie (13px tertiary): "Toca uno para usarlo como nota. Si lo pagaste igual que la vez pasada, el siguiente paso lo sugiere."
   - Si no hay historial, la sección no se muestra.

Validación: "Siguiente" se habilita cuando el monto es mayor a 0. La nota sigue siendo opcional, como hoy.

---

## 3. Paso 2: ¿Cómo pagaste?

Contenido con padding `16px 16px 40px` y gap 18.

1. **Resumen** centrado: el monto en `--eb-font-rounded` 28px/700 (`$185.00`) y la nota en 15px tertiary ("· Tacos con Pily"). Si no hay nota, solo el monto.
2. **Más usadas** (encabezado uppercase de 13px):
   - Grid de 3 columnas, gap 10, con los 3 métodos más usados del mes actual. Si el mes tiene menos de 3 métodos usados, completa con los del mes anterior.
   - **Mini tarjeta (`button`):**
     - `aspect-ratio: 1.45`, radio 14, padding 10.
     - Mismo degradado y sombra que `AccountCard`.
     - Arriba, el nombre (12px/700). Abajo, "13 en oct" (10px, blanco al 80%).
   - **Preseleccionada** (la del último uso de ese comercio, o la más usada si no hay):
     - anillo `0 0 0 2px #111113, 0 0 0 4px #5E6BFF`
     - abajo a la derecha, círculo de 18px `#5E6BFF` con palomita blanca
     - `aria-pressed="true"`
3. **Todas:** `GroupedList` con el resto de los métodos activos (no archivados), ordenados por uso y luego por nombre, **sin repetir** los de "Más usadas".
   - Filas de 52px: `AccountThumb` de 38×25, nombre (16px), tipo (12px tertiary) y chevron.
4. **Interacción:** tocar cualquier método lo selecciona y **avanza automáticamente** al paso 3 tras 150ms, para que se vea la selección.
5. **Si viene precargado por un chip de Recientes:** el método aparece seleccionado y se muestra un botón texto "Continuar con Revolut Crédito ›" bajo "Más usadas", para avanzar sin volver a tocar.

---

## 4. Paso 3: Confirmar

Contenido con padding `16px 16px 30px` y gap 18.

1. **Tarjeta recibo:**
   - radio 22
   - fondo `radial-gradient(100% 120% at 50% 0%, rgba(94,107,255,0.14), transparent 65%), #1C1C1F`
   - `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)`

   Contenido de la tarjeta:
   - **Parte superior** (centrada, padding `20px 16px 16px`):
     - monto en rounded 44px/700, con ".00" en 22px/600 tertiary
     - debajo, la nota en 15px `#C7C7CC`
     - tocar el monto o la nota vuelve al paso 1
   - **Separador punteado:** `border-top: 1px dashed rgba(255,255,255,0.12)`.
   - **Parte inferior** (fila, padding `12px 16px`): `AccountThumb` de 38×25 + nombre del método (15px) + botón texto "Cambiar" (`#8C95FF`) que vuelve al paso 2.
2. **Fecha** (encabezado "FECHA"): `GroupedList` con padding de 12×16, gap 10.
   - `Segmented` de 3 opciones: **Hoy / Ayer / Otra fecha** (por defecto, Hoy).
   - Debajo, la fecha completa (13px tertiary, centrada): "Martes 6 de octubre de 2026", con `Intl.DateTimeFormat('es-MX', { dateStyle: 'full' })`.
   - "Otra fecha" abre el date picker existente (en móvil, el nativo con `input type="date"`). Al elegir, la opción queda activa y la fecha se muestra debajo.
   - No permite fechas futuras, igual que hoy.
3. **Categoría:**
   - Encabezado "CATEGORÍA" a la izquierda y "Opcional" a la derecha (sin uppercase).
   - **Fila horizontal con scroll** (`margin: 0 -16px; padding: 0 16px; gap 8`) con chips de las categorías del usuario, ordenadas por uso.
   - Chip:
     - alto 36, radio 18, padding `0 12px 0 4px`, `CategoryTile` de 28px
     - **seleccionado:** fondo `rgba(94,107,255,0.22)`, `box-shadow: inset 0 0 0 1px rgba(94,107,255,0.5)`, texto blanco/500, `aria-pressed="true"`
     - **no seleccionado:** fondo `rgba(255,255,255,0.06)`, texto `#C7C7CC`
   - Tocar el chip seleccionado lo deselecciona (queda "Sin categoría").
   - Al final va un chip "Más" (con borde y color link) que abre la lista completa con buscador.
   - Precarga la categoría del último uso del comercio si vino de Recientes.
   - **Usa las categorías reales del usuario.** Los nombres de la referencia (Comida, Gasolina, Auto, Tienda) son de ejemplo.
4. **Impacto en el presupuesto (nuevo):**
   - Pastilla `.eb-well`: radio 14, padding `12px 14px`, fondo `rgba(0,0,0,0.3)`, `inset 0 0 0 1px rgba(255,255,255,0.05)`.
   - Ícono de reloj de 16px en `#8C95FF` + texto de 13px: "Te quedarán **$2,318** del presupuesto · ≈ $93 al día".
   - Cálculo: presupuesto del mes de la fecha elegida − gastado en ese mes − monto. "Por día" usa los mismos días restantes que el Dashboard.
   - **Variantes:**
     - Si el resultado es negativo: tinte naranja con el texto "Con este gasto te pasas por **$X**".
     - Si la fecha es de otro mes: "Presupuesto de {mes}: quedan $X".
     - Si no hay presupuesto, la pastilla no se muestra.
5. **Botón "Guardar gasto"** (el único botón grande del flujo):
   - Medidas: alto 52, radio 16, a todo lo ancho, texto 17px/600.
   - `linear-gradient(180deg,#929AFF,#5E6BFF)` + `inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 24px -10px rgba(94,107,255,0.6)`.
   - **Al guardar:**
     - Cierra la hoja.
     - Muestra el toast "Gasto de $185.00 guardado" con "Deshacer" durante 5 segundos.
     - Refresca el Dashboard y Gastos.
     - Si el método tiene "Sincronizar con gastos" en Patrimonio, aplica la lógica existente.
   - Mientras guarda: spinner dentro del botón y botón deshabilitado.

---

## 5. Datos y helpers

Crea en `lib/expense-suggestions.ts`:

- `getRecentMerchants(userId, { days: 30, limit: 6 })` → `[{ key, label, categoryId?, lastMethodId?, lastCategoryId? }]`.
- `getTopMethods(userId, month, limit = 3)` → los métodos más usados.
- `getBudgetImpact(userId, date, amount)` → `{ remaining, perDay, overBy?, monthLabel }`.

Pon tests si el proyecto los tiene. No agregues tablas: todo sale de los gastos existentes.

---

## 6. Plan

1. `ExpenseFlowSheet` con navegación entre pasos, estado compartido, indicador y cierre con confirmación.
2. Paso 1, con "Recientes" y la precarga de método y categoría.
3. Paso 2, con "Más usadas", "Todas" y el avance automático.
4. Paso 3: recibo, fecha, categoría, impacto en el presupuesto y guardado con deshacer.
5. Revisión a 390px y 1440px contra `design-reference/`: alturas iguales entre pasos, sin scrollbar, foco y teclado.

Al final, entrégame un resumen con:

- Los archivos tocados.
- Los modales viejos que eliminaste.
- Cualquier diferencia con el flujo anterior.
