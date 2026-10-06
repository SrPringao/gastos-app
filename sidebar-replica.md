# Prompt: replica este sidebar tal cual

Implementa el sidebar de escritorio de esta app con el mismo diseño, la misma anatomía y el mismo comportamiento visual. No inventes otra navegación, otro radio, otro fondo ni otro layout. Adapta solo las rutas, las etiquetas y los iconos al proyecto destino. El resto se copia.

Stack esperado: Next.js App Router, Tailwind CSS v4 (`@import "tailwindcss"`), `lucide-react`, y la clase `dark` en `<html>` para el tema. Si el proyecto destino ya tiene shadcn/ui, reutiliza su `Button` y `cn`. Si no, usa los equivalentes que se indican abajo.

El sidebar es solo de escritorio (`hidden` por defecto, `md:flex` desde 768px). En móvil no se muestra.

---

## Qué tiene que verse

Un panel flotante, no una columna pegada al borde de la ventana.

- Fijo a la izquierda, separado 12px del borde superior, inferior e izquierdo (`fixed top-3 bottom-3 left-3`).
- Ancho `w-64` (16rem / 256px).
- Esquinas `rounded-[30px]`.
- Borde de 1px con el color de vidrio, no un gris sólido opaco.
- Fondo translúcido con blur (`backdrop-filter: blur(20px) saturate(160%)`). El contenido de la página se ve detrás, desenfocado.
- Sombra suave. En claro es una sombra convencional. En oscuro es glow, no una sombra negra pesada.
- `z-30`, `overflow-hidden`, columna flex de alto completo.
- El contenido principal del layout se corre a la derecha con `md:pl-[17rem]` para dejar el panel (16rem) más el inset izquierdo (0.75rem) y un respiro de ~4px.

Tres zonas verticales, en este orden:

1. Cabecera con logo, centrado, con separador inferior.
2. Navegación con scroll propio, agrupada por secciones.
3. Pie fijo: toggle de tema, botón de actualizar, y cerrar sesión.

---

## Tokens que hay que tener

