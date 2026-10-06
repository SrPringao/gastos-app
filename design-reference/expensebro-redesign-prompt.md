# ExpenseBro — Rediseño "Apple dark" (prompt para Claude Code)

Eres el agente que va a implementar el rediseño de **ExpenseBro** (expensebro.com, Next.js). El objetivo es que la app se sienta como una app nativa de Apple en modo oscuro: superficies con luz y profundidad (no grises planos "de plástico"), tipografía del sistema, números protagonistas, listas agrupadas estilo iOS y un layout de escritorio simétrico.

Junto con este prompt vienen 3 archivos de referencia en `design-reference/` (cópialos al repo en esa carpeta). Son el diseño aprobado, en HTML con estilos inline. **Son la fuente de verdad visual: copia los valores exactos (colores, radios, sombras, tamaños, espaciados) desde ahí.** Los `{{accent}}`, `{{accentLight}}` y `{{accentGlow}}` dentro de esos archivos son variables; sus valores están en la sección 2.

- `design-reference/Main.dc.html` → Dashboard de escritorio
- `design-reference/Phone-Inicio.dc.html` → Dashboard en móvil (390 px)
- `design-reference/Phone-Patrimonio.dc.html` → Patrimonio en móvil (390 px)

---

## 0. Reglas antes de empezar

1. **Primero explora el repo** y entiende: framework de estilos (Tailwind, CSS Modules, etc.), librería de íconos, componentes existentes (cards, listas, modales), cómo se calculan hoy los datos del dashboard y de patrimonio, y cómo funciona el toggle de tema claro/oscuro. Adapta todo lo de abajo a ese stack; no metas una librería nueva de UI.
2. **NO toques el sidebar de escritorio.** Su estructura, logo, secciones (Principal / Cuentas / Gestion / Sistema), estado activo (pill azul oscuro + círculo azul + rayita azul a la izquierda), botones de tema/sync y "Cerrar sesion" se quedan exactamente como están hoy. Solo cambia lo que está a la derecha del sidebar.
3. No rompas funcionalidad: agregar/editar/borrar gasto, selector de mes, editar presupuesto, patrimonio, simulador, sincronizar y tema deben seguir funcionando.
4. Trabaja por fases (sección 7) y haz commit al terminar cada fase.
5. Crea **tokens y componentes reutilizables** (sección 2 y 3), no estilos copiados a mano en cada pantalla.
6. Si un dato que pide el diseño no existe en el modelo, sigue lo que dice la sección 5 (cambios de datos) y no lo inventes.

---

## 1. Qué cambia (resumen)

**Diseño**
- Fondo casi negro con un brillo ambiental índigo muy tenue arriba y un grano/ruido casi invisible.
- Tarjetas con "material": degradado vertical sutil, línea de luz de 1 px arriba, borde interior de 1 px y sombra profunda suave. Radio 26 px en escritorio, 24/22/18 px en móvil.
- Tipografía del sistema (`-apple-system`, SF Pro). Números grandes en **SF Pro Rounded** (`ui-rounded`) con los centavos más chicos y en gris.
- Títulos grandes de una palabra ("Octubre", "Patrimonio") en vez de etiquetas en MAYÚSCULAS.
- Gráficas con degradado y un leve brillo (glow); barras dentro de un "riel" hundido.
- Íconos de gastos en cuadritos de color sólido con degradado y glifo blanco (estilo Ajustes de iOS).
- Tarjetas de cuenta que parecen tarjetas físicas (degradado diagonal, reflejo, chip).
- Controles de vidrio esmerilado (`backdrop-filter`).
- Escritorio en grid de 12 columnas, dos filas simétricas, todas las tarjetas de una fila con la misma altura.

**Contenido / KPIs**
- **Se va:** la tarjeta "Últimos gastos: 5 transacciones recientes" (no aporta), la sección "Métodos de pago" del dashboard (lista de botones con lápiz) y los botones duplicados "Agregar gasto" (hoy hay 3).
- **Se queda, rediseñado:** Gastado este mes (ahora con barra segmentada por cuenta), Presupuesto (ahora anillo), Gastos recientes (lista agrupada por día con íconos por categoría).
- **Nuevo:**
  - "≈ $X al día · N días" dentro de Presupuesto (cuánto puedes gastar por día lo que resta del mes).
  - Tarjeta **Próximos pagos** (fechas de corte/pago de las deudas de Patrimonio).
  - Tarjeta **Cuentas** con saldos reales de débito/efectivo (vienen de Patrimonio).
