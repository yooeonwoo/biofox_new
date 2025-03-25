import { cn } from "@/utils/cn";
import React, { useEffect, useRef, useState } from "react";

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export const Spotlight = ({ children, className = "" }: SpotlightProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [isMounted]);

  const handleMouseMove = (e: MouseEvent) => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (
        x >= 0 &&
        x <= rect.width &&
        y >= 0 &&
        y <= rect.height
      ) {
        setOpacity(1);
      } else {
        setOpacity(0);
      }

      setPosition({ x, y });
    }
  };

  const spotlightSize = 200;

  return (
    <div
      ref={divRef}
      className={cn(
        "relative w-full overflow-hidden rounded-md",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}; 