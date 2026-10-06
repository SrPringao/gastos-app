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
