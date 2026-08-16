"use client";

import { useEffect } from "react";
import { registerPushServiceWorker } from "@/lib/push-notifications";

export function PwaServiceWorker() {
  useEffect(() => {
    registerPushServiceWorker().catch(() => {});
  }, []);

  return null;
}
