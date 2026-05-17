"use client";
import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsVisible(true);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      // Smooth interpolation for the trail effect
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      setPosition({ x: currentX, y: currentY });
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        className={`fixed pointer-events-none z-[9999] rounded-full mix-blend-screen transition-transform duration-200 ease-out ${isClicking ? 'scale-150 opacity-80' : 'scale-100 opacity-100'}`}
        style={{
          left: position.x,
          top: position.y,
          width: '12px',
          height: '12px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #F0C43D, transparent 70%)',
          boxShadow: '0 0 20px 4px rgba(240,196,61,0.4)',
        }}
      />
      <div 
        className="fixed pointer-events-none z-[9998] rounded-full mix-blend-screen opacity-40 transition-opacity duration-300"
        style={{
          left: position.x,
          top: position.y,
          width: '400px',
          height: '400px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(34,211,238,0.15), rgba(168,85,247,0.05), transparent 60%)',
          filter: 'blur(20px)',
        }}
      />
    </>
  );
}