- **Patrimonio móvil:** positivos agrupados en Cuentas / Te deben / Por recibir; deudas con vencimiento visible; tarjetas en $0 colapsadas; simulador convertido en "Con previstos".

---

## 2. Design tokens

Crea estos tokens como variables CSS (y, si usan Tailwind, mapéalos en `tailwind.config` con los mismos nombres). Aplican al **tema oscuro**. Para tema claro ver 2.7.

### 2.1 Colores

```css
:root[data-theme="dark"], .dark {
  /* Fondo */
  --eb-bg: #050506;
  --eb-bg-glow: radial-gradient(70% 45% at 62% -8%, rgba(94,107,255,0.13), rgba(94,107,255,0) 70%),
                radial-gradient(50% 40% at 100% 100%, rgba(48,209,88,0.05), rgba(48,209,88,0) 70%);

  /* Superficies (tarjetas) */
  --eb-surface-top: #202024;
  --eb-surface-bottom: #17171A;
  --eb-surface: linear-gradient(180deg, var(--eb-surface-top) 0%, var(--eb-surface-bottom) 100%);
  --eb-surface-shadow: inset 0 1px 0 rgba(255,255,255,0.08),
                       inset 0 0 0 1px rgba(255,255,255,0.05),
                       0 30px 60px -30px rgba(0,0,0,0.9);       /* escritorio */
  --eb-surface-shadow-sm: inset 0 1px 0 rgba(255,255,255,0.08),
                          inset 0 0 0 1px rgba(255,255,255,0.05),
                          0 24px 48px -24px rgba(0,0,0,0.9);    /* móvil */
  --eb-separator: rgba(255,255,255,0.06);
  --eb-fill-subtle: rgba(255,255,255,0.035);   /* hover de fila */
  --eb-well: rgba(0,0,0,0.30);                  /* pastillas hundidas */
  --eb-track: rgba(0,0,0,0.45);                 /* riel de barras */
  --eb-track-shadow: inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05);
  --eb-ring-track: rgba(255,255,255,0.07);

  /* Texto */
  --eb-text: #F5F5F7;
  --eb-text-strong: #FFFFFF;
  --eb-text-secondary: #A1A1A6;   /* etiquetas de tarjeta */
  --eb-text-tertiary: #8E8E93;    /* subtítulos, fechas, centavos */
  --eb-text-muted: #C7C7CC;
  --eb-chevron: #636366;

  /* Acento (marca) */
  --eb-accent: #5E6BFF;
  --eb-accent-light: #929AFF;               /* = accent mezclado 32% con blanco */
  --eb-accent-glow: rgba(94,107,255,0.45);
  --eb-link: #8C95FF;
  --eb-link-hover: #B3B9FF;

  /* Semánticos */
  --eb-green: #30D158;
  --eb-green-grad: linear-gradient(180deg, #5FE07F, #24A846);
  --eb-red: #FF6961;
  --eb-red-grad: linear-gradient(180deg, #FF8E88, #E5484D);
  --eb-orange: #FF9F0A;
  --eb-purple: #BF8CFF;
}
```

### 2.2 Tipografía

```css
--eb-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif;
--eb-font-rounded: ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif;
```

- `body`: `font-family: var(--eb-font); -webkit-font-smoothing: antialiased;`
- Todo contenedor con cifras: `font-variant-numeric: tabular-nums;`
- Escala:

| Uso | Tamaño | Peso | Letter-spacing | Familia |
|---|---|---|---|---|
| Título de página ("Octubre") | 34px / lh 1.1 | 700 | -0.025em | sistema |
| Fecha sobre el título ("VIERNES 2 DE OCTUBRE") | 13px, uppercase | 600 | 0.04em | sistema, color tertiary |
| Título de tarjeta ("Recientes", "Cuentas") | 20px | 700 | -0.02em | sistema |
| Etiqueta de tarjeta ("Gastado en octubre") | 15px | 500 | — | sistema, color secondary |
| Número héroe escritorio | 58px / lh 1 (centavos 28px 600 tertiary) | 700 | -0.03em | **rounded** |
| Número héroe móvil | 44px (centavos 22px) | 700 | -0.03em | **rounded** |
| Número Patrimonio móvil | 48px (centavos 24px) | 700 | -0.03em | **rounded** |
| Número secundario (Presupuesto, widgets) | 22px | 700 | -0.02em | **rounded** |
| % dentro del anillo | 21px escritorio / 13px móvil | 700 | -0.02em | **rounded** |
| Fila de lista: título | 15px escritorio (500) / 16px móvil (400) | | | sistema |
| Fila de lista: subtítulo | 13px | 400 | | tertiary |
| Monto en fila | 15/16px | 600 | | sistema |
| Encabezado de grupo ("JUEVES 1 DE OCTUBRE", "CUENTAS") | 12–13px uppercase | 600 | 0.02–0.04em | tertiary |

