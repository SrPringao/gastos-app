# ExpenseBro — Cuentas (escritorio), ocultar saldos y rediseño de Gastos

Prompt para Claude Code. **Continúa el rediseño "Apple dark" que ya implementaste.** Reutiliza los tokens (`--eb-*`), componentes (`Card`, `Money`, `SegmentedBar`, `CategoryTile`, `GroupedList`/`ListRow`, `Grain`, `MonthSwitcher`, `TabBar`, swipe de filas) y helpers (`lib/dashboard-metrics.ts`, `lib/category-style.ts`, limpieza de nombres de comercio) que ya existen. No dupliques nada. Si algún componente no quedó reutilizable, extráelo primero.

Archivos de referencia (copiar/actualizar en `design-reference/`). Son la fuente de verdad visual: copia valores exactos de ahí.

- `design-reference/Main.dc.html` → **actualizado**: nueva tarjeta Cuentas + botón de ocultar saldos.
- `design-reference/Gastos.dc.html` → **nuevo**: página Gastos en escritorio.
- `design-reference/Phone-Gastos.dc.html` → **nuevo**: página Gastos en móvil (390 px).

Variables en esos archivos: `{{accent}}` = `#5E6BFF`, `{{accentLight}}` = `#929AFF`, `{{accentGlow}}` = `rgba(94,107,255,0.45)`. Los textos y montos dentro de `renderVals()` son datos de ejemplo. Tú los calculas con datos reales.

Reglas de siempre:

- **No tocar el sidebar.** En la página Gastos, el item activo del sidebar es "Gastos", con el mismo estilo activo que ya existe.
- **No romper funcionalidad existente:** agregar, editar y borrar gastos, filtros, búsqueda, selector de mes, "toca una barra para ver los gastos del día".
- Commit por parte (A, B, C).

---

## Parte A — Tarjeta "Cuentas" en Dashboard escritorio (reemplaza el grid 2×2)

En escritorio, las 4 tarjetas grandes se ven mal estiradas. Se reemplazan por **resumen + lista con miniaturas de tarjeta**. En móvil **no cambia nada**: se queda el carrusel de `AccountCard` de 168×106.

### A.1 Estructura (dentro de la misma `section` `grid-column: span 5`, padding `0 20px 14px`, flex column)

1. **Header** (padding `22px 4px 14px`, `justify-content: space-between`):
   - Izquierda: "Cuentas" (20px/700, -0.02em).
   - Derecha (flex, gap 6px):
     - **Botón ojo** (ver A.3).
     - Link "Administrar" (14px, `--eb-link`) que lleva a la página Cuentas.
2. **Resumen** (flex column, gap 12px, padding `0 4px 6px`):
   - Fila con `justify-content: space-between; align-items: baseline`:
     - Izquierda, en columna con gap 2px: "Disponible" (13px, `--eb-text-tertiary`) y el total (`--eb-font-rounded`, 28px/700, -0.02em, line-height 1.1, **sin centavos**, ej. `$78,950`).
     - Derecha: "N cuentas" (13px, tertiary).
   - **Barra de distribución:**
     - Contenedor: alto 8px, radio 4px, `padding:2px`, `gap:2px`, fondo `--eb-track`, sombra `--eb-track-shadow`, `overflow:hidden`.
     - Un segmento por cuenta, ancho = saldo / total, radio 2px, `linear-gradient(90deg, <color base>, <color claro>)`.
     - Segmentos menores a 1% llevan `min-width:2px`.
     - Mismo orden que la lista.
