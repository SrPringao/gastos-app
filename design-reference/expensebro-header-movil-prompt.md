# ExpenseBro — Header flotante en móvil + menú lateral

Prompt para Claude Code. Continúa el rediseño "Apple dark". Las pantallas móviles nuevas (< 768px) se quedaron sin header y sin el botón ☰ que abre el sidebar. Aquí se define un **header integrado**: no es una barra rectangular, son botones flotantes sobre el fondo, y al hacer scroll se agrega una capa de blur con desvanecido.

Archivos de referencia: copiar a `design-reference/`. Son la fuente de verdad visual.

- `Phone-Inicio.dc.html`, `Phone-Gastos.dc.html`, `Phone-Patrimonio.dc.html` y `Phone-Cuentas.dc.html` → **actualizados**, con el header en estado "arriba del todo".
- `Phone-Header-Scroll.dc.html` → **nuevo**: estado "con scroll".
- `Phone-Menu.dc.html` → **nuevo**: menú lateral abierto.

## 1. Componente `MobileHeader`

Un solo componente para todas las páginas móviles.

Props:

- `title`: título de la página.
- `subtitle?`: texto pequeño bajo el título compacto.
- `rightAction?`: botón de la derecha.
  - Inicio: avatar "F", que abre el perfil.
  - Gastos: filtros.
  - Patrimonio: +, que abre agregar.
  - Cuentas: +, que abre nuevo método.

### 1.1 Estructura y posición

- `position: sticky; top: 0; z-index: 40`.
- Respeta el safe area: `padding-top: env(safe-area-inset-top)`, más 8px.
- Fila de 44px con `display:flex; justify-content:space-between; align-items:center` y padding horizontal de 16px.
- **No lleva fondo ni borde** en estado inicial: los botones flotan sobre el glow de la página.

### 1.2 Botones circulares de vidrio (☰ y acción derecha)

Medidas y estilo de ambos botones:

```css
width: 40px; height: 40px; border-radius: 20px; border: 0;
background: rgba(255,255,255,0.08);
backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06), 0 6px 16px -8px rgba(0,0,0,0.8);
```

**Ícono ☰:**

- SVG 20×20 de trazo, `stroke-width: 2.2`, `stroke-linecap: round`.
- Path: `M4 7h16M4 12h16M4 17h10`. La tercera línea es más corta a propósito.
- Color `#F5F5F7`.
- Lleva `aria-label="Abrir menú"` y `aria-expanded`.

**Acción derecha:**

- Íconos en color link `#8C95FF`, con `aria-label`.
- Avatar: fondo `linear-gradient(180deg,#4A4A50,#2E2E33)` con inicial de 15px/600.

### 1.3 Título grande (fuera del header, en el contenido)

- Debajo de la fila va el título grande de siempre: 34px/700, -0.025em, con su sobretítulo uppercase de 13px cuando aplica.
- Gap de 14–22px entre la fila y el título.
- **Quita** de cada página los botones de 36px que antes estaban junto al título (ahora viven en la fila del header).

### 1.4 Estado con scroll

Usa un `IntersectionObserver` sobre el título grande. Cuando el título sale de la vista, se activa el estado compacto:

**Capa de blur con desvanecido** (no es una barra con borde):

- `position:absolute; inset:0 0 auto 0; height: calc(env(safe-area-inset-top) + 88px)`.
- `pointer-events:none`.
- Estilos:
  ```css
  background: linear-gradient(180deg, rgba(5,5,6,0.92) 0%, rgba(5,5,6,0.75) 45%, rgba(5,5,6,0) 100%);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
  ```
- Encima, el glow de la página en otra capa: `radial-gradient(90% 100% at 70% -20%, rgba(94,107,255,0.18), transparent 70%)`. Usa el tinte de cada página: verde en Patrimonio, índigo en el resto.

**Título compacto centrado:**

- Título en 17px/600, -0.01em.
- `subtitle` opcional en 11px tertiary. En Inicio: "$6,496.60 gastado".

**Transición:**

- La capa y el título compacto entran con `opacity` en 200ms; el título además con `translateY(4px→0)`.
- Respeta `prefers-reduced-motion`.

## 2. Menú lateral móvil (`Phone-Menu.dc.html`)

Se abre con el botón ☰. **Reutiliza los mismos items, estilos y estado activo del sidebar de escritorio.** No cambies el sidebar de escritorio.

- **Fondo de la página:** la página de atrás se reduce y desplaza (`transform: scale(0.94) translateX(60px)`, `transform-origin: 0 50%`) con `filter: blur(6px)` y `opacity: .7`, más un overlay `rgba(0,0,0,0.45)`. Tocar el overlay cierra el menú.
- **Panel flotante:**
  - Posición: `left: 10px; top: env(safe-area-inset-top)+8px; bottom: 24px; width: 286px`.
  - Forma: radio 30, fondo `rgba(24,24,24,0.92)` con `backdrop-filter: blur(30px) saturate(160%)`.
  - Borde `1px solid rgba(255,255,255,0.09)` y sombra `0 30px 80px -20px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06)`.
  - `role="dialog"` y `aria-modal="true"`.
- **Cabecera del panel** (alto 96, separador inferior): logo a la izquierda (70×54) y botón cerrar X a la derecha (36px, vidrio).
- **Items:** las mismas secciones del sidebar (Principal, Cuentas, Gestion, Sistema). El item activo depende de la ruta, con su pill azul oscuro, círculo de acento y rayita.
- **Pie:** "Cerrar sesion" a la izquierda; botones de tema y sincronizar (44px) a la derecha.
- **Animación:**
  - El panel entra desde la izquierda (`translateX(-100%)→0`, 320ms, `cubic-bezier(.2,.8,.2,1)`).
  - Mientras, la página de atrás se escala y desenfoca.
- **Interacción:**
  - Se cierra con: Escape, tocar el overlay, swipe a la izquierda o navegar.
  - Bloquea el scroll del body mientras está abierto.
  - El foco queda atrapado dentro del panel.

## 3. Ajustes de layout

- El contenido de cada página móvil empieza con `padding-top: env(safe-area-inset-top)` más 8px. El header es sticky, así que el título grande queda debajo de la fila de botones.
- Se elimina por completo el header viejo móvil ("☰ ExpenseBro ☀ ⟳"). Tema y sincronizar viven en el menú.
- El TabBar inferior no cambia.

## 4. Plan

1. Componente `MobileHeader` con sus 2 estados.
2. Integrarlo en Inicio, Gastos, Patrimonio y Cuentas, quitando los botones duplicados junto al título.
3. Menú lateral móvil.
4. Revisar a 390px contra las referencias.

Haz un commit por paso.
