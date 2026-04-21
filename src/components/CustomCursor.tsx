"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface CustomCursorProps extends Readonly<Record<string, never>> {}

export function CustomCursor(_: CustomCursorProps) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const smoothX = useSpring(cursorX, { stiffness: 220, damping: 24, mass: 0.2 });
  const smoothY = useSpring(cursorY, { stiffness: 220, damping: 24, mass: 0.2 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateCursor = (event: PointerEvent): void => {
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    };

    const handlePointerOver = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [data-cursor="hover"]')) {
        setIsHovering(true);
      }
    };

    const handlePointerOut = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [data-cursor="hover"]')) {
        setIsHovering(false);
      }
    };

    window.addEventListener("pointermove", updateCursor);
    window.addEventListener("pointerover", handlePointerOver);
    window.addEventListener("pointerout", handlePointerOut);

    return () => {
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-[80] hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen md:block",
        isHovering ? "bg-neon-blue/70 shadow-[0_0_45px_rgba(78,141,255,0.45)]" : "bg-white/60 shadow-[0_0_25px_rgba(255,255,255,0.18)]",
      )}
      style={{ x: smoothX, y: smoothY }}
      animate={{
        scale: isHovering ? 2.6 : 1,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    />
  );
}