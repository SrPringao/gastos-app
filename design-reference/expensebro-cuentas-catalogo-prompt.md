# ExpenseBro — Rediseño de **Cuentas** como catálogo de métodos de pago

Prompt para Claude Code. **Continúa el rediseño "Apple dark" que ya implementaste** (tokens `--eb-*`, `Card`, `Money`, `AccountCard`/`AccountThumb`, `GroupedList`/`ListRow`, `Grain`, `TabBar`, `usePrivacy`, helpers en `lib/`). Reutiliza todo; no dupliques estilos.

Archivos de referencia: cópialos a `design-reference/`. Son la fuente de verdad visual, así que copia los valores exactos.

- `design-reference/Cuentas.dc.html` → Cuentas en escritorio (catálogo + panel de detalle).
- `design-reference/Phone-Cuentas.dc.html` → Cuentas en iPhone (pila estilo Wallet).
- `design-reference/Phone-Cuenta-Detalle.dc.html` → Hoja de detalle/configuración de un método en iPhone.

Variables en esos archivos: `{{accent}}` = `#5E6BFF`, `{{accentLight}}` = `#929AFF`, `{{accentGlow}}` = `rgba(94,107,255,0.45)`. Los datos dentro de `renderVals()` son de ejemplo.

Reglas:

- No toques el sidebar; en esta página el item activo es "Cuentas".
- No rompas el alta, la edición y el borrado de métodos de pago ni el atajo de Apple Pay que ya funciona (los "mapeos" de nombres de Wallet → método).
- Haz commit por cada parte.

---

## 0. Concepto: qué es cada sección

| Sección | Pregunta que responde | Muestra montos |
|---|---|---|
| **Patrimonio** | ¿Cuánto tengo y cuánto debo? | Sí. Es el único lugar donde se editan saldos. |
| **Cuentas** | ¿Con qué pago y cómo está configurado? | **No.** Es el catálogo de métodos de pago y su configuración. |

Cuentas **no muestra saldos**. Solo puede *crear* el saldo inicial en Patrimonio (sección 4) y enlazar a él. Elimina de esta página todo lo que repita a Patrimonio. **No toques la página Patrimonio**, salvo lo que dice la sección 5.

**Se elimina de la página actual:**

- El botón "Agregar gasto" del header de "Métodos de pago". En móvil ya existe el + del TabBar.
- La sección separada "Tarjetas del Shortcut / Mapeos guardados". Los mapeos pasan a vivir **dentro de cada método** (sección 3.3, bloque "Apple Pay").
- Si quedó algo de la versión anterior de este rediseño (KPIs de Disponible/Deuda, tabla de crédito con saldos), quítalo.

---

## 1. Modelo de datos

Revisa el modelo actual de métodos de pago y de Patrimonio y aplica esto con migraciones **no destructivas**:

1. **`paymentMethod.paymentDay`** (`int 1–31`, nullable): **día de pago** de las tarjetas de crédito.
   - **Reemplaza cualquier concepto de "día de corte"**. No se calcula el corte en ningún lado.
   - Migración: si hoy las deudas de Patrimonio guardan días restantes o una fecha, deriva el `paymentDay` de esa fecha. Si no se puede, déjalo en `null`.
2. **`paymentMethod.color`**: ya existe. Mantén la paleta de 7 swatches (sección 3.3) y deriva de ahí el degradado de las tarjetas.
3. **`paymentMethod.archivedAt`** (timestamp, nullable):
   - Archivar oculta el método del catálogo y de los selectores de "Agregar gasto", pero **conserva sus gastos**.
   - Agrega un toggle "Mostrar archivados" al final del catálogo.
   - Usa esto en lugar de borrar.
4. **Mapeos de Apple Pay:** se mantiene la tabla actual (`walletName → paymentMethodId`). Solo cambia dónde se editan. Un método puede tener **varios** nombres de Wallet.
5. **Vínculo con Patrimonio:** cada positivo/deuda de Patrimonio ya puede ligarse a un método. Asegúrate de que exista una relación consultable: `patrimonioItem.paymentMethodId`, único por método.
6. **Estado `noBalance`:** cuando el usuario elige "No debo nada por ahora" / "No tengo saldo por ahora", crea el item en Patrimonio con monto `0` y ligado al método. Así deja de pedirse el saldo. No hace falta un campo nuevo.

---

## 2. Datos que muestra el catálogo (sin montos)

Crea `lib/payment-methods.ts` con un helper `getPaymentMethodsCatalog(month)` que devuelva, por cada método:

