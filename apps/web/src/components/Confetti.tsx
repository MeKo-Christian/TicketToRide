import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

interface ConfettiProps {
  colors: string[];
  count?: number;
  durationSeconds?: number;
}

export function Confetti({ colors, count = 80, durationSeconds = 3.2 }: ConfettiProps) {
  const reduce = useReducedMotion();

  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length] ?? '#facc15',
      delay: Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 40,
      rotation: Math.random() * 720 - 360,
      size: 6 + Math.random() * 8,
      duration: durationSeconds * (0.75 + Math.random() * 0.5),
    }));
  }, [colors, count, durationSeconds]);

  if (reduce) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: '110vh',
            x: p.drift,
            opacity: [0, 1, 1, 0.9, 0],
            rotate: p.rotation,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}
