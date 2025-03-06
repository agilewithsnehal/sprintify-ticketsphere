
import { useCallback, useRef, useEffect } from 'react';

export function useScrollHandling(scrollContainerRef: React.RefObject<HTMLDivElement>) {
  // Refs for the timer and scroll speed
  const autoScrollTimerRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollSpeedRef = useRef(5); // Base scroll speed

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
  const startAutoScroll = useCallback((direction: 'left' | 'right', speed = 5) => {
    console.log(`Starting auto-scroll: ${direction} with speed ${speed}`);
    
    if (isScrollingRef.current) {
      return; // Already scrolling
    }
    
    // Clear any existing timer
    if (autoScrollTimerRef.current) {
      window.clearInterval(autoScrollTimerRef.current);
    }
    
    // Set the scroll speed
    scrollSpeedRef.current = speed;
    isScrollingRef.current = true;
    
    // Start the auto-scroll
    autoScrollTimerRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        if (direction === 'left') {
          scrollContainerRef.current.scrollLeft -= scrollSpeedRef.current;
        } else {
          scrollContainerRef.current.scrollLeft += scrollSpeedRef.current;
        }
      }
    }, 16); // ~60fps
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
    
    const leftEdgeThreshold = containerRect.left + 100; // 100px from left edge
    const rightEdgeThreshold = containerRect.right - 100; // 100px from right edge
    
    // Calculate how close to the edge (for variable speed)
    let speed = 5; // Base speed
    
    if (mouseX < leftEdgeThreshold) {
      const distance = leftEdgeThreshold - mouseX;
      speed = Math.min(15, 5 + Math.floor(distance / 20)); // Increase speed as you get closer to edge
      startAutoScroll('left', speed);
    } else if (mouseX > rightEdgeThreshold) {
      const distance = mouseX - rightEdgeThreshold;
      speed = Math.min(15, 5 + Math.floor(distance / 20)); // Increase speed as you get closer to edge
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
