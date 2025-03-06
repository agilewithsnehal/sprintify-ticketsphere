
import { useCallback, useRef, useEffect } from 'react';

export function useScrollHandling(scrollContainerRef: React.RefObject<HTMLDivElement>) {
  // Manual scroll functions
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  }, [scrollContainerRef]);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  }, [scrollContainerRef]);

  return { 
    scrollLeft, 
    scrollRight
  };
}
