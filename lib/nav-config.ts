import {
  LayoutDashboardIcon,
  ReceiptIcon,
  PieChartIcon,
  FlaskConicalIcon,
  ReceiptTextIcon,
  WalletIcon,
  TrendingUpIcon,
  SettingsIcon,
  LinkIcon,
  SlidersHorizontalIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Fuente unica de verdad para la navegacion de la app: sidebar (desktop),
 * mobile-nav (tab bar inferior) y app-header (sheet movil) consumen esta
 * misma estructura, para que un cambio de item/orden/icono se propague a
 * las tres superficies sin tener que editarlas por separado.
 */

export type NavSubItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Label corto para la tab bar movil */
  mobileLabel?: string;
  /** Identifica la sub-ruta activa cuando varias comparten el mismo pathname base (ej. tabs por query param) */
  tab?: string;
};

export type NavGroup = {
  /** Eyebrow label del grupo en el sidebar; no se usa en mobile-nav */
  label: string;
  items: NavItem[];
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Label corto para la tab bar movil, donde el espacio es limitado (ej. "Inicio" en vez de "Dashboard") */
  mobileLabel?: string;
  /** Si el item tiene subitems, es un grupo desplegable (Cuentas, Configuracion) en vez de un link directo */
  subItems?: NavSubItem[];
  /** Prefijo de ruta usado para marcar el item activo cuando tiene subrutas (ej. "/cuentas") */
  activePrefix?: string;
};

export const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", mobileLabel: "Inicio", icon: LayoutDashboardIcon },
      { href: "/gastos", label: "Gastos", icon: ReceiptIcon },
    ],
  },
  {
    label: "Cuentas",
    items: [
      { href: "/cuentas", label: "Cuentas", icon: WalletIcon },
      { href: "/patrimonio", label: "Patrimonio", icon: TrendingUpIcon },
      { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/gastos-fijos", label: "Gastos Fijos", mobileLabel: "Fijos", icon: ReceiptTextIcon },
      { href: "/categorias", label: "Categorias", icon: PieChartIcon },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/configuracion/preferencias",
        label: "Configuracion",
        mobileLabel: "Config",
        icon: SettingsIcon,
        activePrefix: "/configuracion",
        subItems: [
          {
            href: "/configuracion/preferencias",
            label: "Preferencias",
            mobileLabel: "Ajustes",
            icon: SlidersHorizontalIcon,
          },
          {
            href: "/configuracion/agregar-automatizacion",
            label: "Agregar automatizacion",
            mobileLabel: "Atajos",
            icon: LinkIcon,
          },
        ],
      },
    ],
  },
];

/**
 * Todas las secciones/paginas navegables del sidebar, aplanadas: cada item
 * de primer nivel de cada grupo, MAS los subitems reales (Preferencias,
 * Agregar automatizacion) que tienen su propia ruta. Es el catalogo
 * completo elegible para "Secciones" en el menu rapido del celular.
 */
export const allMobileNavCandidates: NavItem[] = navGroups.flatMap((group) =>
  group.items.flatMap((item) =>
    item.subItems && item.subItems.length > 0
      ? item.subItems.map((sub) => ({
          href: sub.href,
          label: sub.label,
          mobileLabel: sub.mobileLabel,
          icon: sub.icon,
        }))
      : [item]
  )
);

/** Default de la tab bar movil cuando el usuario no configuro nada en Preferencias */
export const DEFAULT_MOBILE_NAV_HREFS = [
  "/",
  "/gastos",
  "/cuentas",
  "/configuracion/preferencias",
];

export type QuickActionKind = "add-expense" | "expenses-today" | "expenses-week";

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: QuickActionKind;
  /** Label corto para la tab bar movil, donde el espacio es limitado */
  mobileLabel?: string;
};

/**
 * Funciones rapidas: no navegan a una pagina, disparan una accion (abrir el
 * modal de captura rapida, o un resumen de gastos de un rango de fechas ya
 * calculado). Comparten el mismo cupo de 0-5 items de la tab bar que las
 * secciones — se identifican con el prefijo "action:" en vez de un href real.
 * Con 0 items la barra no se muestra.
 */
export const quickActions: QuickAction[] = [
  {
    id: "action:add-expense",
    label: "Agregar gasto",
    mobileLabel: "Agregar",
    icon: PlusCircleIcon,
    kind: "add-expense",
  },
  {
    id: "action:expenses-today",
    label: "Gastos de hoy",
    mobileLabel: "Hoy",
    icon: CalendarDaysIcon,
    kind: "expenses-today",
  },
  {
    id: "action:expenses-week",
    label: "Gastos de la semana",
    mobileLabel: "Gast. sem",
    icon: CalendarRangeIcon,
    kind: "expenses-week",
  },
];

export function isQuickActionId(id: string): boolean {
  return id.startsWith("action:");
}

export function findQuickAction(id: string): QuickAction | undefined {
  return quickActions.find((action) => action.id === id);
}

export type MobileNavEntry =
  | { type: "section"; item: NavItem }
  | { type: "action"; action: QuickAction };

/**
 * Resuelve los items reales a mostrar en la tab bar movil a partir de los
 * ids guardados en preferencias (en orden): hrefs de seccion o ids de
 * "action:...". Un id que ya no exista se ignora en silencio.
 * null/undefined = default. [] = el usuario apago la barra.
 */
export function resolveMobileNavEntries(
  ids: string[] | null | undefined
): MobileNavEntry[] {
  if (ids && ids.length === 0) return [];

  const source = ids && ids.length > 0 ? ids : DEFAULT_MOBILE_NAV_HREFS;
  const resolved = source
    .map((id) => {
      if (isQuickActionId(id)) {
        const action = findQuickAction(id);
        return action ? ({ type: "action", action } as const) : null;
      }
      const item = allMobileNavCandidates.find((candidate) => candidate.href === id);
      return item ? ({ type: "section", item } as const) : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);

  if (ids == null) {
    if (resolved.length > 0) return resolved;
    return DEFAULT_MOBILE_NAV_HREFS.map((href) => ({
      type: "section",
      item: allMobileNavCandidates.find((candidate) => candidate.href === href)!,
    }));
  }

  return resolved;
}

/**
 * En escritorio el sidebar ya cubre las secciones. Si el usuario no
 * personalizo el menu, el rayo muestra las funciones rapidas. Si apago
 * el menu ([]), tampoco aparece. Si personalizo la lista, se usa tal cual.
 */
export function resolveDesktopQuickEntries(
  ids: string[] | null | undefined
): MobileNavEntry[] {
  if (ids && ids.length === 0) return [];
  if (ids == null) {
    return quickActions.map((action) => ({ type: "action" as const, action }));
  }
  return resolveMobileNavEntries(ids);
}

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.activePrefix) return matchesPath(pathname, item.activePrefix);
  return item.href === "/" ? pathname === "/" : matchesPath(pathname, item.href);
}
