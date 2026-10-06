/**
 * Clave de busqueda de una persona: minusculas, sin acentos y sin espacios
 * dobles. "Camila", " camila " y "CAMILA" comparten clave; "Mamá" -> "mama".
 */
export function contactNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Nombre limpio para guardar: recortado y sin espacios dobles */
export function cleanContactName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
