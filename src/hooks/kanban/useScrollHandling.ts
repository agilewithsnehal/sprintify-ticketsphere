
import { useCallback, useRef, useEffect } from 'react';

export function useScrollHandling(scrollContainerRef: React.RefObject<HTMLDivElement>) {
  // Refs for the timer and scroll speed
  const autoScrollTimerRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollSpeedRef = useRef(25); // Significantly increased base scroll speed

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

  // Auto-scroll when dragging near edges with much more aggressive scrolling
  const startAutoScroll = useCallback((direction: 'left' | 'right', speed = 25) => {
    console.log(`Starting auto-scroll: ${direction} with speed ${speed}`);
    
    // Always clear existing timer first
    if (autoScrollTimerRef.current) {
      window.clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    
    // Set the scroll speed - significantly increased for more responsiveness
    scrollSpeedRef.current = speed;
    isScrollingRef.current = true;
    
    // Start the auto-scroll with higher frequency and speed
    autoScrollTimerRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        if (direction === 'left') {
          scrollContainerRef.current.scrollLeft -= scrollSpeedRef.current;
        } else {
          scrollContainerRef.current.scrollLeft += scrollSpeedRef.current;
        }
      }
    }, 2); // Much higher frequency for smoother scrolling
  }, [scrollContainerRef]);

  const stopAutoScroll = useCallback(() => {
    console.log('Stopping auto-scroll');
    if (autoScrollTimerRef.current) {
      window.clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    isScrollingRef.current = false;
  }, []);

  // Mouse position monitoring for auto-scroll with much wider detection area
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // Much wider edge detection area for more responsive scrolling - 250px from edge
    const leftEdgeThreshold = containerRect.left + 250; 
    const rightEdgeThreshold = containerRect.right - 250;
    
    // Calculate how close to the edge (for variable speed)
    let speed = 25; // Significantly increased base speed
    
    if (mouseX < leftEdgeThreshold) {
      const distance = leftEdgeThreshold - mouseX;
      speed = Math.min(60, 25 + Math.floor(distance / 3)); // Extremely increased max speed and sensitivity
      startAutoScroll('left', speed);
    } else if (mouseX > rightEdgeThreshold) {
      const distance = mouseX - rightEdgeThreshold;
      speed = Math.min(60, 25 + Math.floor(distance / 3)); // Extremely increased max speed and sensitivity
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
