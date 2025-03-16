import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseAudioPlayerProps {
  audioRef: RefObject<HTMLAudioElement>;
  url: string;
  onEnd?: () => void;
  volume?: number;
  createAudioContext?: (url?: string) => Promise<boolean> | boolean;
  audioContext: AudioContext | null;
  safeResetAudioContext: () => void;
}

/**
 * Custom hook to control audio playback
 */
export const useAudioPlayer = ({
  audioRef,
  url,
  onEnd,
  volume = 0.8,
  createAudioContext,
  audioContext,
  safeResetAudioContext
}: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utility function for better URL handling
  const sanitizeUrl = useCallback((url: string) => {
    if (!url) {
      console.error('Empty URL provided to sanitizeUrl');
      return '';
    }
    
    console.log('Sanitizing URL:', url);
    
    // If it's already an HTTP URL, return it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's already a server API path, return it as is
    if (url.startsWith('/api/')) {
      return url;
    }
    
    // If it's a Windows path, ensure it's properly formatted
    // Replace backslashes with forward slashes for the URL
    let formattedPath = url.replace(/\\/g, '/');
    
    // Make sure the path is properly encoded for URLs
    formattedPath = encodeURIComponent(formattedPath);
    
    // Return the full API URL
    const finalUrl = `/api/audio?path=${formattedPath}`;
    console.log('Sanitized URL:', finalUrl);
    return finalUrl;
  }, []);

  // Update the URL handling effect for better playback
  useEffect(() => {
    if (!url) {
      console.log('No URL provided');
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    console.log('Loading track URL:', url);
    
    // Reset audio context to ensure clean playback for the new track
    safeResetAudioContext();
    
    // Create a new Audio element instead of reusing
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found');
      if (isMounted) setError('Audio player initialization failed');
      return;
    }
    
    // Properly clean up previous audio
    try {
      audio.pause();
      audio.src = '';
      audio.removeAttribute('src');
      audio.load();
    } catch (err) {
      console.error('Error cleaning up previous audio:', err);
    }
    
    // Function to handle successful load
    const handleSuccess = () => {
      if (!isMounted) return;
      
      setLoading(false);
      setIsPlaying(true);
      console.log('Track loaded successfully');
    };
    
    // Function to handle errors
    const handleFailure = (err: any) => {
      if (!isMounted) return;
      
      console.error('Error playing track:', err);
      setLoading(false);
      setIsPlaying(false);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = String(err);
      }
      
      setError(`Error loading audio: ${errorMessage}`);
    };
    
    // Small delay to ensure proper cleanup
    setTimeout(() => {
      if (!isMounted) return;
      
      try {
        // Set new audio source
        const sanitizedUrl = sanitizeUrl(url);
        console.log('Setting audio source to:', sanitizedUrl);
        
        // Check if URL is valid
        if (!sanitizedUrl) {
          handleFailure('Invalid audio URL');
          return;
        }
        
        audio.src = sanitizedUrl;
        audio.volume = volume;
        audio.crossOrigin = 'anonymous'; // Ensure this is set for remote resources
        audio.load();
        
        // Try to play automatically
        console.log('Attempting to play audio');
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(handleSuccess)
            .catch((err) => {
              console.error('Play failed, retrying once:', err);
              
              // Some browsers require user interaction - if play fails, we'll try once more after a short delay
              setTimeout(() => {
                if (!audio || !isMounted) return;
                
                const retryPlay = audio.play();
                if (retryPlay !== undefined) {
                  retryPlay.then(handleSuccess).catch(handleFailure);
                }
              }, 300);
            });
        } else {
          // For older browsers that don't return a promise
          handleSuccess();
        }
      } catch (err) {
        handleFailure(err);
      }
    }, 200); // Slightly longer delay
    
    return () => {
      isMounted = false;
      // Don't stop playback on cleanup, let the new track take over
    };
  }, [url, volume, safeResetAudioContext, audioRef, sanitizeUrl]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [audioRef]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setLoading(false);
      
      // If the audio element has autoplay set
      if (audioRef.current.autoplay) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log('Auto-play successful after metadata loaded');
            })
            .catch(error => {
              console.error('Error auto-playing after metadata loaded:', error);
            });
        }
      }
    }
  }, [audioRef]);

  // Handle track ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    
    if (onEnd) {
      onEnd();
    }
  }, [audioRef, onEnd]);

  // Handle errors
  const handleError = useCallback(() => {
    console.error('Audio error');
    setError('Error loading audio. Please try again or select another track.');
    setLoading(false);
    setIsPlaying(false);
  }, []);

  // Add event listeners with cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleError, audioRef]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('Trying to play audio...');
      
      // Reset audio context if needed to ensure fresh playback
      if (createAudioContext && (!audioContext || audioContext.state === 'closed')) {
        console.log('Audio context not available or closed, reinitializing...');
        createAudioContext(url);
      }
      
      try {
        // Make sure we have a source
        if (!audioRef.current.src || audioRef.current.src === 'about:blank') {
          if (url) {
            const sanitizedUrl = sanitizeUrl(url);
            audioRef.current.src = sanitizedUrl;
            audioRef.current.load();
          } else {
            setError('No audio source available');
            return;
          }
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Playback started successfully');
              setIsPlaying(true);
              setError(null);
            })
            .catch(error => {
              console.error('Playback error:', error);
              setError('Playback error. Please try again.');
              setIsPlaying(false);
            });
        }
      } catch (error) {
        console.error('Exception during play attempt:', error);
        setError('Error starting playback');
      }
    }
  }, [isPlaying, audioContext, createAudioContext, url, audioRef, sanitizeUrl]);

  // Handle seeking
  const handleSeek = useCallback((seekTime: number) => {
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  }, [audioRef]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, [audioRef]);

  return {
    isPlaying,
    currentTime,
    duration,
    loading,
    error,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    sanitizeUrl
  };
};

export default useAudioPlayer; 