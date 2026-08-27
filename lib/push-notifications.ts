export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getDeviceType(): "tablet" | "mobile" | "desktop" {
  const ua = navigator.userAgent;
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (isIpadOs || /ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function isIosDevice(): boolean {
  const ua = navigator.userAgent;
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIpadOs || /iphone|ipad|ipod/i.test(ua);
}

export function isStandalonePwa(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function savePushSubscription(
  subscription: PushSubscription
): Promise<boolean> {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  if (!p256dh || !auth) return false;

  const res = await fetch("/api/push-notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(p256dh),
      auth: arrayBufferToBase64(auth),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      expirationTime: subscription.expirationTime,
    }),
  });
  return res.ok;
}

export async function subscribeCurrentDevice(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  if (!("Notification" in window)) return false;

  const registration = await navigator.serviceWorker.ready;
  const vapidRes = await fetch("/api/push-notifications/vapid-public-key");
  if (!vapidRes.ok) return false;
  const { publicKey } = (await vapidRes.json()) as { publicKey?: string };
  if (!publicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
  return savePushSubscription(subscription);
}

export async function syncExistingSubscription(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return false;
  return savePushSubscription(existing);
}

export async function unsubscribeCurrentDevice(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return;
  await existing.unsubscribe();
}
