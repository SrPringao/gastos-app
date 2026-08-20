---
name: ExpenseBro
description: Control room de finanzas personales — panel tecnico oscuro por defecto, con modo claro equivalente, acento violeta unico
colors:
  voltage-blue: "#405bff"
  signal-violet: "#7084ff"
  plasma-cyan: "#3dd6f5"
  midnight-ink: "#0e0e0e"
  carbon: "#191919"
  smoke: "#2c2c2c"
  fog: "#a7a9ac"
  paper: "#ffffff"
  ink: "#191919"
  slate: "#6d6e71"
  cloud: "#f2f2f4"
  hairline: "#e4e4e7"
typography:
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  eyebrow:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
  figures:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  pill: "30px"
  input: "10px"
  list-item: "10px"
  popover: "16px"
spacing:
  card-padding: "32px"
  card-gap: "24px"
  nav-item-gap: "2px"
components:
  button-primary:
    backgroundColor: "{colors.voltage-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "32px"
  nav-item-active:
    backgroundColor: "{colors.voltage-blue}"
    textColor: "{colors.paper}"
    rounded: "9999px"
---

# Design System: ExpenseBro

## Overview

**Creative North Star: "The Neon Control Room"**

ExpenseBro es un panel de control financiero, no un feed de transacciones: la superficie por defecto es un cockpit oscuro y denso — Midnight Ink de fondo, Carbon como cada panel, hairlines blanco-alpha en vez de bordes marcados — donde el violeta (#7084ff) y su vecino Voltage Blue (#405bff) son la unica voz cromatica del sistema. La app corre igual de bien en modo claro (Product Paper): mismo acento, misma jerarquia, misma tipografia, solo el lienzo cambia de negro a blanco puro — nunca un gris intermedio.

El sistema es intencionalmente monocromatico-mas-violeta. Rojo y verde existen unicamente como senal financiera real (sobregiro de presupuesto, gasto por debajo de lo esperado) — nunca como decoracion, nunca en un chart o badge que no represente dinero. Los numeros llevan su propia voz: JetBrains Mono con tabular-nums para cualquier cifra o fecha, distinguiendolos visualmente del texto conversacional en Geist Sans.

La softness del sistema es pill: 30px de radio en cards y botones no es un valor de conveniencia, es la firma visual completa. Nada en la interfaz tiene esquinas duras salvo el propio grid de la pagina.

**Key Characteristics:**
- Un solo acento cromatico (violeta/azul), todo lo demas es escala de grises
- Radio de 30px como firma no negociable en cards, botones y tags
- Elevacion por glow en oscuro (nunca sombra caida), sombra suave convencional en claro
- Cifras y fechas siempre en mono con tabular-nums; el resto del texto en sans
- Rojo/verde reservados exclusivamente para semantica financiera real

## Colors

Sistema monocromatico con un unico acento de marca compartido entre ambos temas.

### Primary
- **Voltage Blue** (#405bff): unico fill correcto para el CTA primario (botones `default`, "Agregar gasto"). No se usa en texto ni iconos sueltos.
- **Signal Violet** (#7084ff): foco de teclado, anillo de indicadores activos (nav, tabs), glow de marca. Vive en `--ring` y en las variables `--glow-violet-sm` / `--glow-violet-lg`.

### Secondary
- **Plasma Cyan** (#3dd6f5): tercer color de charts (`--chart-3`) para cuando una grafica necesita un tercer valor distinguible; nunca en UI de control.

### Neutral — Oscuro (`.dark`, default)
- **Midnight Ink** (#0e0e0e): fondo de pagina, la capa mas profunda.
- **Carbon** (#191919): superficie de card, popover, sidebar, mobile-nav.
- **Smoke** (#2c2c2c): `--muted`, fondos de barra de progreso vacia.
- **Graphite** (#414042): `--secondary`/`--accent`, chips de icono en reposo.
- **Fog** (#a7a9ac): `--muted-foreground`, texto secundario/metadata.
- **Paper** (#ffffff): texto primario y foreground de card.
- Bordes: blanco al 10% (`rgba(255,255,255,0.1)`) — hairline, nunca un gris solido.

### Neutral — Claro (`:root`)
- **Paper** (#ffffff): fondo de pagina y de card — el "Product Screenshot Panel" del mundo LaunchDarkly, brillante en vez de oscuro.
- **Ink/Carbon** (#191919): texto primario sobre fondo claro.
- **Cloud** (#f2f2f4): `--secondary`/`--muted`/`--accent`.
- **Slate** (#6d6e71): `--muted-foreground`.
- **Hairline** (#e4e4e7): bordes solidos suaves (en claro el hairline blanco-alpha no aplica; se usa un gris muy claro solido).

### Named Rules
**The One Accent Rule.** Voltage Blue y Signal Violet son los unicos colores decorativos permitidos en todo el sistema. Ningun otro tono (verde lima, naranja, cian saturado) entra a la UI salvo como semantica financiera o como el color de identidad propio de una cuenta (`accountColor`), que es informacion funcional del usuario, no una eleccion decorativa del sistema.

**The Financial Color Rule.** Rojo (`--destructive`) y verde solo aparecen cuando representan dinero real: sobregiro de presupuesto (rojo), gasto por debajo del esperado. Nunca decoran un chip, un icono o un estado que no sea financiero.

## Typography

**Body Font:** Geist Sans (con fallback ui-sans-serif, system-ui)
**Mono/Figures Font:** JetBrains Mono (con fallback ui-monospace, SFMono-Regular)

**Character:** Geist Sans lleva toda la conversacion — labels, nombres, descripciones. JetBrains Mono es exclusivo de cifras: monto, fecha, porcentaje, badges de dias — nunca aparece en texto libre. La distincion es deliberada: el ojo debe poder diferenciar "esto es un dato" de "esto es una etiqueta" sin leer el contenido.

### Hierarchy
- **Heading-sm** (500, 24px, 1.3): titulo de pagina ("Dashboard"). Unico uso de la escala Minor Third fuera de las cifras hero.
- **Eyebrow** (500, 11-12px, uppercase, tracking 0.02em): titulo de cada card (`CardTitle`) y de cada grupo del sidebar ("PRINCIPAL", "CUENTAS", "SISTEMA"). Siempre en `--muted-foreground`, nunca en el color de texto primario.
- **Figures / hero number** (500, 32px mono, tabular-nums): el monto protagonista de una card de metrica (gastado este mes, presupuesto). Es el unico lugar donde una cifra crece mas alla del body.
- **Body** (400, 14px): nombres de cuenta, descripciones de gasto, texto de navegacion.
- **Metadata** (400, 12px): fecha, tipo de cuenta, porcentaje — siempre `--muted-foreground`, siempre mono cuando el contenido es numerico.

### Named Rules
**The Mono-For-Numbers Rule.** Cualquier cifra de dinero, fecha o porcentaje se renderiza en JetBrains Mono con `font-variant-numeric: tabular-nums` (clase utilitaria `.font-figures`). Texto conversacional nunca usa mono.

## Layout

Densidad comfortable, base de 8px. Las cards del dashboard viven en un grid responsivo (`sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12`) con `gap-3 sm:gap-4`. El sidebar de escritorio es fijo, 256px (`w-64`), oculto bajo `md:` donde el mobile-nav (barra inferior fija) y un header con Sheet lateral toman su lugar. El contenido principal corre con padding `p-4 sm:p-6 lg:p-8`.

La entrada del dashboard es una unica animacion orquestada (`stagger-in` + `card-rise`, 40ms de delay escalonado entre cards, 500ms cubic-bezier), respetando `prefers-reduced-motion`. No hay animaciones sueltas por elemento fuera de esta.

## Elevation & Depth

Dos sistemas de elevacion segun lo que el elemento *es*, no un solo lenguaje para todo:

- **Contenido (Card):** hibrido por tema — glow en oscuro, sombra convencional en claro (`--glow-card`, `--glow-violet-sm`, `--glow-violet-lg`, cambian de valor segun `.dark`). Sigue solido, sin transparencia: es informacion, no un overlay.
- **Superficies flotantes (liquid glass):** todo lo que se posiciona *sobre* otro contenido — sidebar, mobile-nav, `Dialog`, `Sheet`, `Popover`, `Select` — usa la utilidad compartida `.glass-surface`: fondo translucido (`--glass-bg`), `backdrop-filter: blur(20px) saturate(160%)` (`--glass-blur`), borde brillante (`--glass-border`) y una sombra de separacion real con inset highlight (`--glass-shadow`). Esta capa reemplaza `--glow-card` en esos componentes especificos; en `Card` no cambia nada.

### Shadow Vocabulary
- **glow-card** — oscuro: `0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.45)`; claro: `0 1px 2px rgba(23,23,23,0.04), 0 4px 16px rgba(23,23,23,0.06)`. Elevacion de reposo de `Card` unicamente.
- **glow-violet-sm** — oscuro: `0 0 24px rgba(112,132,255,0.19)`; claro: `0 0 0 1px rgba(64,91,255,0.12)`. Indicador de estado activo (nav del sidebar, mobile-nav) y hover de card.
- **glow-violet-lg** — oscuro: `0 0 40px rgba(64,91,255,0.25)`; claro: `0 8px 24px rgba(64,91,255,0.22)`. Reservado al CTA principal ("Agregar gasto") y al halo degradado detras de la card de metrica destacada.
- **glass-shadow** — oscuro: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`; claro: `0 8px 32px rgba(23,23,23,0.10), inset 0 1px 0 rgba(255,255,255,0.6)`. Separacion real (nunca glow) para superficies de vidrio: necesitan leerse como una capa fisica despegada de lo que hay detras.

### Named Rules
**The No-Drop-Shadow Rule.** En `Card`, en modo oscuro, nunca se usa una sombra caida neutra sin el halo blanco-alpha que la acompaña; el glow violeta o el hairline blanco comunican jerarquia. Esta regla es especifica de contenido solido — no aplica a `.glass-surface`, donde la sombra de separacion es intencional y necesaria para que el vidrio se lea como capa.

**The Glass-Is-For-Overlays Rule.** El liquid glass (`.glass-surface`) se reserva a superficies que flotan sobre otro contenido visible detras: sidebar, mobile-nav, dialogos, sheets, popovers, selects. Nunca se aplica a `Card` ni a ningun contenedor de contenido en el flujo normal de la pagina — el vidrio necesita algo que desenfocar detras para tener sentido, y el contenido del dashboard no es ese "detras".

## Shapes

**The Pill Rule.** El radio base del sistema es 30px (`--radius`), aplicado literal a `Card` (`rounded-[30px]`) y heredado por botones vía `rounded-full` (calculan su propia capsula segun altura). Inputs, `SelectTrigger` y `SelectItem` usan un radio menor y explicito (10px) porque son controles de formulario densos, no paneles. Los menus/popovers flotantes (`SelectContent`, `PopoverContent`) usan un radio explicito de 14px (`rounded-[14px]`) — heredar el `--radius` global via `rounded-lg`/`rounded-2xl` se veia excesivo en paneles chicos (30-38px de esquina en un menu de 3 opciones lee como una pildora, no un menu). Los chips de icono circulares (dentro de cards y del sidebar) son siempre `rounded-full`, un círculo perfecto de 28px (`size-7`).

## Components

### Buttons
- **Shape:** capsula completa (`rounded-full`).
- **Primary:** Voltage Blue (#405bff) solido, texto blanco. Es el unico fill correcto para una accion primaria — nunca blanco, gris o el violeta claro.
- **Hover:** `bg-primary/90`.
- **Outline/Ghost/Secondary:** heredan los tokens neutrales (`--secondary`, `--accent`) sin introducir un segundo acento.

### Cards
- **Corner Style:** 30px literal (`rounded-[30px]`).
- **Background:** Carbon en oscuro, Paper en claro (`--card`).
- **Shadow Strategy:** `--glow-card` en reposo, `--glow-card` + `--glow-violet-sm` al hover.
- **Internal Padding:** 32px (`px-8 py-8`) — el card padding "32-48px" del mundo original, en su extremo inferior para mantener densidad de dashboard.
- **CardTitle:** hereda por defecto la voz eyebrow (11-12px, uppercase, tracking, `--muted-foreground`) — ningun componente necesita repetir esta clase manualmente.

### Metric Card (signature)
Card de metrica con un numero hero en mono (32px) como protagonista, eyebrow arriba, chip de icono circular a la derecha. La card destacada del dashboard ("Gastado este mes") lleva ademas un halo del `--gradient-signal` (violeta→azul, 179deg) difuminado (`blur-3xl`, opacidad 15%) en la esquina superior derecha — el unico lugar donde el gradiente de marca aparece como mancha decorativa en vez de fill solido.

### Inputs / Select
- **Style:** borde 1px (`--input`/`--border`), radio 10px, fondo transparente.
- **Focus:** anillo de Signal Violet (`--ring`) a 3px.
- **Select popover:** `rounded-[14px]`, `--glow-card`. `SelectItem` interno usa `rounded-[10px]`.

### Navigation (Sidebar)
Panel agrupado, no lista plana: cada seccion ("Principal", "Cuentas", "Gestion", "Sistema") lleva su propio eyebrow label. Cada item tiene un chip de icono circular (28px) que cambia de Graphite/Cloud a Voltage Blue solido cuando esta activo, mas un indicador lateral solido violeta (barra de 2px, con glow) a la izquierda del item — nunca solo un cambio de fondo. El logo es el componente `<Logo>` (`components/logo.tsx`) a 28px, condicional por tema — `logo-dark.svg` en oscuro, `logo-light.svg` en claro — sin chip ni fondo forzado.

### Mobile Nav
Barra fija inferior, Carbon/Paper al 95% con blur, mismo `--glow-card`. Item activo: icono mas grueso (`strokeWidth 2.5`), texto a opacidad completa, indicador superior de 2px en Voltage Blue con `--glow-violet-sm`.

### Auth (Login / Registro)
Unico lugar del sistema donde `--gradient-signal` se usa como **fill solido**, no como halo difuminado: un bloque de gradiente corona el panel (logo + nombre + subtitulo en blanco), y el formulario en `.glass-surface` se monta encima, jalado hacia arriba (`-mt-8`) para leerse como una sola pieza flotando sobre el color — la card de vidrio "aterriza" sobre el bloque solido en vez de flotar sobre un fondo neutro. El fondo de pagina detras sigue siendo `--background` solido (Midnight Ink u oscuro/Paper), con apenas un wash de marca al 8% de opacidad — el compromiso de color vive en el bloque superior, no en la pagina entera. El logo aqui si lleva un chip propio (`bg-white/15`, blur) porque se apoya sobre el gradiente solido, a diferencia del sidebar donde se muestra sin fondo.

### Named Rules
**The One Solid Gradient Rule.** `--gradient-signal` como fill solido (sin blur, sin opacidad reducida) se reserva exclusivamente al header de Auth. En cualquier otro lugar del sistema (halos de card, glows) el gradiente aparece difuminado y a baja opacidad — nunca como bloque de color pleno.

## Do's and Don'ts

### Do:
- **Do** usar 30px de radio literal en cards y botones — no una aproximacion via la escala de Tailwind por defecto.
- **Do** usar glow (`--glow-violet-sm` / `--glow-violet-lg`) para elevacion en modo oscuro, nunca una sombra caida neutra sola.
- **Do** renderizar toda cifra de dinero/fecha en JetBrains Mono con tabular-nums.
- **Do** mantener Voltage Blue como el unico fill de CTA primario en ambos temas.
- **Do** agrupar la navegacion del sidebar bajo eyebrow labels quietos (Principal / Cuentas / Gestion / Sistema).
- **Do** pintar la barra de "gastos por cuenta" con el color propio de esa cuenta (`accountColor`), con `--primary` solo como fallback si la cuenta no tiene color asignado — es informacion funcional (identifica la cuenta en toda la app), no decoracion.

### Don't:
- **Don't** introducir un segundo color de acento (verde, naranja, amarillo) fuera de la semantica financiera real o del color propio de una cuenta.
- **Don't** usar un `border-left`/`border-right` de color como decoracion en cards o list items — la marca vive en el chip de icono y el indicador lateral del nav, no en bordes de color arbitrario.
- **Don't** dejar un componente de navegacion (sidebar, mobile-nav) con colores hardcodeados fuera de los tokens de tema — todo debe resolver via `--background`/`--card`/`--primary` para heredar claro/oscuro automaticamente.
