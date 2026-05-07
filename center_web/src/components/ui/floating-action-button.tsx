"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className,
}: FloatingActionButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize position (bottom-right)
  useEffect(() => {
    if (!isInitialized && typeof window !== "undefined") {
      const initialX = window.innerWidth - 80; // 80px from right (16px margin + 56px button width + 8px)
      const initialY = window.innerHeight - 80; // 80px from bottom
      setPosition({ x: initialX, y: initialY });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    // Keep button within viewport bounds
    const maxX = window.innerWidth - 64; // 56px button + 8px margin
    const maxY = window.innerHeight - 64;
    
    setPosition({
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY)),
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    
    // If drag was minimal, treat as click
    const touch = e.changedTouches[0];
    const dragDistance = Math.sqrt(
      Math.pow(touch.clientX - (position.x + dragStart.x), 2) +
      Math.pow(touch.clientY - (position.y + dragStart.y), 2)
    );
    
    if (dragDistance < 10) {
      onClick();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;
    
    setPosition({
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY)),
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const clickDistance = Math.sqrt(
      Math.pow(e.clientX - (position.x + dragStart.x), 2) +
      Math.pow(e.clientY - (position.y + dragStart.y), 2)
    );
    
    if (clickDistance < 10) {
      onClick();
    }
    
    setIsDragging(false);
  }, [position.x, position.y, dragStart.x, dragStart.y, onClick]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isInitialized) return null;

  return (
    <button
      ref={buttonRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      aria-label={label}
      className={cn(
        "fixed z-50 touch-none select-none",
        "h-14 w-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90",
        "flex items-center justify-center",
        "transition-shadow duration-200",
        "active:scale-95",
        isDragging ? "cursor-grabbing scale-110 shadow-2xl" : "cursor-grab",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="text-primary-foreground">
        {icon}
      </div>
    </button>
  );
}