### 2.3 Formato de dinero

Usa `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`. Crea un componente `<Money value={n} size="hero|md|sm" sign?="negative" splitCents?>`:
- **Héroes:** parte entera en grande y `.60` en un `<span>` al 50 % del tamaño, peso 600, color tertiary, alineado en `baseline`.
- **Gastos en listas:** con signo de menos tipográfico: `−$170.00` (U+2212, no guion).
- **Widgets compactos** (Próximos pagos, tarjetas de cuenta, "Te quedan"): sin centavos (`$6,103`).

### 2.4 Radios y espaciado

- Tarjetas escritorio: radio **26px**, padding 26–28px (héroe) / 22px (tarjetas angostas); gap del grid **20px**.
- Tarjetas móvil: héroe y widgets **24px**, listas **22px** (Inicio) y **18px** (Patrimonio); padding 20px / 16px.
- Tile de ícono en lista: 36×36, radio 10px (escritorio y móvil Inicio); 30×30, radio 8px (Patrimonio).
- Tarjeta de cuenta: radio 16px, padding 14px.
- Filas de lista: alto mínimo 60px (gastos), 52px (patrimonio), 60px (deudas). Padding horizontal 24px escritorio / 16px móvil.
- Separadores: 1px `--eb-separator` que **empieza después del ícono** (el borde va en el contenedor de texto, no en toda la fila) y la última fila no lleva.
- Áreas táctiles: mínimo 44×44 px.

### 2.5 Materiales (clases utilitarias)

```css
.eb-card {               /* tarjeta base */
  background: var(--eb-surface);
  box-shadow: var(--eb-surface-shadow);
  border-radius: 26px;
}
.eb-card--hero {         /* tarjeta "Gastado" en escritorio: tinte índigo arriba-izq */
  background: radial-gradient(90% 120% at 0% 0%, rgba(94,107,255,0.14), rgba(94,107,255,0) 60%),
              var(--eb-surface);
}
.eb-glass {              /* selector de mes, segmented control */
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06);
  border-radius: 12px; padding: 3px;
}
.eb-btn-primary {        /* "Nuevo gasto" y el + del tab bar */
  background: linear-gradient(180deg, var(--eb-accent-light) 0%, var(--eb-accent) 100%);
  color: #fff; font-weight: 600; border: 0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 24px -8px var(--eb-accent-glow);
}
.eb-well {               /* pastilla hundida "≈ $116 al día" */
  background: var(--eb-well);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
  border-radius: 14px; padding: 10px 12px;
}
```

**Fondo de página (área de contenido):**
```css
.eb-page {
  position: relative;
  background: var(--eb-bg-glow), var(--eb-bg);
}
```

**Grano:** un `<svg aria-hidden>` en `position:absolute; inset:0; width:100%; height:100%; opacity:.07; mix-blend-mode:overlay; pointer-events:none`, con `<filter><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>` aplicado a un `<rect width="100%" height="100%">`. Va detrás del contenido (el contenido lleva `position:relative; z-index:1`). Hazlo un componente `<Grain />` y usa un `id` único (`useId()`).

### 2.6 Íconos de categoría (tiles)

Tile cuadrado con degradado vertical, brillo interior y glifo blanco de trazo (stroke 2, 18px):
```css
.eb-tile { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff;
           box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px -4px var(--tile-shadow); }
```

| Color | Degradado (180deg) | Sombra | Glifo |
|---|---|---|---|
| orange | `#FFB340 → #FF8A00` | `rgba(255,138,0,.6)` | blanco |
| blue | `#5AC8FA → #1E8FE0` | `rgba(30,143,224,.6)` | blanco |
| yellow | `#FFE066 → #F5B800` | `rgba(245,184,0,.5)` | **#3A2A00** (oscuro, por contraste) |
| indigo | `#8C95FF → #4F5BF0` | `rgba(79,91,240,.6)` | blanco |
| green | `#5FE07F → #24A846` | `rgba(36,168,70,.6)` | blanco |
| purple | `#9A66F5 → #5B22C4` | `rgba(91,34,196,.6)` | blanco |
| gray | `#6E6E75 → #48484E` | — | blanco |

