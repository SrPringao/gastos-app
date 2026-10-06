# ExpenseBro — Rediseño de modales de Patrimonio y Presupuesto + personas guardadas

Prompt para Claude Code. Este cambio continúa el rediseño "Apple dark" que ya está implementado: tokens `--eb-*`, `Money`, `AccountThumb`, `PatrimonioBalanceQuickAdd` y la hoja de detalle de método en Cuentas. **Toma como base el patrón del flujo "Nuevo método" / detalle de método en Cuentas**: hoja tipo iOS, barra superior Cancelar · Título · Acción, y campos en listas agrupadas estilo Ajustes. Reutiliza esos componentes; no crees estilos nuevos si ya existen.

Archivos de referencia (copiar a `design-reference/`). Son la fuente de verdad visual, así que copia valores exactos:

- `Phone-Modal-Positivo.dc.html`: nuevo elemento en Patrimonio, modo **Tengo**, sección **Te deben** con chips de personas.
- `Phone-Modal-Deuda.dc.html`: nuevo elemento, modo **Debo**, ligado a una tarjeta de crédito con sincronización activa.
- `Phone-Modal-Editar.dc.html`: editar un elemento existente.
- `Phone-Modal-Presupuesto.dc.html`: presupuesto del mes.

Modales que reemplazas:

- "Nuevo positivo"
- "Nueva deuda"
- "Editar entrada"
- "Presupuesto de {mes}"

No cambies la lógica de guardado existente salvo lo que se indica en las secciones 4 y 5. Haz un commit por cada parte.

---

## 1. Componente base `EbSheet`

Crea (o reutiliza el de Cuentas) un contenedor único para todos estos modales.

### Móvil (< 768px): hoja que sube desde abajo

- **Posición:** `position: fixed; left: 0; right: 0; top: calc(env(safe-area-inset-top) + 46px); bottom: 0`.
- **Forma y fondo:**
  - `border-radius: 14px 14px 0 0`
  - fondo `#111113`
  - `box-shadow: 0 -1px 0 rgba(255,255,255,0.08), 0 -20px 40px rgba(0,0,0,0.6)`
- **Altura:** todos los modales abren a la **misma altura**, incluido Presupuesto, aunque tenga menos contenido. No uses hojas cortas pegadas abajo.
- **Fondo de la página:** la página de atrás se reduce a `scale(0.94)` con esquinas de 14px y `opacity: .55`, sobre fondo `#000`. Es el efecto de hoja apilada de iOS. Bloquea el scroll del body.
- **Grabber:** 36×5, radio 3, `rgba(255,255,255,0.25)`, centrado, a 6px del borde superior.
- **Barra superior:** `display:grid; grid-template-columns: 1fr auto 1fr; padding: 6px 8px 0`.
  - Izquierda, "Cancelar": 17px, color `#8C95FF`.
  - Centro, el título: 17px/600.
  - Derecha, "Agregar" / "Guardar": 17px/600, color `#8C95FF`. Si el formulario es inválido, color `#636366` y deshabilitado.
  - Botones de texto con padding `12px 10px` (mínimo 44px de alto).
- **Se elimina:** la X de la esquina y el botón grande morado del final. La acción vive en la barra superior.
- **Contenido:** `padding: 10px 16px 40px; display:flex; flex-direction:column; gap:20px`, con scroll interno.
- **Sin scrollbar visible:**
  ```css
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  ```
- **Cerrar:** con swipe hacia abajo desde el grabber o la barra (umbral de ~120px o por velocidad), con Escape o con "Cancelar". Si hay cambios sin guardar, mostrar un action sheet: "Descartar cambios" / "Seguir editando".
- **Teclado:** el input de monto recibe foco al abrir y la hoja respeta el teclado (`visualViewport` / `env(keyboard-inset-height)`). **No dibujes un teclado.**

### Escritorio (≥ 768px): ventana centrada

