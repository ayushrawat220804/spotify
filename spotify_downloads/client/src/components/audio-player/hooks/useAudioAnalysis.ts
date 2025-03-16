import { useState, useEffect, MutableRefObject } from 'react';

/**
 * Custom hook to analyze audio frequencies and extract bass data
 */
export const useAudioAnalysis = (
  analyser: AnalyserNode | null,
  isPlaying: boolean,
  animationFrameRef: MutableRefObject<number | null>
) => {
  const [bassValue, setBassValue] = useState<number>(0);

  // Audio analysis loop with improved bass detection
  useEffect(() => {
    if (!analyser || !isPlaying) {
      // Reset bass value when not playing
      if (!isPlaying) {
        setBassValue(0);
      }
      return;
    }
    
    try {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const analyzeBass = () => {
        try {
          analyser.getByteFrequencyData(dataArray);
          
          // Focus more precisely on bass frequencies (typically 20-150Hz)
          // For 44.1kHz sample rate with 256 FFT size, first ~8 bins cover roughly 0-170Hz
          const bassRange = 8; 
          let bassSum = 0;
          let maxBassValue = 0;
          
          // Sum the bass frequency bins with emphasis on the lower end
          for (let i = 0; i < bassRange; i++) {
            const value = dataArray[i];
            bassSum += value;
            maxBassValue = Math.max(maxBassValue, value);
          }
          
          // Normalize between 0 and 1, with more pronounced range
          // Using both average and max for more dynamic response
          const avgBass = bassSum / (bassRange * 255);
          const normalizedBass = Math.min(1, (avgBass * 0.7 + (maxBassValue / 255) * 0.3));
          
          // Apply non-linear scaling to make subtle differences more noticeable
          const scaledBass = Math.pow(normalizedBass, 0.8) * 0.8;
          
          setBassValue(scaledBass);
          
          // Continue the animation loop
          animationFrameRef.current = requestAnimationFrame(analyzeBass);
        } catch (err) {
          console.error('Error in audio analysis:', err);
          setBassValue(0);
        }
      };
      
      // Start the analysis loop
      analyzeBass();
    } catch (err) {
      console.error('Error setting up audio analysis loop:', err);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [analyser, isPlaying, animationFrameRef]);

  return { bassValue };
};

export default useAudioAnalysis; 