- `name`, `type` (`debit` | `credit` | `cash`), `colorFrom`, `colorTo` (derivados de `color`).
- `paymentDay` (solo crédito).
- `usesThisMonth`: número de gastos del mes con ese método. Es un **conteo, no un monto**.
- `walletNames[]`: los mapeos de Apple Pay.
- `isLinkedToShortcut` = `walletNames.length > 0`.
- `patrimonioItem` (o `null`) y `hasBalance` = `patrimonioItem !== null`.

Orden:

- Agrupados en **Crédito**, **Débito** y **Efectivo**, en ese orden.
- Dentro de cada grupo, por `usesThisMonth` de mayor a menor y luego por nombre.

---

## 3. Escritorio (`Cuentas.dc.html`)

Layout: el sidebar intacto + `<main>` con `padding: 40px 48px 64px` y contenido de `max-width:1120px` centrado. Fondo `.eb-page` con glow índigo `radial-gradient(70% 30% at 62% -4%, rgba(94,107,255,0.12), transparent 70%)` + `<Grain/>`.

### 3.1 Header

- Izquierda:
  - "MÉTODOS DE PAGO" (13px, uppercase, 600, tertiary, 0.04em).
  - `h1` "Cuentas" (34px/700).
- Derecha: botón **"Nuevo método"**.
  - `.eb-btn-primary`, alto 40, radio 20, ícono + de 16px.
  - Abre el flujo de la sección 6.
- No lleva botón de ocultar saldos, porque aquí no hay saldos.

### 3.2 Cuerpo: grid de 12 columnas, gap 24px, `align-items: start`

Debajo de 1000px todo pasa a `1 / -1` y el panel de detalle se convierte en un sheet o modal.

**Columna izquierda, `span 7`, flex column, gap 22px:**

1. **Franja "Atajo de Apple Pay"**: radio 18, padding `14px 16px`, superficie `.eb-card`.
   - Tile de 36×36, radio 10, con degradado `linear-gradient(135deg, #FF6B8B 0%, #A35BFF 55%, #4F7BFF 100%)` y un rayo blanco de 18px.
   - Título "Atajo de Apple Pay" (15px/600).
   - Subtítulo "**N de M** métodos registran gastos solos al pagar con Wallet" (13px, tertiary).
   - A la derecha, M puntos de 8px, gap 3: verdes (`#30D158`) para los vinculados y `rgba(255,255,255,0.14)` para el resto.
   - Clic: hace scroll y selecciona el primer método sin vincular.
2. **Un bloque por grupo** (Crédito / Débito / Efectivo):
   - Header: título (20px/700) y, a la derecha, el conteo (13px, tertiary).
   - Grid de `repeat(3, minmax(0,1fr))`, gap 14px.
   - **Tarjeta del catálogo**: un `<button>` con `aria-pressed` que selecciona el método.
     - Medidas: `aspect-ratio: 1.586`, radio 16, padding `12px 14px`.
     - Fondo `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.2), transparent 55%), linear-gradient(145deg, colorFrom, colorTo)`.
     - Sombra `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 16px 28px -16px colorTo`.
     - Arriba: nombre (14px/700, blanco). Si está vinculada al atajo, a la derecha va un círculo de 22px con fondo `rgba(255,255,255,0.22)` y un rayo blanco de 12px (`title="Vinculada al atajo"`).
     - Centro:
       - Crédito y débito: chip de 28×20, radio 4. Dorado `#F3E1A6 → #C9A55A` o plateado `#E9EAEE → #A8ABB5`; usa plateado cuando el color base es frío o gris.
       - Efectivo: ícono de billete de 24px.
     - Abajo (11px): izquierda "Pago día 2" (crédito), "Débito" o "En mano"; derecha "13 gastos", "1 gasto" o "Sin uso en oct".
     - **Seleccionada:** añade `0 0 0 2px var(--eb-bg), 0 0 0 4px var(--eb-accent)` a la sombra.
     - Si no tiene saldo en Patrimonio, no se marca en la tarjeta pequeña; el aviso aparece en el panel.
   - Teclado: flechas para moverse entre tarjetas y Enter para seleccionar.

**Columna derecha, `span 5`: panel de detalle del método seleccionado** (`<aside aria-label="Detalle del método">`, `.eb-card`, radio 26, padding 22, flex column, gap 20). Es *sticky* con `top: 24px` en escritorio. Por defecto se selecciona el primer método sin saldo en Patrimonio; si no hay, el más usado.