**El color y el ícono salen de la categoría del gasto** (ver 5.3). En la maqueta: OXXO = tienda/bolsa naranja, Costco Gas = gasolina azul, Elotes = comida amarillo, Verificación = auto índigo, Heat/efectivo = billete verde. Usa la librería de íconos que ya tenga el proyecto (si es lucide: `ShoppingBag`, `Fuel`, `Utensils`, `Car`, `Banknote`, `Calendar`, `Clock`, `Smartphone`, `ArrowDown`, `Plus`, `Pencil`, `Trash2`, `ChevronLeft/Right/Down`).

### 2.7 Tema claro

El tema claro debe seguir funcionando con el mismo sistema: fondo `#F2F2F7`, superficie `linear-gradient(180deg,#FFFFFF,#FAFAFC)`, sombra `inset 0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 20px 40px -24px rgba(0,0,0,0.18)`, texto `#1C1C1E`, secundario `#6E6E73`, separador `rgba(0,0,0,0.08)`, rieles `rgba(0,0,0,0.06)`, sin grano (o `opacity:.03`). El diseño aprobado es el oscuro; el claro solo tiene que verse coherente.

---

## 3. Componentes nuevos o rediseñados

Crea estos en una carpeta tipo `components/ui/eb/` (o donde tengas tus componentes):

1. `Card` (variantes `default`, `hero`; prop `size` desktop/mobile para radio y sombra).
2. `Money` (2.3).
3. `SegmentedBar`: barra horizontal segmentada.
   - Contenedor: alto 12px (14px en Patrimonio), radio 6px, `padding:2px`, `gap:3px`, fondo `--eb-track`, sombra `--eb-track-shadow`, `overflow:hidden`.
   - Segmentos: ancho = % del total, radio 4px, fondo degradado 180deg de su color claro a su color base. El segmento de acento lleva además `box-shadow:0 0 12px var(--eb-accent-glow)`.
   - Colores por defecto de segmentos: acento (`--eb-accent-light → --eb-accent`), verde (`#5FE07F → #28B44C`), morado (`#D4B0FF → #A673F0`). Si hay más de 3 cuentas con gasto, agrupa el resto como "Otras" en gris (`#8E8E93 → #636366`).
4. `Legend` (punto de 8px + nombre en 13px secondary + monto 17px/600 + % 13px tertiary), en grid de 3 columnas iguales.
5. `ProgressRing`: SVG rotado -90°.
   - Escritorio: 92×92, r=38, trazo 11. Móvil: 62×62, r=25, trazo 8.
   - Pista: `--eb-ring-track`. Progreso: `<linearGradient x1=0 y1=0 x2=1 y2=1>` de `--eb-accent-light` a `--eb-accent`, `stroke-linecap:round`, `stroke-dasharray = (circunferencia × pct) circunferencia`, `filter: drop-shadow(0 0 6px var(--eb-accent-glow))`.
   - Texto centrado encima (absolute inset 0) en fuente rounded.
   - Si pct > 100 %: el anillo usa naranja→rojo (`#FF9F0A → #FF453A`) y se dibuja lleno.
6. `GroupedList` + `ListRow` (ícono tile, título, subtítulo, valor a la derecha, separador inset, slot de acciones).
7. `CategoryTile` (2.6).
8. `AccountCard`: tarjeta física.
   - Fondo: `radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.2), transparent 55%), linear-gradient(145deg, <claro> 0%, <oscuro> 100%)`.
   - Sombra: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.1), 0 14px 28px -14px <oscuro con alpha .9>`.
   - Contenido arriba: nombre (14px 700 blanco) y, a la derecha, un chip de 26×19 radio 4 con degradado dorado `#F3E1A6 → #C9A55A` o plateado `#E9EAEE → #A8ABB5`. Para Efectivo, un ícono de billete en lugar del chip.
   - Contenido abajo: tipo (11px, blanco 78 %) y saldo (19px 700 rounded, sin centavos).
   - Pares de color de la maqueta: Nu `#8E55F0 → #5B22C4`, Revolut `#3E44C9 → #1E2170`, Openbank `#13969C → #0A5559`, Efectivo `#2E7A45 → #173F24`. Toma el color base del color que ya tiene cada método de pago en la app y genera el claro/oscuro a partir de él.