Pégalos en el CSS global. El radio base de la app es 30px. El acento es Voltage Blue `#405bff` en claro y en oscuro. El foco/anillo en oscuro es Signal Violet `#7084ff`.

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-geist-sans);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --radius: 30px;
  --background: #ffffff;
  --foreground: #191919;
  --primary: #405bff;
  --primary-foreground: #ffffff;
  --secondary: #f2f2f4;
  --secondary-foreground: #191919;
  --muted: #f2f2f4;
  --muted-foreground: #6d6e71;
  --accent: #f2f2f4;
  --accent-foreground: #191919;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #e4e4e7;
  --ring: #405bff;
  --sidebar: #ffffff;
  --sidebar-foreground: #191919;
  --sidebar-primary: #405bff;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f2f2f4;
  --sidebar-accent-foreground: #191919;
  --sidebar-border: #e4e4e7;
  --sidebar-ring: #405bff;
  --glow-violet-sm: 0 0 0 1px rgba(64, 91, 255, 0.12);
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.9);
  --glass-blur: blur(20px) saturate(160%);
  --glass-shadow: 0 8px 32px rgba(23, 23, 23, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.dark {
  --background: #0e0e0e;
  --foreground: #ffffff;
  --primary: #405bff;
  --primary-foreground: #ffffff;
  --secondary: #414042;
  --secondary-foreground: #ffffff;
  --muted: #2c2c2c;
  --muted-foreground: #a7a9ac;
  --accent: #414042;
  --accent-foreground: #ffffff;
  --destructive: oklch(0.704 0.191 22.216);
  --border: rgba(255, 255, 255, 0.1);
  --ring: #7084ff;
  --sidebar: #191919;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #405bff;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #414042;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: #7084ff;
  --glow-violet-sm: 0 0 24px rgba(112, 132, 255, 0.19);
  --glass-bg: rgba(25, 25, 25, 0.66);
  --glass-border: rgba(255, 255, 255, 0.14);
  --glass-blur: blur(20px) saturate(160%);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.glass-surface {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

Fuente: Geist como sans (`next/font/google`, variable `--font-geist-sans` en `<html>`). Si Geist no está disponible, usa la sans del proyecto, pero no cambies tamaños ni pesos del sidebar.

El tema se aplica poniendo o quitando la clase `dark` en `<html>`. Los iconos de sol/luna y las dos versiones del logo se eligen con `dark:` de Tailwind, no con JavaScript que cambie el `src`. Así no hay flash ni mismatch de hidratación.

Scrollbar del nav: delgada, track transparente, thumb `color-mix(in srgb, var(--foreground) 22%, transparent)`, radio pill. Está en `html` / `*::-webkit-scrollbar` del CSS global y el nav hereda ese look porque hace `overflow-y-auto`.

---

## Cómo está armado el shell

El layout del dashboard es una fila a pantalla completa. El sidebar es hermano del contenido, no va dentro del scroll de la página.

```tsx
<div className="bg-muted/30 flex h-screen h-[100dvh] w-full max-w-full overflow-hidden md:flex-row md:pl-[17rem]">
  <AppSidebar />
  <div className="relative flex h-full min-w-0 w-full flex-col">
    {/* header + main */}
    {children}
  </div>
</div>
```

`bg-muted/30` es el fondo contra el que flota el vidrio. Sin ese fondo (o uno equivalente que no sea el mismo color opaco del sidebar) el blur no se nota.

El `<aside>` exacto:

```tsx
<aside className="glass-surface text-sidebar-foreground fixed top-3 bottom-3 left-3 z-30 hidden w-64 flex-col overflow-hidden rounded-[30px] border md:flex">
```

---

## Cabecera

Logo centrado, bastante aire, línea inferior.

```tsx
<div className="flex items-center justify-center border-b px-5 py-8">
  <Link href="/" className="flex items-center justify-center">
    <Logo className="h-16" />
  </Link>
</div>
```

`Logo` renderiza dos `<img>`:

- `/logo-light.svg` visible en claro (`dark:hidden`).
- `/logo-dark.svg` visible en oscuro (`hidden dark:block`).
- Ambas: `h-auto w-auto shrink-0`, más la clase que llega por prop (`h-16`).
- `alt=""` y `aria-hidden` porque el link ya es el control. En el proyecto destino usa el logo real del producto, con una versión para fondo claro y otra para fondo oscuro. Misma altura (`h-16`), mismo centrado, mismo padding.

---

## Navegación

```tsx
<nav className="flex-1 overflow-y-auto px-3 py-4">
```

Los datos salen de una sola lista `navGroups`. Cada grupo tiene un eyebrow y una lista de items.

### Eyebrow del grupo

```tsx
<p className="text-muted-foreground/70 px-2.5 pt-5 pb-1.5 text-[11px] font-medium tracking-wide uppercase first:pt-0">
  {label}
</p>
```

El primer grupo no tiene padding superior extra (`first:pt-0`). Los siguientes sí (`pt-5`). Texto 11px, medium, tracking amplio, mayúsculas, color muted al 70%.

Los items del grupo van en `space-y-0.5`.

### Item de primer nivel (link directo)

Fila redondeada, no un rectángulo. Estructura de izquierda a derecha:

1. Barra vertical de 2px (`w-0.5`) por `h-4`, pegada al borde izquierdo, centrada en vertical, `rounded-full`. Invisible si está inactivo. Si está activo: `bg-primary` y `shadow-[var(--glow-violet-sm)]`.
2. Chip circular de `size-7` con el icono Lucide en `size-4`.
3. Label en `text-sm`.

Clases del link:

```
group relative flex items-center gap-3 rounded-2xl py-2 pr-3 pl-2.5 text-sm transition-colors
```

Activo:

- Fila: `bg-primary/10 text-foreground`
- Label: además `font-medium`
- Chip: `bg-primary text-primary-foreground`

Inactivo:

- Fila: `text-muted-foreground hover:bg-secondary/60 hover:text-foreground`
- Chip: `bg-secondary text-muted-foreground group-hover:text-foreground`
- Barra: `bg-transparent`

### Grupo desplegable (item con `subItems`)

Misma fila que el link, pero es un `<button type="button">` de `w-full`. A la derecha, un `ChevronDownIcon` de `size-3.5`, `opacity-50`, que rota 180 grados cuando está abierto (`rotate-180`, `transition-transform`). El label lleva `flex-1 text-left`.

Abierto si la ruta actual pertenece al grupo, o si el usuario lo abrió a mano. El estado manual es un `Record<string, boolean>` por `label` del item. El toggle invierte esa entrada. Si la ruta está activa, se queda abierto aunque el mapa manual diga lo contrario (`isActive || manuallyOpen[label]`).

Subitems, solo si está abierto, en `space-y-0.5 pb-1`:

```
flex items-center gap-2.5 rounded-xl py-1.5 pr-3 pl-[3.375rem] text-sm transition-colors
```

El `pl-[3.375rem]` alinea el texto del subitem con el texto del padre (padding del padre + chip + gap). Icono del subitem: `size-3.5 shrink-0 opacity-70`.

Subitem activo: `text-primary font-medium`.
Subitem inactivo: `text-muted-foreground hover:text-foreground`.

No repitas el chip circular ni la barra azul en el subitem. El subitem es más chico y más indentado.

### Pie

Separador superior, padding `p-3`.

Fila centrada de dos icon buttons (`mb-2 flex items-center justify-center gap-1`):

- Toggle de tema: `Button` ghost, `size="icon"`, `shrink-0`. En claro muestra `MoonIcon`. En oscuro muestra `SunIcon`. Ambos siempre en el DOM: sol con `hidden size-5 opacity-70 dark:block`, luna con `size-5 opacity-70 dark:hidden`. `title="Cambiar tema"` y `<span className="sr-only">Cambiar tema</span>`.
- Actualizar: mismo botón ghost icon. `RefreshCw` en `size-4.5 opacity-70`. Al click, `router.refresh()` y `animate-spin` durante 1500ms (`disabled` mientras gira). `title="Actualizar"`.

Debajo, cerrar sesión. Es un `Button` ghost de ancho completo, alineado a la izquierda, con el mismo chip circular que un item inactivo:

```
text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full justify-start gap-3 rounded-2xl px-2.5
```

Chip: `bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full` con `LogOut` en `size-4`. Texto: "Cerrar sesion".

El `Button` base del proyecto es pill (`rounded-full`), `text-sm font-medium`, ghost = `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50`, size icon = `size-9`. El de cerrar sesión sobreescribe el radio a `rounded-2xl` para igualar las filas del nav.

---

## Datos y estado activo

Una sola fuente de navegación. El sidebar la consume; no hardcodees los links dentro del componente.

```ts
export type NavSubItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Si varias subrutas comparten pathname y se distinguen por ?tab= */
  tab?: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  subItems?: NavSubItem[];
  /** Prefijo para marcar activo cuando hay subrutas, ej. "/configuracion" */
  activePrefix?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.activePrefix) return matchesPath(pathname, item.activePrefix);
  return item.href === "/" ? pathname === "/" : matchesPath(pathname, item.href);
}
```

Reglas:

- La raíz (`href: "/"`) solo está activa en `pathname === "/"`. Si usaras `startsWith`, todo quedaría activo.
- Cualquier otra ruta está activa en esa ruta y en sus hijas (`/gastos` y `/gastos/123`).
- Si el item declara `activePrefix`, ese prefijo manda (un grupo "Configuracion" con href a la primera subpágina sigue activo en `/configuracion/lo-que-sea`).
- Un subitem con `tab` está activo solo si el padre está activo y `searchParams.get("tab")` es igual a `sub.tab`.
- Un subitem sin `tab` está activo con `pathname === sub.href` (igualdad estricta, no prefijo).

Sustituye `navGroups` por las secciones reales del proyecto destino. Conserva la forma: 2 a 4 grupos con eyebrow, mezcla de links directos y como máximo unos pocos desplegables. No conviertas todo en acordeón.

Ejemplo de forma (cambia labels, hrefs e iconos):

```ts
export const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/configuracion/preferencias",
        label: "Configuracion",
        icon: SettingsIcon,
        activePrefix: "/configuracion",
        subItems: [
          { href: "/configuracion/preferencias", label: "Preferencias", icon: SlidersHorizontalIcon },
          { href: "/configuracion/agregar-automatizacion", label: "Agregar automatizacion", icon: LinkIcon },
        ],
      },
    ],
  },
];
```

---

## Componente

Cliente (`"use client"`). Hooks: `usePathname`, `useSearchParams`, `useRouter`, `useState`.

`handleRefresh`: pone `isRefreshing` en true, llama `router.refresh()`, y a los 1500ms lo regresa a false.

`handleSignOut`: haz el sign out que ya exista en el proyecto destino y luego manda al login. No inventes un endpoint nuevo si ya hay uno. En el original es `POST /api/auth/signout`, `router.refresh()` y `router.push("/login")`.

Estructura del render, en este orden, sin agregar bloques:

1. `aside.glass-surface...`
2. cabecera logo
3. `nav` que hace `navGroups.map`
4. por item: si no hay `subItems`, `NavLink`; si hay, `NavGroupTrigger` y, si `isOpen`, la lista de `NavSubLink`
5. pie con tema, refresh y cerrar sesión

No uses el componente Sidebar de shadcn. Este diseño es un `aside` propio. No agregues collapse a icon-only, tooltips de rail, ni un botón de hamburguesa dentro del panel. En `< md` el aside ya está en `hidden`.

---

## Lo que no hay que cambiar

- Radio del panel: 30px. Radio de fila: `rounded-2xl`. Radio de subitem: `rounded-xl`. Chip: círculo perfecto.
- Inset: 12px arriba, abajo e izquierda. Ancho 256px. Padding del layout: `md:pl-[17rem]`.
- Vidrio vía `.glass-surface` y las variables `--glass-*`. No uses un `bg-sidebar` opaco en el aside.
- Activo = wash `bg-primary/10` + chip relleno `bg-primary` + barrita de 2px con glow. Inactivo = texto muted, chip `bg-secondary`, sin barrita.
- Hover inactivo = `hover:bg-secondary/60`, no un gris inventado.
- Iconos Lucide, stroke por defecto, tamaños indicados (`size-4` en chip, `size-3.5` en subitem y chevron).
- Grupos con eyebrow en mayúsculas de 11px. No uses headings grandes ni divisores entre items.
- Cerrar sesión es la única fila que se pone roja, y solo en hover (`hover:text-destructive hover:bg-destructive/10`).
- Sin emojis en la interfaz ni en el código.

Cuando termines, el sidebar de escritorio tiene que poder ponerse al lado del original y leerse como el mismo componente: mismo flotado, mismo vidrio, misma jerarquía de grupo / item / subitem, y el mismo lenguaje de estado activo.