- Medidas: `width: 480px; max-height: min(760px, 90vh)`, radio 26, mismo fondo y contenido.
- Overlay detrás: `rgba(0,0,0,0.5)` + `backdrop-filter: blur(8px)`.
- Animación de entrada: `scale(.96)` → `1` y `opacity`, en 200ms.

### Accesibilidad

- `role="dialog"` y `aria-modal="true"`.
- El foco queda atrapado dentro.
- Al cerrar, el foco vuelve al botón que abrió el modal.

---

## 2. Piezas reutilizables

1. **`AmountHero`**, el campo de monto grande. Va **siempre primero** (después del selector de tipo, si hay).
   - Contenedor `label`:
     - flex column centrado, gap 6, padding `20px 16px 18px`, radio 18
     - fondo `radial-gradient(100% 120% at 50% 0%, <tinte> 0.14, transparent 65%), #1C1C1F`
     - `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)`
   - Etiqueta arriba: 13px, color `#8E8E93`.
   - Valor (`--eb-font-rounded`):
     - "$" en 30px/700 con el color del tinte
     - input en 44px/700 blanco, centrado, -0.02em, `caret-color` = tinte, `inputmode="decimal"`
     - ".00" en 22px/600, color `#636366`
     - El ancho del input se ajusta al contenido.
   - Pie: 12px, color tertiary.
   - **Tintes:**

     | Caso | Color | Pie |
     |---|---|---|
     | Tengo | verde `#30D158` / `rgba(48,209,88,…)` | "Suma a tu patrimonio" |
     | Debo | rojo `#FF6961` / `rgba(255,105,97,…)` | "Resta a tu patrimonio" |
     | Presupuesto | índigo `#8C95FF` / `rgba(94,107,255,0.18)` | — |

   - **En edición**, el pie muestra el cambio: "Antes $5,700.00 · **+$20,820.00**". La diferencia va en verde si sube y en rojo si baja.
   - Formateo con separadores de miles al escribir; no acepta negativos.
2. **`GroupedList` y `ListRow`** (los mismos de Cuentas):
   - Grupo: radio 14, fondo `#1C1C1F`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)`.
   - Filas: 48–56px, padding `0 16px`, separador `1px rgba(255,255,255,0.06)`.
   - Fila de texto: etiqueta a la izquierda (16px) e input alineado a la derecha (16px, `#A1A1A6`, placeholder `#636366`).
   - Pie de grupo: 13px tertiary, padding `4px 16px 0`, line-height 1.4.
   - Encabezado de grupo: 13px uppercase tertiary, 0.02em.
3. **`Segmented`**:
   - Contenedor: fondo `rgba(118,118,128,0.24)`, radio 9–10, padding 2.
   - Opción activa: `linear-gradient(180deg,#5A5A60,#48484E)` + `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.35)`.
   - Accesibilidad: `role="radiogroup"` / `role="radio"`.
4. **`MethodPickerRow`**:
   - Fila "Método de pago" que muestra a la derecha `AccountThumb` de 38×25 + nombre + ícono de selector (↕), o "Ninguno".
   - Abre una hoja secundaria con la lista de métodos (mini tarjeta + nombre) y la opción "Ninguno".
5. **`IOSSwitch`**:
   - Medidas: 51×31, radio 16. Encendido `#30D158`, apagado `rgba(120,120,128,0.32)`.
   - Perilla de 27px blanca con sombra.
   - Accesibilidad: `role="switch"` y `aria-checked`.

---

## 3. Modal de Patrimonio: Nuevo / Editar (un solo componente)

`PatrimonioEntrySheet` reemplaza "Nuevo positivo", "Nueva deuda" y "Editar entrada".

- **Título:** "Nuevo", o el nombre del elemento si estás editando ("Nu Débito").
- **Acción:** "Agregar" o "Guardar".
- **Origen del botón +:** el + de Patrimonio abre este modal. Si se abrió desde la sección Deudas, el tipo viene preseleccionado en **Debo**; si no, en **Tengo**.