3. **Lista** (flex column, `flex:1` para que la tarjeta termine a la misma altura que "Recientes"):
   - Una fila por cuenta de débito/efectivo, **ordenadas por saldo de mayor a menor**.
   - Cada fila lleva `flex:1; min-height:56px`, `display:flex; align-items:center; gap:14px; padding:0 4px`.
   - **Miniatura de tarjeta:** 46×30, radio 6px, `position:relative`.
     - Mismo fondo que `AccountCard`: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(145deg, <claro> 0%, <oscuro> 100%)`.
     - Sombra: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.1), 0 6px 12px -6px <oscuro .9>`.
     - Chip: `span` absoluto en `left:6px; top:9px`, 9×7, radio 2, dorado (`#F3E1A6 → #C9A55A`) o plateado (`#E9EAEE → #A8ABB5`).
     - Efectivo: sin chip, con un ícono de billete de 16px en blanco 90% centrado.
     - Haz un componente `AccountThumb` que comparta la lógica de colores con `AccountCard`.
   - **Texto** (contenedor `flex:1; align-self:stretch; display:flex; align-items:center; gap:12px`, con separador inferior `1px --eb-separator` excepto en la última fila):
     - Nombre (15px/500).
     - Debajo, "Tipo · %" (13px, tertiary): `Débito · 60%`, `En mano · <1%`. Porcentaje redondeado al entero; si es menor a 1, muestra `<1%`.
   - **Saldo** a la derecha: 15px/600, **con centavos** (`$47,399.00`).
4. **Pie** (sin cambios): link "N tarjetas de crédito ›" con separador superior.

Pares de color de la maqueta (base → oscuro):

- Openbank: `#13969C → #0A5559`
- Revolut: `#3E44C9 → #1E2170`
- Nu: `#8E55F0 → #5B22C4`
- Efectivo: `#2E7A45 → #173F24`

Genéralos desde el color que ya tiene cada método de pago.

### A.2 Datos

- **Total "Disponible":** suma de saldos de positivos `kind: 'account'` (débito + efectivo).
- **"N cuentas":** número de esas cuentas.
- **Porcentajes:** saldo / total.
- Ya no hay límite de 4. Si son más de 6, muestra las 6 con más saldo y agrega una fila "Ver N más".

### A.3 Botón "ocultar saldos" (privacidad)

Botón circular junto a "Administrar" para que nadie vea los números de las cuentas si estás compartiendo pantalla o alguien está viendo.

- **Visual:**
  - 32×32, radio 16, `border:0`, ícono de 17px (lucide `Eye` / `EyeOff`).
  - **Estado visible:** fondo `rgba(255,255,255,0.08)`, ícono `#C7C7CC`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.08)`, ícono `Eye`.
  - **Estado oculto:** fondo `rgba(94,107,255,0.2)`, ícono `#B3B9FF`, `box-shadow: inset 0 0 0 1px rgba(94,107,255,0.35)`, ícono `EyeOff`.
  - Accesibilidad: `aria-pressed`, y `aria-label`/`title` "Ocultar saldos" o "Mostrar saldos" según el estado.
- **Qué se oculta:** el total "Disponible" y el saldo de cada fila se reemplazan por `$••••`, siempre 4 puntos para no revelar cuántos dígitos tiene la cifra.
  - Los porcentajes, la barra de distribución y los nombres se quedan, porque no revelan montos.
  - En móvil aplica igual a los saldos del carrusel de `AccountCard`. Pon el mismo botón junto al link "Todas" del header de Cuentas.
- **Comportamiento:**
  - Crea un hook o contexto `usePrivacy()` con `{ hidden, toggle }`. El componente `Money` acepta una prop `private` y, si `hidden` es `true`, renderiza `$••••`.
  - Así, más adelante se puede extender a otras cifras con solo pasar `private`.
  - Persiste la preferencia en `localStorage` (`eb:hide-balances`, con try/catch). Si existe una tabla de preferencias de usuario, guárdala ahí para que se sincronice entre dispositivos.
  - Transición suave: `opacity` y `filter: blur(4px)` de 150ms al cambiar. Respeta `prefers-reduced-motion`.
  - Atajo opcional: `Shift + H` alterna el estado. Solo regístralo si no estás dentro de un input.

---

## Parte B — Página **Gastos** en escritorio (`Gastos.dc.html`)