9. `Grain` (2.5).
10. `MonthSwitcher` de vidrio: `[‹] Oct 2026 [›]`, botones 36×34 radio 9, texto 14px/500. Reemplaza al dropdown "Octubre 2026" (puede abrir el dropdown al hacer clic en el texto si quieres conservarlo).
11. **Solo móvil:**
    - `TabBar`: fijo abajo, alto 84px (incluye safe-area), fondo `rgba(22,22,24,0.82)` + `backdrop-filter: blur(20px)`, borde superior `1px rgba(255,255,255,0.08)`.
    - Grid de 5 columnas: Inicio, Gastos, **botón + central**, Cuentas, Patrimonio. Ícono 24px + label 10px/500; activo en acento y el resto `#8E8E93`.
    - Botón central: círculo de 52px con `.eb-btn-primary`, `margin-top:-14px`, sombra `inset 0 1px 0 rgba(255,255,255,.35), 0 10px 24px -6px var(--eb-accent-glow)`.
    - Swipe en filas de gasto: deslizar a la izquierda revela 2 botones de 74px de ancho, **Editar** (`#636366`) y **Borrar** (`#E5484D`), con ícono 18px + texto 13px. La fila de encima lleva `box-shadow: 8px 0 16px -6px rgba(0,0,0,.6)`. Implementa con pointer events o con la librería de gestos que ya exista (sin dependencias pesadas).

---

## 4. Pantallas

### 4.1 Dashboard — escritorio (`Main.dc.html`)

Layout general: sidebar actual sin cambios + `<main>` con `padding: 40px 48px 64px`, contenido centrado `max-width: 1120px`, columna con `gap: 28px`. El área de main lleva `.eb-page` + `<Grain/>`.

**Header** (flex, `justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap:16px`):
- Izquierda: fecha de hoy en uppercase 13px tertiary ("VIERNES 2 DE OCTUBRE", con `Intl.DateTimeFormat('es-MX', {weekday:'long', day:'numeric', month:'long'})`) y, debajo, `h1` con el **nombre del mes seleccionado** ("Octubre") en 34px/700.
- Derecha: `MonthSwitcher` de vidrio + botón **"Nuevo gasto"** (alto 40, padding 0 18, radio 20, ícono + de 16px, `.eb-btn-primary`). **Es el único botón de agregar gasto en la página** (además del FAB rayo que ya existe, si lo quieres conservar).

**Grid "bento"**: `display:grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap:20px; align-items:stretch`. Debajo de 1000px todas las tarjetas pasan a `grid-column: 1 / -1`.

**Fila 1, tres KPIs a la misma altura:**

1. **Gastado en octubre** — `span 6`, `.eb-card--hero`, padding `26px 28px`, flex column `justify-content: space-between; gap:24px`.
   - Etiqueta "Gastado en {mes}" + número héroe ($5,635 + .60).
   - Abajo: `SegmentedBar` por cuenta (gap 18px) y `Legend` de 3 columnas: Revolut Crédito $4,932.60 88% · Efectivo $600.00 11% · Nu Crédito $103.00 2%. Ordenadas de mayor a menor.
2. **Presupuesto** — `span 3`, padding `22px 22px 20px`, flex column `space-between; gap:16px`.
   - Header: "Presupuesto" (15px/500 secondary) y botón texto "Editar" (14px, color link) que abre el modal actual de editar presupuesto.
   - Centro: `ProgressRing` 92px con "63%" + bloque de texto: "Te quedan" (12px tertiary), "$3,364" (22px rounded), "de $9,000" (12px tertiary).
   - Abajo: `.eb-well` con ícono reloj naranja (16px) + "**≈ $116 al día** · 29 días" (13px muted; la cifra en bold y en color text).
3. **Próximos pagos** — `span 3`, padding `22px 22px 14px`.
   - Título "Próximos pagos" (15px/500 secondary).
   - 3 filas que se reparten la altura (`flex:1` cada una) con separador entre ellas. Cada fila: punto de 6px (naranja con glow `0 0 8px rgba(255,159,10,.8)` si vence en ≤ 3 días; gris `#636366` si no), nombre (14px/500), debajo "Mañana" / "En 16 días" (12px; naranja si ≤ 3 días, tertiary si no) y el monto a la derecha (14px/600; si es $0, en tertiary sin bold).

