'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#22D3C5', '#F43F9D', '#FFCE1F', '#2FD573', '#8B5CF6', '#ffffff'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
}

/**
 * Lightweight canvas confetti burst for winner screens. Fires once on mount:
 * two cannons from the bottom corners shoot pieces up toward the middle.
 * Respects prefers-reduced-motion (renders nothing).
 */
export function Confetti({ pieces = 170, duration = 4200 }: { pieces?: number; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const parts: Piece[] = Array.from({ length: pieces }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 50; // degrees, up-and-inward
      const speed = 9 + Math.random() * 8;
      const rad = (angle * Math.PI) / 180;
      return {
        x: fromLeft ? -10 : W + 10,
        y: H * (0.65 + Math.random() * 0.3),
        vx: Math.abs(Math.cos(rad)) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(rad) * speed,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        w: 7 + Math.random() * 6,
        h: 4 + Math.random() * 5,
        color: COLORS[i % COLORS.length],
        round: Math.random() < 0.25,
      };
    });

    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W, H);
      const fade = elapsed > duration * 0.7 ? 1 - (elapsed - duration * 0.7) / (duration * 0.3) : 1;
      ctx.globalAlpha = Math.max(0, fade);

      for (const p of parts) {
        p.vy += 0.14; // gravity
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (elapsed < duration) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pieces, duration]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true" />;
}
