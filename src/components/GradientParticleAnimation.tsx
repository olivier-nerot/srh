import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface GradientParticleAnimationProps {
  particleCount?: number;
  className?: string;
}

const GradientParticleAnimation: React.FC<GradientParticleAnimationProps> = ({
  particleCount = 50,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize particles
  const initializeParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`
      });
    }
    
    particlesRef.current = particles;
  };

  // Sample gradient color at position
  const sampleGradient = (x: number, y: number, width: number, height: number) => {
    const progressX = x / width;
    const progressY = y / height;
    
    // Simulate the gradient: rgba(0, 51, 102, 0.7) to rgba(0, 102, 204, 0.7)
    const startColor = { r: 0, g: 51, b: 102 };
    const endColor = { r: 0, g: 102, b: 204 };
    
    // Diagonal gradient influence
    const gradientProgress = (progressX + progressY) / 2;
    
    const r = startColor.r + (endColor.r - startColor.r) * gradientProgress;
    const g = startColor.g + (endColor.g - startColor.g) * gradientProgress;
    const b = startColor.b + (endColor.b - startColor.b) * gradientProgress;
    
    // Calculate intensity (brightness)
    const intensity = (r + g + b) / (3 * 255);
    
    return { r, g, b, intensity, gradientProgress };
  };

  // Calculate movement force based on gradient
  const getGradientForce = (particle: Particle, width: number, height: number) => {
    const current = sampleGradient(particle.x, particle.y, width, height);
    
    // Sample nearby positions to get gradient direction
    const sampleRadius = 20;
    const right = sampleGradient(
      Math.min(particle.x + sampleRadius, width), 
      particle.y, 
      width, 
      height
    );
    const down = sampleGradient(
      particle.x, 
      Math.min(particle.y + sampleRadius, height), 
      width, 
      height
    );
    
    // Calculate gradient vector (direction of increasing intensity)
    const gradientX = right.intensity - current.intensity;
    const gradientY = down.intensity - current.intensity;
    
    // Force particles to move along gradient flow
    const forceMultiplier = 0.03;
    
    return {
      fx: gradientX * forceMultiplier,
      fy: gradientY * forceMultiplier,
      intensity: current.intensity
    };
  };

  // Update particle physics
  const updateParticles = (width: number, height: number) => {
    particlesRef.current.forEach((particle) => {
      const gradient = getGradientForce(particle, width, height);
      
      // Apply gradient force
      particle.vx += gradient.fx;
      particle.vy += gradient.fy;
      
      // Add some random movement
      particle.vx += (Math.random() - 0.5) * 0.03;
      particle.vy += (Math.random() - 0.5) * 0.03;
      
      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges with some randomness
      if (particle.x <= 0 || particle.x >= width) {
        particle.vx = -particle.vx * (0.7 + Math.random() * 0.3);
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      
      if (particle.y <= 0 || particle.y >= height) {
        particle.vy = -particle.vy * (0.7 + Math.random() * 0.3);
        particle.y = Math.max(0, Math.min(height, particle.y));
      }
      
      // Bounce when hitting high intensity gradient areas
      if (gradient.intensity > 0.4) {
        const bounceForce = (gradient.intensity - 0.4) * 0.15;
        particle.vx += (Math.random() - 0.5) * bounceForce;
        particle.vy += (Math.random() - 0.5) * bounceForce;
      }
      
      // Update opacity based on gradient intensity
      particle.opacity = 0.3 + gradient.intensity * 0.7;
    });
  };

  // Render particles
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    particlesRef.current.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fill();
      
      ctx.restore();
    });
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    updateParticles(canvas.width, canvas.height);
    renderParticles(ctx);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    
    const { offsetWidth, offsetHeight } = canvas.parentElement;
    canvas.width = offsetWidth;
    canvas.height = offsetHeight;
    
    initializeParticles(offsetWidth, offsetHeight);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      return;
    }
    
    // Initial setup
    handleResize();
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Handle window resize with debouncing
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        mixBlendMode: 'screen',
        opacity: 0.8
      }}
    />
  );
};

export default GradientParticleAnimation;