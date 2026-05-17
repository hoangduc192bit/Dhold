"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorFX() {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${tx - 13}px, ${ty - 13}px, 0)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="cursor-trail hidden md:block" />
      <div ref={orbRef} className={`cursor-orb hidden md:block ${clicking ? "clicking" : ""}`} />
    </>
  );
}
