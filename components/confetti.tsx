'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  gravity: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const colors = [
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
];

export function Confetti({
  active,
  duration = 3000,
  particleCount = 50,
  onComplete,
}: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Create initial particles
    const newParticles: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocityX: (Math.random() - 0.5) * 8,
      velocityY: Math.random() * 3 + 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: Math.random() * 0.3 + 0.1,
    }));

    setParticles(newParticles);
    setIsAnimating(true);

    // Animation loop
    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        setIsAnimating(false);
        setParticles([]);
        onComplete?.();
        return;
      }

      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          rotation: particle.rotation + particle.rotationSpeed,
          velocityY: particle.velocityY + particle.gravity,
        }))
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [active, duration, particleCount, onComplete]);

  if (!isAnimating || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 opacity-90"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
}

// Burst confetti from a specific position (like a button)
export function ConfettiBurst({
  active,
  x,
  y,
  duration = 2000,
  particleCount = 30,
  onComplete,
}: ConfettiProps & { x: number; y: number }) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Create particles that burst from a specific point
    const newParticles: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = Math.random() * 8 + 4;

      return {
        id: i,
        x,
        y,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.6 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocityX: Math.cos(angle) * velocity + (Math.random() - 0.5) * 2,
        velocityY: Math.sin(angle) * velocity - Math.random() * 3,
        rotationSpeed: (Math.random() - 0.5) * 15,
        gravity: Math.random() * 0.4 + 0.2,
      };
    });

    setParticles(newParticles);
    setIsAnimating(true);

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        setIsAnimating(false);
        setParticles([]);
        onComplete?.();
        return;
      }

      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          rotation: particle.rotation + particle.rotationSpeed,
          velocityX: particle.velocityX * 0.99, // Air resistance
          velocityY: particle.velocityY + particle.gravity,
        }))
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [active, x, y, duration, particleCount, onComplete]);

  if (!isAnimating || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 opacity-80"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.3 ? '50%' : '0%',
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
}
