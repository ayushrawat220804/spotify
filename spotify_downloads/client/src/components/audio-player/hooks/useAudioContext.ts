import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to manage Web Audio API context and related resources
 */
export const useAudioContext = (audioRef: React.RefObject<HTMLAudioElement>) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Safely close an AudioContext
   */
  const safelyCloseAudioContext = useCallback((context: AudioContext | null) => {
    if (!context) return Promise.resolve();
    
    try {
      if (context.state === 'closed') {
        console.log('Context already closed, no action needed');
        return Promise.resolve();
      }
      
      console.log('Safely closing audio context...');
      return context.close().catch(err => {
        console.error('Error during safe context close:', err);
      });
    } catch (error) {
      console.error('Exception during safe context close:', error);
      return Promise.resolve();
    }
  }, []);
  
  /**
   * Reset and clean up audio context and related resources
   */
  const resetAudioContext = useCallback(() => {
    console.log('Resetting audio context...');
    
    // Clean up existing audio processing chain
    if (audioSource) {
      try {
        audioSource.disconnect();
      } catch (e) {
        console.error('Error disconnecting audio source', e);
      }
      setAudioSource(null);
    }
    
    if (analyser) {
      try {
        analyser.disconnect();
      } catch (e) {
        console.error('Error disconnecting analyser', e);
      }
      setAnalyser(null);
    }
    
    if (audioContext) {
      try {
        // Check if the AudioContext is not already closed before trying to close it
        if (audioContext.state !== 'closed') {
          console.log('Closing AudioContext, current state:', audioContext.state);
          audioContext.close().catch(err => {
            console.error('Error closing audio context:', err);
          });
        } else {
          console.log('AudioContext already closed, skipping close operation');
        }
      } catch (e) {
        console.error('Error with audio context:', e);
      }
      setAudioContext(null);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [audioContext, audioSource, analyser]);

  /**
   * Modified reset function that uses the safe close helper
   */
  const safeResetAudioContext = useCallback(() => {
    console.log('Safely resetting audio context...');
    
    // Clean up existing audio processing chain
    if (audioSource) {
      try {
        audioSource.disconnect();
      } catch (e) {
        console.error('Error disconnecting audio source', e);
      }
      setAudioSource(null);
    }
    
    if (analyser) {
      try {
        analyser.disconnect();
      } catch (e) {
        console.error('Error disconnecting analyser', e);
      }
      setAnalyser(null);
    }
    
    // Use the safe close helper
    if (audioContext) {
      safelyCloseAudioContext(audioContext)
        .then(() => {
          setAudioContext(null);
          console.log('Audio context safely closed and reset');
        });
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [audioContext, audioSource, analyser, safelyCloseAudioContext]);

  /**
   * Create a new audio context and analyzer
   */
  const createAudioContext = useCallback((url?: string) => {
    console.log('Creating new audio context...');
    
    // First safely reset any existing context
    if (audioContext || audioSource || analyser) {
      safeResetAudioContext();
      
      // Wait a small amount of time to ensure context is properly reset
      // This helps prevent errors when creating a new context immediately after closing an old one
      return new Promise<boolean>(resolve => {
        setTimeout(() => {
          createNewContext(url).then(resolve);
        }, 100);
      });
    } else {
      return createNewContext(url);
    }
    
    // Helper function to create a new context
    async function createNewContext(sourceUrl?: string): Promise<boolean> {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.error('AudioContext not supported in this browser');
          return false;
        }
        
        const audio = audioRef.current;
        if (!audio) {
          console.error('Audio element not found');
          return false;
        }
        
        // Check if audio has a valid source
        if (!audio.src || audio.src === 'about:blank') {
          console.warn('Audio element has no source, checking URL...');
          
          if (sourceUrl) {
            console.log('Setting audio source from URL before creating context');
            audio.src = sourceUrl;
            audio.load();
          } else {
            console.error('No URL available for audio source');
            return false;
          }
        }
        
        // Create new context
        const newAudioContext = new AudioContext();
        console.log('New AudioContext created, state:', newAudioContext.state);
        
        // Create new analyzer
        const newAnalyser = newAudioContext.createAnalyser();
        newAnalyser.fftSize = 256;
        newAnalyser.smoothingTimeConstant = 0.7;
        
        // Connect audio element to the analyser
        let source;
        try {
          source = newAudioContext.createMediaElementSource(audio);
        } catch (err) {
          // Type cast the unknown error to access its properties
          const error = err as { message?: string };
          
          // Handle the case where the audio element is already connected
          if (error?.message && error.message.includes('already connected')) {
            console.warn('Audio element already connected, trying alternative approach...');
            
            // First safely close any existing context
            if (audioContext) {
              await safelyCloseAudioContext(audioContext);
              setAudioContext(null);
            }
            
            // Create a fresh audio element to work with
            try {
              // Temporarily disconnect the audio element
              audio.pause();
              
              // Create a new audio context and try again with a small delay
              const retryContext = new AudioContext();
              const retryAnalyser = retryContext.createAnalyser();
              retryAnalyser.fftSize = 256;
              retryAnalyser.smoothingTimeConstant = 0.7;
              
              // Try with the existing audio element
              source = retryContext.createMediaElementSource(audio);
              source.connect(retryAnalyser);
              retryAnalyser.connect(retryContext.destination);
              
              // Update state with new components
              setAudioContext(retryContext);
              setAnalyser(retryAnalyser);
              setAudioSource(source);
              
              console.log('Successfully created audio context on retry');
              return true;
            } catch (retryError) {
              console.error('Failed on retry to create audio context:', retryError);
              return false;
            }
          } else {
            console.error('Failed to create media element source:', error);
            return false;
          }
        }
        
        source.connect(newAnalyser);
        newAnalyser.connect(newAudioContext.destination);
        
        // Update state with new components
        setAudioContext(newAudioContext);
        setAnalyser(newAnalyser);
        setAudioSource(source);
        
        // Resume context if needed
        if (newAudioContext.state === 'suspended') {
          try {
            await newAudioContext.resume();
            console.log('AudioContext resumed successfully');
          } catch (err) {
            console.error('Failed to resume AudioContext:', err);
          }
        }
        
        console.log('Audio context created and initialized successfully');
        return true;
      } catch (err) {
        console.error('Failed to create audio context:', err);
        return false;
      }
    }
  }, [audioRef, audioContext, audioSource, analyser, safeResetAudioContext, safelyCloseAudioContext]);

  return {
    audioContext,
    analyser,
    audioSource,
    animationFrameRef,
    resetAudioContext,
    safeResetAudioContext,
    safelyCloseAudioContext,
    createAudioContext,
    setAudioContext,
    setAnalyser,
    setAudioSource
  };
};

export default useAudioContext; 