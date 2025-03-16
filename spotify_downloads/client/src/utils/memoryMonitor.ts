// Add type definition for memory in Performance interface
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

/**
 * Monitor and log memory usage of the application
 * @param label Optional label to identify the log
 * @returns The current memory usage in MB
 */
export const monitorMemory = (label = 'Memory usage'): number | null => {
  if ('performance' in window && window.performance.memory) {
    const usedMB = window.performance.memory.usedJSHeapSize / 1048576; // Convert to MB
    const totalMB = window.performance.memory.totalJSHeapSize / 1048576;
    const limitMB = window.performance.memory.jsHeapSizeLimit / 1048576;
    
    console.log(`${label}: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (Limit: ${limitMB.toFixed(2)}MB)`);
    return usedMB;
  }
  return null;
};

/**
 * Start periodic memory monitoring
 * @param intervalMs Interval in milliseconds
 * @returns A function to stop monitoring
 */
export const startMemoryMonitoring = (intervalMs = 5000): () => void => {
  const intervalId = setInterval(() => {
    monitorMemory('Periodic memory check');
  }, intervalMs);
  
  return () => {
    clearInterval(intervalId);
  };
}; 