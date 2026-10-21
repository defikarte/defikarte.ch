import { Capacitor } from '@capacitor/core';
import { useNavigate } from '@tanstack/react-router';
import { type TouchEvent, useRef } from 'react';

// how close to the screen edge a swipe has to start - the web view draws under the safe areas, so
// this holds in landscape too
const EDGE_WIDTH = 24;
const MIN_DISTANCE = 80;

/**
 * The iOS swipe from the left edge back to `backTo`, as touch handlers to spread onto the page.
 * WKWebView's own back gesture stays off: it walks the browser history, which after a tab switch
 * leads across tabs. There is no drag-follow, as the page below is not mounted to reveal. Android
 * gets back from the system instead, see useAndroidBackButton.
 */
export const useEdgeSwipeBack = (backTo: string | undefined) => {
  const navigate = useNavigate();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  if (!backTo || Capacitor.getPlatform() !== 'ios') {
    return {};
  }

  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      startRef.current =
        event.touches.length === 1 && touch.clientX <= EDGE_WIDTH
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    },
    onTouchEnd: (event: TouchEvent) => {
      if (!startRef.current) {
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = Math.abs(touch.clientY - startRef.current.y);
      startRef.current = null;

      if (dx > MIN_DISTANCE && dy < dx / 2) {
        void navigate({ to: backTo });
      }
    },
    onTouchCancel: () => {
      startRef.current = null;
    },
  };
};
