import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    // Skip on touch devices or reduced motion
    if ('ontouchstart' in window) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const render = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: mx, y: my } = mouseRef.current;
      const particles = particlesRef.current;

      // Spawn new particles every 2 frames
      if (frameRef.current % 2 === 0 && mx > 0 && my > 0) {
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          if (particles.length >= 28) break;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.3 + Math.random() * 0.8;
          particles.push({
            x: mx + (Math.random() - 0.5) * 8,
            y: my + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: -1.2 - Math.random() * 1.5, // float upward like embers
            life: 40 + Math.random() * 30,
            maxLife: 40 + Math.random() * 30,
            size: 1.5 + Math.random() * 2.5,
            hue: 35 + Math.random() * 15, // gold-amber range
          });
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.985;
        // Slight drift
        p.vx += (Math.random() - 0.5) * 0.15;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const ratio = p.life / p.maxLife;
        const alpha = ratio * 0.7;
        const currentSize = p.size * (0.4 + ratio * 0.6);

        ctx.save();
        ctx.globalAlpha = alpha;

        // Glow layer
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 85%, 70%, ${alpha * 0.6})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = `hsla(${p.hue}, 85%, 78%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Don't render canvas on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <canvas
      ref={canvasRef}
      className="cursor-particles-canvas"
      aria-hidden="true"
    />
  );
}

