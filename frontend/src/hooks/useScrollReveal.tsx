import { useEffect, useRef } from 'react';

export function useScrollReveal(
  animationClass: string = 'animate-fade-in-up',
  delay: number = 0
) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let timeout: NodeJS.Timeout | null = null;
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          timeout = setTimeout(() => {
            node.classList.add(animationClass);
            node.classList.add('opacity-100');
            node.classList.remove('opacity-0');
          }, delay);
        } else {
          node.classList.remove(animationClass);
          node.classList.remove('opacity-100');
          node.classList.add('opacity-0');
        }
      });
    };
    const observer = new window.IntersectionObserver(handleIntersect, {
      threshold: 0.15
    });
    observer.observe(node);
    // Initial state
    node.classList.add('opacity-0');
    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [animationClass, delay]);

  return ref;
} 