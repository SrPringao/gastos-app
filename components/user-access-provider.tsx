"use client";

import { createContext, useContext, useMemo } from "react";
import { NO_ACCESS, type UserAccess } from "@/lib/features";
import { mobileNavCandidatesFor, navGroupsFor } from "@/lib/nav-config";

const UserAccessContext = createContext<UserAccess>(NO_ACCESS);

/**
 * Acceso del usuario (super admin y funciones especiales), leido en el
 * layout del dashboard. Solo decide que secciones se muestran: cada pagina
 * y ruta de API vuelve a validar el acceso en el servidor.
 */
export function UserAccessProvider({
  access,
  children,
}: {
  access: UserAccess;
  children: React.ReactNode;
}) {
  return <UserAccessContext.Provider value={access}>{children}</UserAccessContext.Provider>;
}

export function useUserAccess() {
  return useContext(UserAccessContext);
}

/** Grupos del sidebar y catalogo del menu rapido para el usuario actual */
export function useNavForUser() {
  const access = useUserAccess();
  return useMemo(
    () => ({ groups: navGroupsFor(access), candidates: mobileNavCandidatesFor(access) }),
    [access]
  );
}
