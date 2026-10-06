/** Llamadas a la API de metodos de pago desde Cuentas */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function send<T = unknown>(url: string, init: RequestInit): Promise<Result<T>> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.error || "No se pudo guardar" };
  return { ok: true, data: data as T };
}

export function updateMethod(
  id: number,
  patch: Partial<{ name: string; type: string; color: string | null; paymentDay: number | null; archived: boolean }>
) {
  return send(`/api/accounts/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function createMethod(input: {
  name: string;
  type: string;
  color: string | null;
  paymentDay: number | null;
  /** Centavos; si viene, se crea su saldo ligado en Patrimonio en la misma accion */
  patrimonioAmount?: number;
}) {
  return send<{ account: { id: number }; netWorthEntryId: number | null }>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Vincula un nombre de Wallet; si ya era de otro metodo, lo mueve aqui */
export function addWalletName(rawCardName: string, accountId: number) {
  return send("/api/card-name-mappings", {
    method: "POST",
    body: JSON.stringify({ rawCardName, accountId, reassignExistingExpenses: true }),
  });
}

export function removeWalletName(mappingId: number) {
  return send(`/api/card-name-mappings/${mappingId}`, { method: "DELETE" });
}