Layout igual que el Dashboard: sidebar intacto + `<main>` con `padding: 40px 48px 64px`, contenido `max-width:1120px` centrado, columna con `gap:28px`. Fondo `.eb-page` (glow índigo `radial-gradient(70% 30% at 62% -4%, rgba(94,107,255,0.13), transparent 70%)`) + `<Grain/>`.

### B.1 Header

- Izquierda: fecha de hoy en uppercase 13px tertiary ("MARTES 6 DE OCTUBRE") y `h1` "Gastos" (34px/700).
- **Se quita** el subtítulo "Metricas, graficas e historial de transacciones".
- Derecha: `MonthSwitcher` de vidrio + botón "Nuevo gasto" (`.eb-btn-primary`, alto 40, radio 20).

### B.2 Grid bento (12 columnas, gap 20px, `align-items: stretch`; debajo de 1000px todo a `1 / -1`)

**Fila 1, tres KPIs (`span 4` cada uno, padding 24px, radio 26px, flex column `space-between`, gap 18px):**

1. **Gastado en {mes}**
   - Card con variante `hero` (tinte índigo arriba-izquierda).
   - Número rounded de 44px con centavos en 22px tertiary: `$6,496` + `.60`.
   - Abajo, barra de presupuesto:
     - Riel de 8px, radio 4, `padding:2px`, fondo `--eb-track`.
     - Relleno con ancho = gastado / presupuesto, `linear-gradient(90deg, accentLight, accent)` y `box-shadow: 0 0 10px accentGlow`.
     - Debajo, una fila 13px tertiary con `space-between`: "72% de $9,000" | "Quedan $2,503".
     - Si se pasó: el relleno va al 100% con degradado naranja→rojo y el texto derecho dice "Te pasaste por $X" en naranja.
2. **Transacciones**
   - Número rounded de 44px (`16`).
   - Abajo, separador superior y un grid de 2 columnas:
     - "Promedio" (12px tertiary) / `$406.04` (16px/600).
     - "Por día" / `$1,082.77`.
   - Por día = gastado / días transcurridos del mes. Para meses pasados se divide entre los días del mes.
   - **Se elimina** la tarjeta separada "Promedio por transacción".
3. **Mayor gasto** (nuevo)
   - Número rounded de 44px con centavos: `$2,950` + `.00`.
   - Abajo, separador superior y una fila con:
     - `CategoryTile` de 32×32, radio 9.
     - Nombre del gasto (14px/500).
     - Debajo, "1 oct · 45% del mes" (12px tertiary), donde el % es el monto / gastado del mes.
   - Clic en la tarjeta: abre ese gasto en el modal de edición.

**Fila 2, gráficas:**

4. **Gasto por día**: `span 7`, padding `24px 24px 20px`, flex column, gap 18px.
   - **Header:**
     - Izquierda: "Gasto por día" (20px/700) y "Toca un día para ver sus gastos" (13px tertiary).
     - Derecha: pastilla hundida (`--eb-well`, radio 12, padding `8px 12px`) con el día seleccionado ("JUE 1 OCT", 11px uppercase tertiary) y su total (rounded 18px/700).
     - Por defecto está seleccionado el día con mayor gasto.
   - **Gráfica** (alto 210px, `position:relative`):
     - **Muestra los 31 días del mes, no solo los que tienen gasto.** Va en un grid `repeat(díasDelMes, minmax(0,1fr))`, gap 4px, `align-items:end`, con margen derecho de 44px para el eje.
     - Gridlines: 3 líneas `1px dashed rgba(255,255,255,0.08)` y la base en `1px solid rgba(255,255,255,0.12)`.
     - Eje Y a la derecha: 4 etiquetas (11px tertiary) en `$6k, $4k, $2k, $0`. El máximo es el gasto diario máximo redondeado hacia arriba a un número "bonito" (1, 2 o 5 × 10ⁿ).
     - **Barras apiladas por método de pago**, de abajo hacia arriba en orden de gasto del mes, con 1px entre segmentos.
       - Cada segmento lleva degradado vertical de su color (acento: `accentLight → accent`; verde `#5FE07F → #28B44C`; morado `#D4B0FF → #A673F0`).
       - El de arriba lleva radio `3px 3px 2px 2px` y los demás 2px. Altura mínima de 3px.
     - **Día seleccionado:** la columna lleva fondo `rgba(255,255,255,0.05)`, `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08)`, radio 4, y el segmento de acento con `box-shadow: 0 0 14px accentGlow`.
     - **Días sin gasto:** rayita de 3px. Los días ya pasados en `rgba(255,255,255,0.18)` y los futuros en `rgba(255,255,255,0.06)`.
     - Eje X debajo (mismo grid, `margin-top:-8px`, 11px tertiary): etiquetas en 1, 15, 22 y el último día, más "Hoy" en color link bajo el día actual. El día seleccionado va en blanco/600.
     - Hover en una columna: tooltip con fecha, total y desglose por cuenta.
     - Clic: selecciona el día, actualiza la pastilla y **filtra el Historial a ese día** (con un chip "1 oct ✕" para quitar el filtro). Esto reemplaza el comportamiento actual de "toca una barra".
   - **Leyenda** abajo: punto de 8px + nombre (13px secondary) por cuenta, gap 18px.
