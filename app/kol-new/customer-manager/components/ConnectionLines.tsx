"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  cardRef: React.RefObject<HTMLDivElement | null>;
}

type Point = { x: number; y: number };

export default function ConnectionLines({ cardRef }: Props) {
  const [points, setPoints] = useState<Point[]>([]);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    function calc() {
      if (!cardRef.current) return;
      const sections = cardRef.current.querySelectorAll<HTMLDivElement>(".stage-block");
      const newPoints: Point[] = [];
      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cardRect = cardRef.current!.getBoundingClientRect();
        newPoints.push({
          x: rect.left - cardRect.left + rect.width / 2,
          y: rect.top - cardRect.top + rect.height / 2,
        });
      });
      setPoints(newPoints);
    }

    calc();

    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new ResizeObserver(calc);
    if (cardRef.current) observerRef.current.observe(cardRef.current);

    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
      observerRef.current?.disconnect();
    };
  }, [cardRef]);

  if (points.length < 2) return null;

  const path = points
    .map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <svg className="absolute inset-0 pointer-events-none hidden md:block" width="100%" height="100%">
      <path d={path} stroke="#A3A3A3" strokeWidth={1} fill="none" />
    </svg>
  );
} 