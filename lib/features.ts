/**
 * Interruptores de funciones. Apagar una aqui la oculta de toda la
 * navegacion (sidebar, menus moviles, tab bar, menu rapido) y redirige su
 * ruta al Dashboard.
 */
export const FEATURES = {
  /** Simulador de escenarios (/simulador): fuera temporalmente para todos */
  simulator: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Funciones especiales por usuario: apagadas para todos y un super admin
 * las enciende a cada quien desde /admin (tabla user_features).
 */
export const USER_FEATURES = {
  exchange: {
    label: "Intercambio",
    description: "Gastos del intercambio, aparte del Dashboard y Patrimonio",
  },
} as const;

export type UserFeatureKey = keyof typeof USER_FEATURES;

export const USER_FEATURE_KEYS = Object.keys(USER_FEATURES) as UserFeatureKey[];

export function isUserFeatureKey(value: unknown): value is UserFeatureKey {
  return typeof value === "string" && value in USER_FEATURES;
}

/** Lo que un usuario puede ver ademas de lo publico */
export type UserAccess = {
  isSuperAdmin: boolean;
  features: UserFeatureKey[];
};

/** Requisito de una seccion: ser super admin o tener una funcion especial */
export type AccessRequirement = "superAdmin" | UserFeatureKey;

export const NO_ACCESS: UserAccess = { isSuperAdmin: false, features: [] };

export function hasAccess(access: UserAccess, requirement: AccessRequirement | undefined): boolean {
  if (!requirement) return true;
  if (requirement === "superAdmin") return access.isSuperAdmin;
  return access.features.includes(requirement);
}