5. **Ritmo del mes** (antes "Progreso vs presupuesto mensual"): `span 5`, padding `24px 24px 20px`, flex column, gap 16px.
   - Header: "Ritmo del mes" (20px/700) y "Acumulado contra tu presupuesto" (13px tertiary).
   - **Aviso:**
     - Fila con radio 14, padding `10px 12px`, ícono de tendencia de 18px y texto de 13px.
     - Si gastado > ritmo ideal: fondo `rgba(255,159,10,0.1)`, `box-shadow: inset 0 0 0 1px rgba(255,159,10,0.18)`, ícono naranja. Texto: "**$4,755 arriba del ritmo.** Te quedan ≈ $100 al día los 25 días que faltan." La parte en negrita va en naranja `#FF9F0A`.
     - Si vas por debajo: mismo diseño en verde (`rgba(48,209,88,…)`, `#30D158`), con "**$X debajo del ritmo.** Puedes gastar ≈ $Y al día."
     - `ritmoIdeal = presupuesto × díaActual / díasDelMes`; `diferencia = gastado − ritmoIdeal`; `porDía = (presupuesto − gastado) / díasRestantes`.
   - **Gráfica** (`flex:1; min-height:170px`): un SVG con `viewBox` que va del día 1 al último y de $0 al máximo (presupuesto × 1.1, redondeado), con `preserveAspectRatio="none"` y `vector-effect: non-scaling-stroke` en las líneas.
     - Línea de presupuesto horizontal: `rgba(255,105,97,0.55)`, 1.5px, `dasharray 5 5`, con la etiqueta "Presupuesto $9,000" (11px, `#FF8E88`) arriba a la derecha.
     - **Ritmo ideal:** diagonal de $0 al presupuesto, `rgba(255,255,255,0.22)`, `dasharray 2 4`, con la etiqueta "Ritmo ideal · hoy $1,742" (11px tertiary).
     - **Acumulado real** hasta hoy: línea de 2.5px con degradado horizontal `accent → accentLight`, puntas redondas, y un área debajo con `linearGradient` vertical de `accent` al 35% a 0%.
     - **Punto de hoy:** círculo HTML (no SVG, para que no se deforme) de 12px, blanco, con `box-shadow: 0 0 0 3px accent, 0 0 14px accentGlow`. Al lado, "$6,496.60 hoy" (12px/600; "hoy" en tertiary).
     - Eje X abajo: "1 oct · 15 · 31 oct" (11px tertiary).
     - Para meses pasados se dibuja el mes completo, sin punto de hoy, y el aviso dice "Terminaste $X arriba/debajo del presupuesto".

**Fila 3, Historial** (`span 12`, sin padding propio, `overflow:hidden`):