**Fila 2, dos tarjetas que terminan a la misma altura:**

4. **Recientes** — `span 7`, sin padding propio (las filas llevan 24px a los lados), `overflow:hidden`, flex column.
   - Header interno: "Recientes" (20px/700) + link "Ver todo" → página Gastos. Padding `22px 24px 8px`.
   - Encabezado de día: "JUEVES 1 DE OCTUBRE" (12px uppercase 600 tertiary, padding `4px 24px 6px`). Agrupa los gastos por día; si caben varios días, repite el encabezado.
   - Muestra los **últimos 5 gastos**. Cada fila: `CategoryTile` + nombre (15px/500) + cuenta en el subtítulo (13px tertiary; si el comercio viene de un agregador como "Mercadopago *elotesal", muestra el nombre limpio "Elotes Sal" y agrega "· Mercado Pago" en el subtítulo) + monto `−$170.00`.
   - Las filas usan `flex:1; min-height:60px` para estirarse si la tarjeta de al lado es más alta.
   - **Hover:** fondo `--eb-fill-subtle` y aparecen 2 botones de 30×30 radio 9 antes del monto: editar (`rgba(255,255,255,.08)`, ícono `#C7C7CC`) y borrar (`rgba(255,105,97,.14)`, ícono `#FF6961`). Sin hover, esos botones están ocultos. Quita los íconos de lápiz y basura que hoy se ven siempre.
5. **Cuentas** — `span 5`, padding `0 20px 14px`, flex column.
   - Header: "Cuentas" + link "Administrar" → página Cuentas.
   - Grid 2×2 (`grid-template-rows: repeat(2, minmax(110px,1fr))`, gap 12px, `flex:1` para que se estire) con `AccountCard` de las cuentas de **débito y efectivo** ordenadas por saldo o por el orden que el usuario ya tenga (en la maqueta: Nu $5,700, Revolut $25,501, Openbank $47,399, Efectivo $350).
   - Si hay más de 4, muestra las 4 con más saldo.
   - Pie: fila-link con separador superior, "5 tarjetas de crédito" + chevron → página Cuentas, con el número calculado.

Eliminar del dashboard: tarjeta "Últimos gastos 5", sección "Métodos de pago" con sus botones "Agregar gasto" / "+ Agregar" (la gestión de métodos de pago vive en la página Cuentas).

### 4.2 Dashboard — móvil (`Phone-Inicio.dc.html`, < 768px)

Contenedor con padding `64px 16px 140px` (deja espacio al tab bar), columna con `gap:22px`, `.eb-page` con el glow `radial-gradient(90% 40% at 70% -6%, rgba(94,107,255,0.16), transparent 70%)` + grano.
- Quita el header actual "☰ ExpenseBro ☀ ⟳". Navegación = tab bar; tema y sync se mueven al menú de perfil.
- **Header:** fecha uppercase 13px + título "Octubre ⌄" (34px; el chevron gris abre el selector de mes). A la derecha, un avatar circular de 36px con la inicial que abre el perfil (tema, sincronizar, configuración, cerrar sesión).
- **Gastado este mes**: card 24px, padding 20px, número 44px rounded, `SegmentedBar`. La leyenda va en **lista vertical** (punto, nombre a la izquierda con `flex:1`, monto a la derecha 15px/600).
- **Dos widgets cuadrados** (`grid 2 columnas, gap 14px, aspect-ratio:1`, padding 16px, radio 24px), cada uno con `justify-content: space-between`:
  - **Presupuesto:** título 13px/600 secondary arriba a la izquierda, anillo 62px arriba a la derecha con "63%". Abajo: "Te quedan" / "$3,364" (22px rounded) / "≈ $116 al día".
  - **Próximo pago:** título + tile naranja de 30px con ícono de calendario. Abajo: nombre de la deuda más próxima con saldo > 0 ("Plata Crédito"), "$6,103" y "En 16 días" en naranja.
- **Recientes:** header fuera de la tarjeta ("Recientes" 20px + "Ver todo"). La lista agrupada tiene filas de 60px, ícono 36px y subtítulo "Revolut Crédito · 1 oct". Swipe para editar/borrar.
- **Cuentas:** header + carrusel horizontal (`overflow-x:auto; margin: 0 -16px; padding: 0 16px`) de `AccountCard` de 168×106.
- **TabBar** abajo, con "Inicio" activo.

### 4.3 Patrimonio — móvil (`Phone-Patrimonio.dc.html`)