1. **Tarjeta grande de vista previa**:
   - Medidas: `aspect-ratio 1.586`, radio 20, padding 20, mismo fondo que la tarjeta del catálogo y sombra `0 24px 40px -20px`.
   - Arriba: nombre (20px/700).
   - Arriba a la derecha, una de dos etiquetas:
     - Si está vinculada: pastilla "⚡ Atajo" (alto 26, radio 13, fondo `rgba(255,255,255,0.2)`, 12px/600).
     - Si **no tiene saldo en Patrimonio**: pastilla naranja "Sin saldo en Patrimonio" (fondo `rgba(255,159,10,0.22)`, `box-shadow: inset 0 0 0 1px rgba(255,159,10,0.4)`, texto `#FFD08A`).
     - Si aplican las dos, gana la naranja.
   - Centro: chip de 40×30.
   - Abajo (13px, blanco al 80%): "Crédito · Pago día 2" a la izquierda y "13 gastos en oct" a la derecha.
   - La vista previa se actualiza en vivo al cambiar nombre, tipo o color.
2. **Sección "SALDO EN PATRIMONIO"**: va primero en el formulario. Ver sección 4.
3. **Sección "GENERAL"**: lista agrupada.
   - Contenedor: radio 14, fondo `rgba(0,0,0,0.25)`, `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05)`.
   - Filas de 48px, padding `0 14px`, separadas por `1px rgba(255,255,255,0.06)`.
   - Encabezado de la sección: 12px/600, uppercase, tertiary.
   - Filas:
     - **Nombre:** texto editable inline; el valor va en `#A1A1A6`.
     - **Tipo:** segmented de 3 opciones (Débito / Crédito / Efectivo).
       - Contenedor: fondo `rgba(118,118,128,0.24)`, radio 9, padding 2.
       - Opción activa: `linear-gradient(180deg,#5A5A60,#48484E)` + `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.35)`, 13px/600.
       - Al cambiar el tipo se muestran u ocultan los campos de crédito.
     - **Color:** 7 swatches circulares de 20px con degradado 145deg:
       - `#13969C → #0A5559`
       - `#3E44C9 → #1E2170`
       - `#6B3FC4 → #3A1C7A`
       - `#E0573A → #7A1F12`
       - `#F08A24 → #9A4A0C`
       - `#2E7A45 → #173F24`
       - `#5A5A63 → #26262B`
       - El seleccionado lleva el anillo `0 0 0 2px <fondo>, 0 0 0 4px #B3B9FF`.
       - Si un método existente usa un color fuera de la paleta, muéstralo como 8º swatch "personalizado".
     - **Día de pago** (solo crédito): "Día de pago" con la nota "Aparece en Próximos pagos" (12px, tertiary). El valor es "Día 2 de cada mes", con un ícono de selector arriba/abajo, y abre un picker de 1 a 31.
4. **Sección "APPLE PAY"**: lista agrupada con el mismo estilo.
   - Una fila de 52px por cada `walletName`:
     - Tile gris de 30px con ícono de tarjeta.
     - Nombre (15px) y "Nombre en Wallet" (12px, tertiary).
     - Botón texto "Quitar" en `#FF6961`.
   - Si no hay ninguno: fila de 44px "Ningún nombre de Wallet vinculado" en tertiary.
   - Fila-botón al final: "⊕ Agregar nombre de Wallet" en color link, con un círculo de 30px `rgba(94,107,255,0.18)`. Abre un input inline.
     - Valida que el nombre no esté vinculado a **otro** método. Si lo está, ofrece "Mover aquí".
   - Pie (12px, tertiary): "Escribe el nombre exacto con el que aparece la tarjeta en Wallet. Puedes agregar varios."
5. **Pie del panel**:
   - Izquierda: link "Ver sus gastos", que abre Gastos filtrado por ese método.
   - Derecha: botón texto "Archivar método" en `#FF6961`, con confirmación: "Se ocultará de Cuentas y de Agregar gasto. Sus N gastos se conservan."

Guardado: autosave por campo con debounce de 500ms y un "Guardado" sutil, o botones "Cancelar / Guardar" si el proyecto ya usa formularios explícitos. Elige el patrón que ya exista en el repo.

---

## 4. Bloque "Saldo en Patrimonio"

Es un componente `PatrimonioBalanceQuickAdd` que se usa en el panel de escritorio, en la hoja de iPhone y en el flujo de Nuevo método.

### 4.1 Estado A: el método **no** tiene item en Patrimonio

Contenedor:

- Radio 14, padding 14px (16 en móvil), flex column, gap 12px.
- Fondo `radial-gradient(100% 120% at 0% 0%, rgba(255,105,97,0.10), transparent 60%), rgba(0,0,0,0.25)`.
- Para débito o efectivo usa el tinte verde: `rgba(48,209,88,0.10)`.
- Borde: `inset 0 0 0 1px rgba(255,255,255,0.06)`.