Orden de los bloques:

1. **Selector Tengo / Debo** (solo al crear). Es un `Segmented` de 2 opciones, alto 32px y 14px, con un punto de 7px de color antes del texto (verde / rojo). Al editar no se muestra: el tipo no cambia.
2. **`AmountHero`** con el tinte según el tipo.
3. **Grupo "Datos":**
   - **Nombre:** fila de texto. Placeholder "Ej: Nu, Sueldo, iPad".
   - **Sección:** solo en **Tengo**. `Segmented` de 3 opciones: **Cuenta / Te deben / Por recibir**, a todo lo ancho (alto 30, 13px), con la etiqueta "Sección" encima.
4. **Grupo "¿Quién te debe?":** solo con Tengo + Te deben. Ver sección 4.
5. **Grupo "Método de pago":**
   - `MethodPickerRow`.
   - Pie: "Opcional. Lígalo a una cuenta para poder sincronizarlo con tus gastos."
   - Al elegir un método, **el nombre se llena con el nombre del método** si estaba vacío o si era el nombre del método anterior. El usuario lo puede cambiar.
   - **Deudas ligadas a una tarjeta de crédito:** aparece la fila **"Fecha de pago"**.
     - Subtítulo: "Tomada de la tarjeta" (12px tertiary).
     - Valor: ícono de enlace + "Día 2 · en 27 días".
     - No se puede editar aquí.
     - Pie: "El día de pago se edita en Cuentas".
     - Usa `paymentDay` del método.
   - **Deudas sin tarjeta:** la fila es "Fecha límite" con selector de fecha (opcional), como hoy.
6. **Grupo "Sincronizar con gastos":** fila con `IOSSwitch`. Solo está habilitada si hay método de pago; si no, va gris con el pie "Elige un método de pago para activarla". El pie depende del tipo:
   - Tengo: "Si lo activas, cada gasto nuevo con {método} se resta de este saldo."
   - Debo: "Cada gasto nuevo con {método} sube esta deuda automáticamente."
7. **Solo al editar:** un grupo aparte con un botón centrado "Eliminar de Patrimonio" en `#FF6961`. Pide confirmación con un action sheet.

Validación: "Agregar" se activa cuando hay nombre y el monto es mayor a 0. Al editar, se activa cuando hay cambios.

---

## 4. Personas guardadas (funcionalidad nueva)

Hoy "Quién te debe" es un texto libre, así que hay que escribir a la misma persona cada vez y es fácil duplicarla ("Camila", "camila", "Cami"). Se agrega un catálogo de personas para elegirlas con un toque.

### 4.1 Modelo

- **Tabla nueva `contacts`:**
  - `id`
  - `userId`
  - `name` (string, recortado)
  - `nameKey` (minúsculas, sin acentos ni espacios dobles, para buscar duplicados)
  - `createdAt`
  - `archivedAt` (nullable)
  - Índice único (`userId`, `nameKey`).
- En los positivos de Patrimonio, agrega `contactId` (nullable, FK a `contacts`). Mantén el campo de texto actual durante la migración.
- **Migración no destructiva:**
  1. Por cada valor distinto del texto "quién te debe" (normalizado con `nameKey`), crea un `contact`.
  2. Liga los positivos a ese contacto.
  3. Si dos textos normalizan igual (por ejemplo "Camila" y "camila"), quedan en un solo contacto con el nombre más usado.
  4. Reporta en el resumen final cuántos contactos se crearon y cuáles se fusionaron.

### 4.2 UI en el modal (grupo "¿Quién te debe?")

Contenedor `GroupedList` con padding de 12×16 y `display:flex; flex-wrap:wrap; gap:8px`.