- **Se elimina la tarjeta "Por método de pago (este mes)".** Su información pasa a ser el filtro de cuentas del Historial.
- **Header** (padding `24px 24px 0`, flex column, gap 16px):
  - Fila con `space-between` y wrap:
    - "Historial" (20px/700).
    - A la derecha, controles de alto 36px, radio 10, fondo `rgba(118,118,128,0.18)` (estilo iOS):
      - Buscador de 280px con lupa e input "Buscar" (14px).
      - Botón "Categoría ⌄".
      - Botón "Fecha ⌄".
      - Botón cuadrado de ordenar (ícono flechas arriba/abajo, `aria-label` "Ordenar: más reciente").
    - Conecta todo con la lógica actual de filtros.
  - **Filtro por cuenta** (`role="tablist"`, scroll horizontal, gap 8px): tarjetitas de `min-width:150px`, padding `12px 14px`, radio 16, flex column, gap 8px.
    - **"Todas · 16"** (activa por defecto):
      - Fondo `linear-gradient(180deg,#3A3A40,#2C2C31)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.08)`.
      - Total en 17px/700.
      - Mini barra segmentada de 4px con todas las cuentas.
    - **Una por cada cuenta con gasto en el mes:**
      - Fondo `rgba(255,255,255,0.03)`, `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06)`.
      - Punto de color + "Revolut Crédito · 13" (13px secondary).
      - Total en 17px/600.
      - Barra de 4px sobre un riel `rgba(255,255,255,0.06)`, con su % del mes.
    - La activa toma el estilo de "Todas". Clic filtra la lista. Este control **reemplaza** al dropdown "Todos los métodos".
- **Lista** (padding `8px 0 12px`):
  - **Encabezado por día** (padding `18px 24px 6px`, flex `space-between`):
    - Izquierda: "JUEVES 1 DE OCTUBRE" (12px/600 uppercase, 0.04em, tertiary), con el día de la semana.
    - Derecha, sin uppercase: "10 gastos · **$5,635.60**". El total va en `#C7C7CC`/600.
  - **Fila de gasto** (`ListRow`), con `min-height:60px`, padding `0 24px` y gap 14px:
    - `CategoryTile` de 36px.
    - Nombre limpio (15px/500), con subtítulo "Cuenta · Agregador" (13px tertiary), por ejemplo "Revolut Crédito · Mercado Pago".
    - Monto `−$947.60` (15px/600, `min-width:96px`, alineado a la derecha).
    - Separador inset entre filas del mismo día.
  - **Hover:** fondo `rgba(255,255,255,0.035)`, y aparecen los botones editar (`rgba(255,255,255,.08)`) y borrar (`rgba(255,105,97,.14)`, ícono `#FF6961`) de 30×30, radio 9, gap 6, antes del monto.
    - **Sin hover no se muestran**, así que se quitan el lápiz y la basura que hoy siempre están visibles.
  - **Sin categoría:** tile gris (`#6E6E75 → #48484E`) con la inicial en blanco (15px/600). No inventes categorías.
- **Estados vacíos:**
  - Sin gastos en el mes: un ícono, "Aún no hay gastos en octubre" y el botón "Nuevo gasto".
  - Búsqueda sin resultados: "Sin resultados para '…'".

### B.3 Limpieza de nombres

Usa el helper existente. Además de `Mercadopago *`, agrega `Clip Mx*` → agregador "Clip". Capitaliza la primera letra ("starbucks" → "Starbucks", "heat" → "Heat"). El nombre original se conserva en la base y se muestra completo en el modal de edición.

---

## Parte C — Página **Gastos** en móvil (`Phone-Gastos.dc.html`, < 768px)

Contenedor con padding `64px 16px 140px`, columna con gap 22px, fondo con glow índigo + grano, y `TabBar` abajo con **"Gastos" activo**.