Contenido:

1. **Aviso**: ícono de alerta de 18px en `#FF9F0A` y texto de 13px en `#C7C7CC`.
   - Crédito: "Esta tarjeta aún no tiene saldo en Patrimonio. ¿Cuánto debes hoy?"
   - Débito: "Esta cuenta aún no tiene saldo en Patrimonio. ¿Cuánto tienes hoy?"
   - Efectivo: "¿Cuánto efectivo tienes hoy?"
2. **Campo de monto**:
   - Label "Deuda actual" o "Saldo actual" (12px, tertiary).
   - Input de alto 52 (56 en móvil), radio 12, fondo `rgba(118,118,128,0.18)`.
   - En foco: `box-shadow: inset 0 0 0 2px rgba(94,107,255,0.6)`.
   - Prefijo "$" en `--eb-font-rounded` 24px/700, tertiary. Valor en rounded 24px/700 blanco (28px en móvil).
   - `inputmode="decimal"`, se formatea como moneda al perder el foco y no acepta negativos: el signo lo pone el tipo.
3. **Destino**: punto de 8px (rojo `#FF6961` para crédito, verde `#30D158` para débito o efectivo) y el texto (12–13px, secondary):
   - Crédito: "Se crea en **Deudas** ligada a {nombre}".
   - Débito o efectivo: "Se crea en **Cuentas** ligada a {nombre}".
4. **Botón principal "Agregar a Patrimonio"**:
   - Alto 44 (50 en móvil), radio 12–14, `.eb-btn-primary`.
   - Deshabilitado si el monto está vacío.
   - Al confirmar:
     - Crea el item en Patrimonio, con `kind` `debt` o `account` según el tipo, `name` = nombre del método, `amount` y `paymentMethodId`.
     - Si es crédito y tiene `paymentDay`, Patrimonio lo usa para su "Xd restantes" (sección 5).
     - Muestra un toast: "Deuda de $3,000.00 agregada a Patrimonio" con la acción "Deshacer" durante 5 segundos.
     - El bloque pasa al Estado B con una transición suave.
5. **Link secundario**: "No debo nada por ahora" (crédito) o "No tengo saldo por ahora" (débito). Texto de 13px en tertiary. Crea el item con monto 0 (ver 1.6) y pasa al Estado B.

### 4.2 Estado B: el método **ya** tiene item en Patrimonio

Se reduce a una sola fila en la lista agrupada, con alto 48:

- Izquierda: "Deuda actual" o "Saldo actual" (15px).
- Derecha: monto (15px/600, componente `Money` con la prop `private` para respetar "ocultar saldos") + link "Ver en Patrimonio ↗" en color link, que abre Patrimonio con ese item resaltado.

**Este bloque no edita el monto:** los saldos se editan solo en Patrimonio, para que no existan dos lugares donde cambiarlos.

---

## 5. Cambios mínimos fuera de Cuentas

1. **Patrimonio, deudas:** el "Xd restantes" de cada deuda ligada a una tarjeta se calcula desde `paymentDay` del método: días hasta el próximo día de pago a partir de hoy. Si el método no tiene `paymentDay`, conserva el comportamiento actual.
2. **Dashboard, "Próximos pagos"** y el widget "Próximo pago" del iPhone: usan `paymentDay`. Ya no se calcula ningún corte.
3. **Selectores de "Agregar gasto":** ocultan los métodos archivados.
4. **Gastos:** acepta `?method=<id>` para abrirse filtrado (lo usa "Ver sus gastos").

---

## 6. Flujo "Nuevo método"

En escritorio es un modal y en iPhone una hoja. Usa los mismos bloques que el panel de detalle:

1. Vista previa de la tarjeta, que se actualiza en vivo.
2. General: nombre, tipo, color y día de pago (solo crédito).
3. Apple Pay: opcional, "Agregar nombre de Wallet".
4. **Paso final opcional: el bloque de la sección 4** con el título "¿Quieres registrar su saldo en Patrimonio?". Si se llena, al guardar el método se crean **en una sola acción** el método y su item de Patrimonio ligado. Si se omite, el método queda en el Estado A.

Botones: "Cancelar" y "Crear método". Este último queda deshabilitado mientras no haya nombre ni tipo.

---

## 7. iPhone

### 7.1 Cuentas (`Phone-Cuentas.dc.html`, < 768px)

