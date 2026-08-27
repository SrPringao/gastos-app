"use client";

import { useEffect, useState } from "react";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaViewport() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateViewport = () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (!meta) return;

      if (isStandalone()) {
        meta.setAttribute(
          "content",
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        );
        document.body.style.touchAction = "pan-x pan-y";
      } else {
        meta.setAttribute(
          "content",
          "width=device-width, initial-scale=1, viewport-fit=cover"
        );
      }
    };

    updateViewport();

    let lastTouchY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      
      const target = e.target as HTMLElement;
      const scrollableElement = target.closest('[data-scrollable]') || 
                                target.closest('main');
      
      if (scrollableElement) {
        isAtTop = scrollableElement.scrollTop <= 0;
      } else {
        isAtTop = window.scrollY <= 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touchY = e.touches[0].clientY;
      const touchYDelta = touchY - lastTouchY;

      if (isAtTop && touchYDelta > 0) {
        e.preventDefault();
        return false;
      }
      
      lastTouchY = touchY;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    const timer = setTimeout(updateViewport, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mounted]);

  return null;
}