1. **Header:** "OCTUBRE 2026" (13px uppercase tertiary), `h1` "Gastos ⌄" (34px; el chevron abre el selector de mes) y a la derecha un botón circular de 36px de vidrio (`rgba(255,255,255,.08)`, ícono de filtros en color link) que abre un sheet con Categoría, Fecha y Orden.
2. **Gastado en octubre:** card hero de radio 24 y padding 20, con número rounded de 44px y la barra de presupuesto con "72% de $9,000 | Quedan $2,503". Es igual que el KPI de escritorio, pero a todo lo ancho.
3. **Dos widgets** (grid de 2 columnas, gap 14, radio 24, padding 16, gap interno 14):
   - **Transacciones:** título 13px/600 secondary, "16" en rounded 34px, y debajo "Promedio **$406**" / "Por día **$1,083**" (12px).
   - **Mayor gasto:** título y un tile de categoría de 28px arriba a la derecha, "$2,950" en rounded 34px, y debajo el nombre en blanco y "45% del mes" (12px).
4. **Por día:** card de radio 24, padding `20px 16px 16px`.
   - Header: "Por día" (20px/700) a la izquierda, y a la derecha el día seleccionado ("JUE 1 OCT" + "$5,635.60" en rounded 17px).
   - Gráfica de 150px con las mismas reglas que en escritorio: gap 3px entre barras, eje Y a la derecha de 26px con "6k/4k/2k/0" (10px) y eje X de 10px.
   - Tocar una barra selecciona el día y filtra el historial.
   - Leyenda corta: "Revolut / Efectivo / Nu" (12px).
5. **Ritmo del mes:** card de radio 24. Título, el mismo aviso naranja/verde (texto corto: "**$4,755 arriba del ritmo.** ≈ $100 al día los 25 días que faltan.") y la gráfica a 130px de alto con punto de 10px. Las etiquetas van a 10px.
6. **Historial:**
   - Header: "Historial" (20px/700) a la izquierda y "16 · $6,496.60" (13px tertiary) a la derecha.
   - Buscador iOS: alto 40, radio 12, fondo `rgba(118,118,128,0.18)`, input de 16px para que iOS no haga zoom.
   - **Chips de cuenta** con scroll horizontal (`margin: 0 -16px; padding: 0 16px`): alto 34, radio 17, 13px.
     - Activo: `linear-gradient(180deg,#48484C,#36363A)` + `inset 0 1px 0 rgba(255,255,255,.12)`, texto 600.
     - Inactivos: `rgba(255,255,255,.06)` + borde interior, con punto de color y "Revolut · $5,311" (montos sin centavos).
   - **Un grupo por día, estilo lista agrupada de iOS:**
     - Encabezado fuera de la tarjeta (padding `0 16px`, 13px tertiary): "JUEVES 1 OCT" a la izquierda y "$5,635.60" a la derecha.
     - Debajo, una tarjeta de radio 18 con las filas de ese día: alto 60, padding `0 16px`, tile de 36px, nombre de 16px con `text-overflow: ellipsis`, subtítulo corto "Revolut · Mercado Pago" (en móvil se quita "Crédito"), y monto de 16px/600.
     - Separación de 14px entre grupos.
   - **Swipe a la izquierda** en cada fila: Editar (`#636366`) y Borrar (`#E5484D`), 74px cada uno. Es el mismo componente del Dashboard móvil.

---

## Plan

1. **Parte A:** `usePrivacy`, prop `private` en `Money`, `AccountThumb`, la nueva tarjeta Cuentas y el botón en el carrusel móvil. Commit.
2. **Parte B:** helpers nuevos en `lib/expenses-metrics.ts` (mayor gasto, por día, serie diaria por cuenta, ritmo ideal y diferencia, totales por cuenta, agrupación por día con totales), con tests si el proyecto tiene. Luego la página de escritorio. Commit.
3. **Parte C:** versión móvil. Commit.

En cada parte, compara lado a lado a 1440 px y a 390 px contra los archivos de `design-reference/` y corrige cualquier diferencia de radio, sombra, tamaño o espaciado. Al final, dame un resumen de los archivos tocados y de cualquier dato que no existiera.
