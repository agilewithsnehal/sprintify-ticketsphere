
import { useCallback, useRef, useEffect } from 'react';

export function useScrollHandling(scrollContainerRef: React.RefObject<HTMLDivElement>) {
  // Refs for the timer and scroll speed
  const autoScrollTimerRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollSpeedRef = useRef(15); // Base scroll speed

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) {
        window.clearInterval(autoScrollTimerRef.current);
      }
    };
  }, []);

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

  // Auto-scroll when dragging near edges
  const startAutoScroll = useCallback((direction: 'left' | 'right', speed = 15) => {
    console.log(`Starting auto-scroll: ${direction} with speed ${speed}`);
    
    // Always clear existing timer first
    if (autoScrollTimerRef.current) {
      window.clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    
    // Set the scroll speed
    scrollSpeedRef.current = speed;
    isScrollingRef.current = true;
    
    // Start the auto-scroll with higher frequency for smoother scrolling
    autoScrollTimerRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        if (direction === 'left') {
          scrollContainerRef.current.scrollLeft -= scrollSpeedRef.current;
        } else {
          scrollContainerRef.current.scrollLeft += scrollSpeedRef.current;
        }
      }
    }, 16); // ~60fps for smoother scrolling
  }, [scrollContainerRef]);

  const stopAutoScroll = useCallback(() => {
    console.log('Stopping auto-scroll');
    if (autoScrollTimerRef.current) {
      window.clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    isScrollingRef.current = false;
  }, []);

  // Mouse position monitoring for auto-scroll
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // Edge detection area - 150px from edge
    const leftEdgeThreshold = containerRect.left + 150; 
    const rightEdgeThreshold = containerRect.right - 150;
    
    // Calculate how close to the edge (for variable speed)
    let speed = 15; // Base speed
    
    if (mouseX < leftEdgeThreshold) {
      const distance = leftEdgeThreshold - mouseX;
      speed = Math.min(40, 15 + Math.floor(distance / 5)); // Increase speed based on proximity to edge
      startAutoScroll('left', speed);
    } else if (mouseX > rightEdgeThreshold) {
      const distance = mouseX - rightEdgeThreshold;
      speed = Math.min(40, 15 + Math.floor(distance / 5)); // Increase speed based on proximity to edge
      startAutoScroll('right', speed);
    } else {
      stopAutoScroll();
    }
  }, [scrollContainerRef, startAutoScroll, stopAutoScroll]);

  return { 
    scrollLeft, 
    scrollRight,
    handleDragOver,
    startAutoScroll,
    stopAutoScroll
  };
}