- Contenedor con padding `64px 16px 140px`, gap 22px, fondo con glow índigo + grano. TabBar abajo con **"Cuentas" activo**.
- **Header:**
  - Izquierda: "MÉTODOS DE PAGO" (13px, uppercase, tertiary) y el título "Cuentas" (34px/700).
  - Derecha: botón circular de 36px con fondo `rgba(255,255,255,0.08)` y + en color link. Abre Nuevo método.
- **Pila estilo Apple Wallet** con todos los métodos:
  - Contenedor `position:relative` con alto = `(n−1) × 52 + 220` px.
  - Cada tarjeta es un `<a>`/`<button>` absoluto con `left:0; right:0; top: i×52px; height:220px`, radio 18 y padding `15px 18px`.
  - Fondo y chip como en escritorio. Sombra `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 -6px 16px rgba(0,0,0,0.45)`.
  - **Franja visible** (alto 22px dentro del padding): nombre a la izquierda (16px/700) y, a la derecha, el tipo (12px, blanco al 80%) precedido del rayo de 22px si está vinculada.
  - **Orden:** atrás los menos usados y al frente el **más usado del mes**.
  - **La tarjeta del frente se ve completa:**
    - Chip de 40×30.
    - Abajo: "Pago día 2 · Más usada" (12px) y "13 gastos en octubre" (20px/700).
    - Chevron a la derecha.
  - Si algún método no tiene saldo en Patrimonio, su franja muestra un punto naranja de 8px junto al tipo.
  - **Interacción:**
    - Tocar una tarjeta de atrás la trae al frente con una animación `translateY` de unos 300ms (spring suave).
    - Tocar la del frente abre la **hoja de detalle** (7.2).
    - Respeta `prefers-reduced-motion`.
- Debajo, el texto "Toca una tarjeta para ver y editar sus ajustes" (13px, tertiary, centrado).
- **Lista agrupada con una sola fila** de 60px:
  - Tile de 30px con el degradado del atajo y un rayo.
  - "Atajo de Apple Pay" y debajo "2 de 9 métodos vinculados" (13px, tertiary), con chevron.
  - Abre una lista de todos los métodos con sus nombres de Wallet, para vincular rápido.
- Pie de esa lista: "Los saldos de cada cuenta viven en Patrimonio." (13px, tertiary).

### 7.2 Hoja de detalle (`Phone-Cuenta-Detalle.dc.html`)

- Sheet modal nativo:
  - Radio superior de 14, fondo `#111113` y grabber de 36×5.
  - Barra superior: "Cancelar" (17px, link) · nombre del método (17px/600) · "Listo" (17px/600, link).
- Contenido con padding `12px 16px 40px` y gap 22px:
  1. Vista previa de la tarjeta (alto 222, radio 18), igual que en escritorio, con la etiqueta naranja "Sin saldo" cuando aplica.
  2. **SALDO EN PATRIMONIO:** el bloque de la sección 4, con tamaños de móvil. En Estado A va **primero**, porque es lo más importante al dar de alta.
  3. **GENERAL:** lista agrupada con radio 14 y fondo `#1C1C1F`.
     - Nombre (fila de 48px).
     - Tipo: segmented a todo lo ancho, con alto 30.
     - Día de pago (solo crédito, fila de 52px con la nota "Aparece en Próximos pagos").
     - Color: 7 swatches de 30px repartidos con `space-between`.
  4. **APPLE PAY:**
     - Filas de 56px con un botón circular rojo de 22px con "−" (estilo edición de iOS) para quitar.
     - Fila "Agregar nombre de Wallet" con un círculo verde de 22px y "+".
     - Pie explicativo (13px).
  5. **Grupo final:**
     - "Gastos con esta tarjeta · 13 en oct ›", que lleva a Gastos filtrado.
     - "Archivar método" en `#FF6961`, con un action sheet de confirmación.

---

## 8. Plan

1. **Modelo y migraciones** (sección 1) + `lib/payment-methods.ts` (sección 2) + cambios de la sección 5. Commit.
2. **`PatrimonioBalanceQuickAdd`** con sus dos estados y su toast con deshacer. Commit.
3. **Escritorio:** catálogo + panel de detalle. Elimina la sección vieja de mapeos y el botón "Agregar gasto". Commit.
4. **Nuevo método** (sección 6). Commit.
5. **iPhone:** pila Wallet + hoja de detalle. Commit.

En cada paso, compara lado a lado contra los archivos de `design-reference/` a 1440 px y 390 px.

Al final, entrégame un resumen con:

- Los archivos tocados.
- Las migraciones aplicadas.
- Cómo quedó resuelto `paymentDay` para los métodos existentes.