Glow de fondo verde: `radial-gradient(90% 30% at 30% -4%, rgba(48,209,88,0.14), transparent 70%)`.
- **Header:** "Patrimonio" (34px) + botón circular de 36px de vidrio (`rgba(255,255,255,.08)`, ícono + en color link) que abre "Agregar" con la elección positivo/deuda.
- **Héroe** (sin tarjeta, sobre el fondo):
  - "Neto después de pagos" (15px secondary) + "$113,262.00" (48px rounded).
  - `SegmentedBar` de 2 segmentos: verde (Tienes, ancho = positivos / (positivos + deudas)) y rojo (Debes), alto 14px. El verde lleva glow `0 0 12px rgba(48,209,88,.45)`.
  - Debajo, 2 columnas: "● Tienes $123,515.00" y "● Debes $10,253.00".
- **Segmented control** de vidrio de 2 opciones: **"Hoy"** | **"Con previstos · $103,262"**. La opción activa lleva `linear-gradient(180deg,#48484C,#36363A)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 3px 8px rgba(0,0,0,.4)` y radio 9. "Con previstos" cambia el número héroe a neto − previstos.
- **Secciones agrupadas** (encabezado 13px uppercase tertiary con padding 0 16px; a la derecha el subtotal cuando aplica; tarjeta radio 18px; filas de 52px; tile de 30px radio 8):
  1. **CUENTAS · $78,950**: cuentas de débito y efectivo. El tile lleva el color de la cuenta en degradado 145deg y la inicial ("Nu", "R", "O") o un ícono de billete para efectivo.
  2. **TE DEBEN**:
     - Avatar circular de 30px con la inicial en gris (`#6E6E75 → #48484E`), nombre de la persona y en el subtítulo el concepto ("Figs · Tarjeta"). Montos sin signo.
     - Agrupa por persona: Camila = camila figs + camila tarjeta = $3,329.00 (ver 5.4).
  3. **POR RECIBIR**: ingresos esperados (Sueldo), con tile verde + flecha abajo y monto `+$36,500.00` en verde.
  4. **DEUDAS · $10,253**:
     - Filas de 60px con tile del color de la tarjeta, nombre y una mini barra de 120×4px que muestra **qué tanto del ciclo ya pasó** (días transcurridos / días del ciclo; naranja si faltan ≤ 16 días, gris si no).
     - Debajo de la barra, "Vence en 16 días" (naranja si ≤ 16, tertiary si no). A la derecha, el saldo.
     - **Las deudas en $0 se colapsan** en una sola fila gris con tile de palomita: "3 tarjetas en $0", con el subtítulo de la más próxima ("Banregio vence mañana") y un chevron que expande la lista.
  5. **GASTOS PREVISTOS** (antes "Simulador de gastos previstos"):
     - Cada previsto es una fila con tile naranja y monto `−$10,000.00`.
     - Al final, una fila-botón en color link: "⊕ Agregar previsto", que abre un sheet con concepto y monto en lugar del input inline.
     - Pie de sección en 13px tertiary: "Con previstos tu neto queda en $103,262.00".
- TabBar con "Patrimonio" activo.

### 4.4 Patrimonio — escritorio (no está en la maqueta)

Aplica el mismo sistema: título grande, tarjetas `.eb-card`, el héroe neto con `SegmentedBar` y las mismas secciones agrupadas (sección 4.3) en un grid de 2 columnas (izquierda: Cuentas, Te deben, Por recibir; derecha: Deudas, Gastos previstos). Mantén los controles de orden ↑↓, editar y borrar, pero muéstralos **solo en hover** igual que en Recientes.

### 4.5 Resto de páginas (Gastos, Cuentas, Gastos Fijos, Categorías, Simulador)

No están diseñadas todavía. Solo aplica los tokens globales: fondo + grano, tarjetas `.eb-card`, `Money` con números rounded y listas con `GroupedList`, para que no se vean del estilo anterior. No cambies su estructura.

---

## 5. Lógica y datos (KPIs)

Implementa estos cálculos en helpers puros (por ejemplo `lib/dashboard-metrics.ts`) con tests si el proyecto tiene tests.

