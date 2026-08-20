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
      { href: "/simulador", label: "Simulador", icon: FlaskConicalIcon },
    ],
  },
  {
    label: "Cuentas",
    items: [
      { href: "/cuentas", label: "Cuentas", icon: WalletIcon },
      { href: "/patrimonio", label: "Patrimonio", icon: TrendingUpIcon },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/gastos-fijos", label: "Gastos Fijos", icon: ReceiptTextIcon },
      { href: "/categorias", label: "Categorias", icon: PieChartIcon },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/configuracion/agregar-automatizacion",
        label: "Configuracion",
        mobileLabel: "Config",
        icon: SettingsIcon,
        activePrefix: "/configuracion",
        subItems: [
          {
            href: "/configuracion/agregar-automatizacion",
            label: "Agregar automatizacion",
            icon: LinkIcon,
          },
        ],
      },
    ],
  },
];

/** Los 4 items que caben en la tab bar movil: uno por grupo, colapsando subitems al link principal */
export const mobileNavItems: NavItem[] = navGroups.map((group) => group.items[0]);

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.activePrefix) return matchesPath(pathname, item.activePrefix);
  return item.href === "/" ? pathname === "/" : matchesPath(pathname, item.href);
}
