import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  type: 'listening' | 'speaking' | 'idle';
  className?: string;
}

export const AudioVisualizer = ({ isActive, type, className = '' }: AudioVisualizerProps) => {
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const animateBars = () => {
      barsRef.current.forEach((bar, index) => {
        if (bar) {
          const randomHeight = Math.random() * 40 + 10;
          const delay = index * 100;
          
          setTimeout(() => {
            bar.style.height = `${randomHeight}px`;
          }, delay);
        }
      });
    };

    const interval = setInterval(animateBars, type === 'listening' ? 300 : 150);
    return () => clearInterval(interval);
  }, [isActive, type]);

  const getBarColor = () => {
    switch (type) {
      case 'listening':
        return 'bg-therapeutic-pulse';
      case 'speaking':
        return 'bg-therapeutic-warm';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className={`flex items-end justify-center space-x-1 ${className}`}>
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el;
          }}
          className={`w-1 rounded-full transition-all duration-300 ease-out ${getBarColor()}`}
          style={{ 
            height: isActive ? '20px' : '8px',
            minHeight: '8px'
          }}
        />
      ))}
    </div>
  );
};