1. **Gasto del mes por cuenta:** suma de gastos del mes seleccionado agrupados por método de pago, ordenados de mayor a menor, con % del total redondeado. Hasta 3 segmentos; el resto va en "Otras".
2. **Presupuesto:**
   - `usado = gastado / presupuesto`.
   - `restante = presupuesto − gastado`.
   - Mes actual: `diasRestantes = díasDelMes − díaDeHoy` (2 oct → 29) y `porDia = restante / diasRestantes`, redondeado a pesos. Texto: `≈ $116 al día · 29 días`.
   - Mes pasado: en lugar de la pastilla, muestra "Terminaste con $X de sobra" o "Te pasaste por $X".
   - Mes actual con `restante < 0`: "Te pasaste por $X" en naranja y el anillo en modo excedido.
   - Sin presupuesto definido: anillo vacío y botón "Definir presupuesto".
3. **Categorías de gastos:** si los gastos ya tienen categoría, mapea categoría → `{icon, color}` en un solo archivo de configuración (`lib/category-style.ts`) con un fallback gris. Si no tienen categoría, usa el fallback gris con la inicial del comercio y deja un `TODO`. **No inventes categorías.**
4. **Próximos pagos:**
   - Toma las deudas de Patrimonio que tengan fecha de corte/pago (el "Xd restantes" que ya existe), calcula los días que faltan y ordena de menor a mayor.
   - Escritorio: muestra las 3 primeras, incluidas las que están en $0 (en gris).
   - Widget móvil: la más próxima **con saldo > 0**.
   - Texto: "Hoy" (0), "Mañana" (1), "En N días".
5. **Cuentas (dashboard):** saldos de los positivos de Patrimonio ligados a un método de pago de débito o efectivo. Link "N tarjetas de crédito" = número de métodos de tipo crédito.
6. **Patrimonio agrupado:**
   - Agrega al modelo de "positivos" un campo opcional `kind: 'account' | 'receivable' | 'income'`.
   - Migración/inferencia inicial: si tiene método de pago ligado → `account`; si el nombre contiene "sueldo" → `income`; si no → `receivable`.
   - Agrega un campo opcional `contact` (persona) para agrupar "Te deben"; si no hay contacto, cada positivo es su propia fila con su nombre tal cual.
   - Permite editar `kind` y `contact` desde el modal de edición existente.
7. **Previstos:** neto previsto = neto − suma de previstos (ya existe en el simulador; solo cambia la UI).
8. **Limpieza de nombres de comercio:** helper que quite prefijos de agregadores (`Mercadopago *`, `MP *`, `PAYPAL *`, `CLIP *`) y capitalice. Guarda el agregador para el subtítulo. Solo afecta la presentación; el dato original no se toca.

---

## 6. Accesibilidad y detalles

- Botones reales (`<button>`, `<a>`), `aria-label` en los botones de solo ícono (editar, eliminar, mes anterior/siguiente, perfil, nuevo gasto).
- Contraste: nada de texto gris más claro que `#8E8E93` sobre las tarjetas.
- Las barras y anillos llevan `role="img"` con `aria-label` ("63 % del presupuesto usado").
- Animaciones suaves y cortas: el anillo y las barras se llenan al montar (`transition: stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)`), y el hover de fila con transición de 150ms. Respeta `prefers-reduced-motion`.
- `env(safe-area-inset-bottom)` en el tab bar.

---

## 7. Plan de trabajo

1. **Fase 1 — Fundaciones:** tokens (2.x), `Grain`, `Card`, `Money`, `CategoryTile`, utilidades `.eb-glass`, `.eb-btn-primary` y `.eb-well`. Aplicar el fondo y las tarjetas globalmente. Commit.
2. **Fase 2 — Métricas:** helpers de la sección 5 y cambios de modelo de Patrimonio (`kind`, `contact`) con migración no destructiva. Commit.
3. **Fase 3 — Dashboard escritorio** (4.1). Compara visualmente contra `design-reference/Main.dc.html`. Commit.
4. **Fase 4 — Dashboard móvil + TabBar + swipe** (4.2). Commit.
5. **Fase 5 — Patrimonio móvil y escritorio** (4.3, 4.4). Commit.
6. **Fase 6 — Pasada global** (4.5), tema claro (2.7) y revisión de accesibilidad (6). Commit.

En cada fase, abre la página en el navegador a 1440 px y a 390 px y compárala lado a lado con el archivo de referencia correspondiente. Si algo no coincide (radio, sombra, tamaño de fuente, espaciado), corrígelo usando los valores exactos de la referencia.

Al final, entrégame un resumen con:
- Los archivos tocados.
- Los cambios de modelo/migración.
- Cualquier dato que no existía y cómo lo resolviste.