- **Chips de personas guardadas.** Orden: primero las que tienen saldo pendiente, luego por uso más reciente. Máximo 8 visibles; si hay más, agrega un chip "Ver todas" que abre un buscador.
  - Chip: alto 34, radio 17, padding `0 12px 0 4px`, gap 8, 14px.
  - Avatar dentro: círculo de 26px con la inicial (12px/600) y fondo `linear-gradient(180deg,#6E6E75,#48484E)`.
  - **Seleccionado:** fondo `rgba(94,107,255,0.22)`, `box-shadow: inset 0 0 0 1px rgba(94,107,255,0.5)`, texto blanco 500. Accesibilidad: `aria-pressed="true"`.
  - **No seleccionado:** fondo `rgba(255,255,255,0.06)`, texto `#C7C7CC`.
- **Chip "+ Otra persona"**: fondo transparente, `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14)`, color `#8C95FF`.
  - Al tocarlo, se convierte en un input en línea con foco ("Nombre") y botón "Agregar".
  - Mientras escribes, sugiere contactos existentes que coincidan (por `nameKey` o prefijo) para evitar duplicados: "¿Te refieres a **Camila**?".
  - Al confirmar, crea el contacto y lo deja seleccionado.
- **Pie dinámico** (13px tertiary). Cuando la persona elegida ya tiene saldo: "Se agrupa con lo que ya te debe Camila ($3,329.00 → $5,174.00)". Es la suma actual más el monto que se está capturando, y se actualiza en vivo.
- La selección es opcional: sin persona, el positivo es una fila suelta como hoy.

### 4.3 Otros lugares

- **Patrimonio, sección "Te deben":** agrupa por `contactId` en lugar del texto. La fila muestra el avatar, el nombre y los conceptos debajo ("Figs · Tarjeta").
- **Administrar personas:** agrega en Configuración una lista simple de personas para renombrar, fusionar duplicados y archivar. No hace falta diseño nuevo: usa `GroupedList`.
- **Archivar:** un contacto archivado no aparece en los chips, pero sus positivos se conservan.

---

## 5. Modal de Presupuesto

`BudgetSheet`. Misma hoja y **misma altura que los demás**: no es una hoja corta abajo.

- **Barra superior:** Cancelar · "Presupuesto" · Guardar.
- **`AmountHero` con tinte índigo:**
  - Etiqueta: "¿Cuánto planeas gastar en {mes}?"
  - Valor actual precargado.
- **Tarjeta de vista previa** (`GroupedList` con padding 14×16, gap 10). Se recalcula en vivo mientras escribes:
  - Fila de 13px: "Gastado hasta hoy" (tertiary) a la izquierda y "$6,496.60 · 72%" (600) a la derecha.
  - Barra de 8px: riel `rgba(0,0,0,0.45)` + relleno con degradado de acento y glow.
    - Si el gasto supera al presupuesto, la barra se pone naranja y el texto dice "Ya te pasaste por $X".
  - Texto: "Te quedarían **$2,503** · ≈ $100 al día". Los días restantes se cuentan igual que en el Dashboard.
- **Fila con `IOSSwitch` "Usar para los siguientes meses"** (subtítulo: "Puedes cambiarlo cuando quieras"):
  - **Nueva funcionalidad:** guarda el monto como presupuesto por defecto (`defaultBudget`) del usuario.
  - Los meses que no tienen presupuesto propio usan ese valor.
  - Si el mes ya tiene uno, no se sobrescribe.
  - Si hoy el presupuesto ya se hereda de otra forma, respeta la lógica actual y solo conecta el switch.

---

## 6. Plan

1. `EbSheet` (móvil + escritorio) y las piezas de la sección 2.
2. Personas guardadas: modelo, migración, chips y lugares de la sección 4.3.
3. `PatrimonioEntrySheet` en sus modos Nuevo y Editar, reemplazando los 3 modales viejos.
4. `BudgetSheet`, con `defaultBudget`.
5. Revisión a 390px y 1440px contra `design-reference/`: alturas, scrollbar oculta, foco y teclado.

Al final, entrégame un resumen con:

- Los archivos tocados.
- Las migraciones aplicadas.
- Los contactos creados y fusionados.
- Cualquier dato que no encajara.
