"use client";

import { useEffect, useState } from "react";

export type ViewportKeyboardState = {
  bottomInset: number;
  isKeyboardOpen: boolean;
  visualHeight: number;
};

const SUPPORTS_VV =
  typeof window !== "undefined" && "visualViewport" in window;

export function useViewportKeyboard(active: boolean): ViewportKeyboardState {
  const [state, setState] = useState<ViewportKeyboardState>({
    bottomInset: 0,
    isKeyboardOpen: false,
    visualHeight:
      typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!active || !SUPPORTS_VV) return;
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const layout = window.innerHeight;
        const visual = vv.height;
        const offset = vv.offsetTop || 0;
        const bottomInset = Math.max(0, layout - (visual + offset));
        const open = bottomInset > 80;
        setState({
          bottomInset: Math.round(bottomInset),
          isKeyboardOpen: open,
          visualHeight: Math.round(visual),
        });
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [active]);

  return state;
}
