"use client";

import { useEffect } from "react";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaViewport() {
  useEffect(() => {
    if (!isStandalone()) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const content = meta.getAttribute("content") || "";
    if (content.includes("user-scalable=no")) return;

    const newContent = content
      ? `${content}, maximum-scale=1, user-scalable=no`
      : "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

    meta.setAttribute("content", newContent);
  }, []);

  return null;
}
