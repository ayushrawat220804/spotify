import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { IoMdExpand, IoMdContract } from 'react-icons/io';
import { 
  BiSkipPrevious, 
  BiSkipNext, 
  BiRepeat, 
  BiShuffle, 
  BiPlayCircle, 
  BiPauseCircle,
  BiVolumeFull, 
  BiVolumeLow, 
  BiVolumeMute 
} from 'react-icons/bi';
import { TrackMetadata } from '../types';

interface EnhancedAudioPlayerProps {
  url: string;
  metadata?: TrackMetadata;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onShuffleChange?: (isShuffled: boolean) => void;
}

const defaultCoverArt = '/default-cover.svg';

interface ProgressBarProps {
  value: number;
  max: number;
}

interface VolumeSliderProps {
  value: number;
  max: number;
}

const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  url,
  metadata,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onShuffleChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [dominantColor, setDominantColor] = useState('#121212');
  const [isShuffled, setIsShuffled] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [bassValue, setBassValue] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Add a utility function to reset and recreate the audio context when needed
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
    
    setBassValue(0);
    console.log('Audio context reset successfully');
  }, [audioContext, audioSource, analyser]);

  // Add a safer audio context close helper
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
  
  // Modified reset function that uses the safe close helper
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
    
    setBassValue(0);
  }, [audioContext, audioSource, analyser, safelyCloseAudioContext]);

  // Add a safer audio context creation function to prevent multiple instances
  const createAudioContext = useCallback(() => {
    console.log('Creating new audio context...');
    
    // First safely reset any existing context
    if (audioContext || audioSource || analyser) {
      safeResetAudioContext();
      
      // Wait a small amount of time to ensure context is properly reset
      // This helps prevent errors when creating a new context immediately after closing an old one
      return new Promise<boolean>(resolve => {
        setTimeout(() => {
          createNewContext().then(resolve);
        }, 100);
      });
    } else {
      return createNewContext();
    }
    
    // Helper function to create a new context
    async function createNewContext(): Promise<boolean> {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.error('AudioContext not supported in this browser');
          setError('Your browser does not support audio visualization');
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
          
          if (url) {
            console.log('Setting audio source from URL before creating context');
            const sanitizedUrl = sanitizeUrl(url);
            audio.src = sanitizedUrl;
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
  }, [audioRef, audioContext, audioSource, analyser, url, safeResetAudioContext, safelyCloseAudioContext]);

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
  }, [url, volume, safeResetAudioContext]);

  // Simple and efficient color extraction
  useEffect(() => {
    if (!metadata?.coverArt) return;
    
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      if (!isMounted) return;
      
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: true
        });
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1).data;
          const r = imageData[0];
          const g = imageData[1];
          const b = imageData[2];
          setDominantColor(`rgb(${r * 0.6}, ${g * 0.6}, ${b * 0.6})`);
        }
        
        canvas.remove();
      } catch (e) {
        console.error('Error extracting color:', e);
      }
    };
    
    img.onerror = () => {
      if (isMounted) {
        setDominantColor('#121212');
      }
    };
    
    img.src = metadata.coverArt;
    
    return () => {
      isMounted = false;
      img.src = '';
    };
  }, [metadata?.coverArt]);

  // Update the play/pause handling:
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('Trying to play audio...');
      
      // Reset audio context if needed to ensure fresh playback
      if (!audioContext || audioContext.state === 'closed') {
        console.log('Audio context not available or closed, reinitializing...');
        const success = createAudioContext();
        if (!success) {
          console.log('Failed to create audio context, trying simple play');
        }
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
  }, [isPlaying, audioContext, createAudioContext, url]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setLoading(false);
      
      // If the audio element has autoplay set (from App.tsx navigation)
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
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    
    if (repeatMode === 2) {
      // Repeat one
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(console.error);
        }
      }
    } else if (repeatMode === 1 && hasNext && onNext) {
      // Repeat all - go to next track
      onNext();
    } else if (repeatMode === 1 && !hasNext && hasPrevious && onPrevious) {
      // If at end of playlist and repeating all, go back to first track
      onPrevious();
    } else if (hasNext && onNext) {
      // No repeat, but there's a next track - play it
      onNext();
    }
  }, [repeatMode, hasNext, hasPrevious, onNext, onPrevious]);

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
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleError]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      playerRef.current?.requestFullscreen()
        .catch(err => console.error('Error enabling full-screen mode:', err));
    } else {
      document.exitFullscreen()
        .catch(err => console.error('Error exiting full-screen mode:', err));
    }
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const toggleShuffle = () => {
    const newShuffleState = !isShuffled;
    setIsShuffled(newShuffleState);
    if (onShuffleChange) {
      onShuffleChange(newShuffleState);
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Add a useEffect to handle track changes and maintain playback state
  useEffect(() => {
    // When the URL changes (new track is loaded)
    if (url && audioRef.current) {
      // If there was a previous track playing
      if (isPlaying) {
        // Pre-load the audio
        audioRef.current.load();
        // Once metadata is loaded, start playing
        const playNewTrack = () => {
          const playPromise = audioRef.current?.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error auto-playing next track:', error);
            });
          }
        };
        
        // Listen for the metadata loaded event once
        const handleLoaded = () => {
          playNewTrack();
          audioRef.current?.removeEventListener('loadedmetadata', handleLoaded);
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleLoaded);
      }
    }
  }, [url, isPlaying]);

  // Add this useEffect to handle auto-play when the url changes
  useEffect(() => {
    if (!url || !audioRef.current) return;
    
    console.log('URL changed, attempting to play:', url);
    
    // Reset audio context to ensure clean playback
    safeResetAudioContext();
    
    // Set a short timeout to allow the audio element to update
    const timer = setTimeout(() => {
      if (!audioRef.current) return;
      
      try {
        // Make sure we have a valid source
        if (!audioRef.current.src || audioRef.current.src === 'about:blank') {
          console.log('No valid source, setting URL and loading');
          const sanitizedUrl = sanitizeUrl(url);
          audioRef.current.src = sanitizedUrl;
          audioRef.current.load();
        }
        
        console.log('Attempting to play after URL change, current src:', audioRef.current.src);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Auto-play successful after URL change');
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Auto-play failed after URL change:', err);
              // Try to initialize audio context anyway (might help with playback)
              if (!audioContext || audioContext.state === 'closed') {
                console.log('Creating new audio context after failed play attempt');
                createAudioContext();
              }
            });
        }
      } catch (err) {
        console.error('Error during auto-play after URL change:', err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [url, safeResetAudioContext, createAudioContext, audioContext]);

  // Add this useEffect to handle full screen state changes
  useEffect(() => {
    // Show particles with a delay after entering full screen
    if (isFullScreen) {
      const timer = setTimeout(() => {
        setShowParticles(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowParticles(false);
    }
  }, [isFullScreen]);

  // Initialize Web Audio API with improved error handling and retries
  useEffect(() => {
    // Only initialize when playing to avoid autoplay restrictions
    if (!isPlaying || !audioRef.current) return;
    
    let retryCount = 0;
    const maxRetries = 2;
    
    const initializeAudioVisualization = () => {
      try {
        console.log('Initializing audio visualization, attempt:', retryCount + 1);
        
        // If we already have an audio context that's in a good state, use it
        if (audioContext && audioSource && analyser && audioContext.state !== 'closed') {
          console.log('Using existing audio context, state:', audioContext.state);
          
          // Just make sure it's running
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(err => {
              console.error('Error resuming existing audio context:', err);
            });
          }
          return;
        }
        
        // Otherwise create a new audio context
        const success = createAudioContext();
        
        // If creation failed and we have retries left, try again after a delay
        if (!success && retryCount < maxRetries) {
          retryCount++;
          console.log(`Audio context creation failed, retrying in 300ms (${retryCount}/${maxRetries})`);
          setTimeout(initializeAudioVisualization, 300);
        }
      } catch (err) {
        console.error('Error in audio visualization initialization:', err);
        
        // Try to recover with a delay if we have retries left
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Error in initialization, retrying in 300ms (${retryCount}/${maxRetries})`);
          setTimeout(initializeAudioVisualization, 300);
        }
      }
    };
    
    // Start the initialization process
    initializeAudioVisualization();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, audioRef, audioContext, analyser, audioSource, createAudioContext]);

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
  }, [analyser, isPlaying]);

  // Reset audio context when component unmounts
  useEffect(() => {
    return () => {
      // Use our utility function for proper cleanup
      safeResetAudioContext();
      
      // Additionally clean up the audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    };
  }, [safeResetAudioContext]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <BiVolumeMute size={24} />;
    if (volume < 0.5) return <BiVolumeLow size={24} />;
    return <BiVolumeFull size={24} />;
  };

  // Add utility function for better URL handling
  const sanitizeUrl = (url: string) => {
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
  };

  return (
    <PlayerContainer ref={playerRef} dominantColor={dominantColor} isFullScreen={isFullScreen}>
      {isFullScreen && metadata?.coverArt && (
        <>
          <FullScreenBackground coverArt={metadata.coverArt} />
          <BloomOverlay />
          {showParticles && <Particles />}
          <PulsingGlow dominantColor={dominantColor} bassValue={bassValue} />
        </>
      )}

      <PlayerContent isFullScreen={isFullScreen}>
        <AlbumArtContainer isFullScreen={isFullScreen}>
          <AlbumArt 
            isFullScreen={isFullScreen}
            src={metadata?.coverArt || defaultCoverArt} 
            alt={`${metadata?.album || 'Album'} cover`}
            onError={(e) => {
              e.currentTarget.src = defaultCoverArt;
            }}
            bassValue={bassValue}
          />
          {isPlaying && <BassRipple bassValue={bassValue} />}
        </AlbumArtContainer>

        <TrackInfo isFullScreen={isFullScreen}>
          <TrackTitle isFullScreen={isFullScreen}>{metadata?.title || 'Unknown Title'}</TrackTitle>
          <TrackArtist isFullScreen={isFullScreen}>{metadata?.artist || 'Unknown Artist'}</TrackArtist>
          <TrackAlbum isFullScreen={isFullScreen}>{metadata?.album || 'Unknown Album'}</TrackAlbum>

          <ProgressContainer isFullScreen={isFullScreen}>
            <TimeDisplay isFullScreen={isFullScreen}>{formatTime(currentTime)}</TimeDisplay>
            <ProgressBar 
              isFullScreen={isFullScreen}
              value={currentTime}
              max={duration || 1}
              onChange={handleSeek}
            />
            <TimeDisplay isFullScreen={isFullScreen}>{formatTime(duration)}</TimeDisplay>
          </ProgressContainer>

          <Controls isFullScreen={isFullScreen}>
            <ShuffleButton 
              isFullScreen={isFullScreen}
              onClick={toggleShuffle} 
              active={isShuffled}
              title={isShuffled ? 'Shuffle is on' : 'Shuffle is off'}
            >
              <BiShuffle size={isFullScreen ? 32 : 24} />
            </ShuffleButton>

            <MainControls isFullScreen={isFullScreen}>
              <SkipButton 
                isFullScreen={isFullScreen}
                onClick={onPrevious} 
                disabled={!hasPrevious}
              >
                <BiSkipPrevious size={isFullScreen ? 52 : 40} />
              </SkipButton>

              <PlayButton 
                isFullScreen={isFullScreen}
                onClick={handlePlayPause} 
                disabled={loading}
              >
                {loading ? (
                  '⌛'
                ) : isPlaying ? (
                  <BiPauseCircle size={isFullScreen ? 72 : 56} />
                ) : (
                  <BiPlayCircle size={isFullScreen ? 72 : 56} />
                )}
              </PlayButton>

              <SkipButton 
                isFullScreen={isFullScreen}
                onClick={onNext} 
                disabled={!hasNext}
              >
                <BiSkipNext size={isFullScreen ? 52 : 40} />
              </SkipButton>
            </MainControls>

            <RepeatButton 
              isFullScreen={isFullScreen}
              onClick={toggleRepeatMode} 
              active={repeatMode > 0}
              title={
                repeatMode === 0 
                  ? 'No repeat' 
                  : repeatMode === 1 
                    ? 'Repeat all' 
                    : 'Repeat one'
              }
            >
              <BiRepeat size={isFullScreen ? 32 : 24} />
              {repeatMode === 2 && <RepeatOneIndicator>1</RepeatOneIndicator>}
            </RepeatButton>

            <VolumeContainer isFullScreen={isFullScreen}>
              <VolumeIcon 
                isFullScreen={isFullScreen}
                onClick={() => volume > 0 ? setVolume(0) : setVolume(0.8)}
              >
                {getVolumeIcon()}
              </VolumeIcon>
              <VolumeSlider
                isFullScreen={isFullScreen}
                value={volume}
                max={1}
                onChange={handleVolumeChange}
              />
            </VolumeContainer>
          </Controls>
        </TrackInfo>
      </PlayerContent>

      <FullScreenButton 
        isFullScreen={isFullScreen}
        onClick={toggleFullScreen} 
        title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
      >
        {isFullScreen ? <IoMdContract size={32} /> : <IoMdExpand size={24} />}
      </FullScreenButton>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </PlayerContainer>
  );
};

const PlayerContainer = styled.div<{ dominantColor: string; isFullScreen: boolean }>`
  position: relative;
  width: ${props => props.isFullScreen ? '100vw' : '100%'};
  height: ${props => props.isFullScreen ? '100vh' : 'auto'};
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isFullScreen ? 'center' : 'flex-start'};
  justify-content: ${props => props.isFullScreen ? 'center' : 'flex-start'};
  padding: ${props => props.isFullScreen ? '3rem' : '1.5rem'};
  background: ${props => !props.isFullScreen 
    ? `linear-gradient(135deg, ${props.dominantColor} 0%, #121212 100%)`
    : 'transparent'
  };
  border-radius: ${props => props.isFullScreen ? '0' : '12px'};
  overflow: hidden;
  color: white;
  transition: all 0.3s ease;
  box-shadow: ${props => props.isFullScreen ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.3)'};
`;

const FullScreenBackground = styled.div<{ coverArt: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.coverArt});
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(0.4);
  z-index: -4;
  transform: scale(1.1); /* Expand slightly to avoid edge blur artifacts */
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);
  }
`;

const PlayerContent = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  flex-direction: ${props => props.isFullScreen ? 'column' : 'row'};
  align-items: center;
  gap: ${props => props.isFullScreen ? '40px' : '20px'};
  width: 100%;
  max-width: ${props => props.isFullScreen ? '1400px' : '1200px'};
  z-index: 1;
`;

const AlbumArtContainer = styled.div<{ isFullScreen: boolean }>`
  flex-shrink: 0;
  position: relative;
  margin: ${props => props.isFullScreen ? '0 0 20px 0' : '0 24px 0 0'};
`;

const AlbumArt = styled.img<{ isFullScreen: boolean; bassValue: number }>`
  width: ${props => props.isFullScreen ? '400px' : '280px'};
  height: ${props => props.isFullScreen ? '400px' : '280px'};
  border-radius: 8px;
  box-shadow: ${props => props.isFullScreen 
    ? `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 ${20 + props.bassValue * 15}px rgba(255, 255, 255, ${0.3 + props.bassValue * 0.3})`
    : '0 8px 24px rgba(0, 0, 0, 0.5)'
  };
  background: #333;
  object-fit: cover;
  transition: transform 0.05s ease-out, box-shadow 0.05s ease-out;
  
  /* More pronounced scaling effect (2-3px) based on bass value */
  transform: scale(${props => {
    // Base size (1.0) plus a dynamic scaling factor (0-0.03 ~ 0-12px for 400px image)
    // For a 400px image, 0.005 = 2px, 0.0075 = 3px
    const bassFactor = props.bassValue * 0.03;
    return 1 + bassFactor;
  }});
  
  /* We'll skip the subtle-pulse animation to let the bass-driven scaling be more noticeable */
  
  &:hover {
    transform: scale(${props => {
      // When hovering, we add a bit more scale but maintain the bass reactivity
      const bassFactor = props.bassValue * 0.03;
      return 1.02 + bassFactor;
    }});
    box-shadow: ${props => props.isFullScreen 
      ? `0 8px 30px rgba(0, 0, 0, 0.6), 0 0 ${30 + props.bassValue * 20}px rgba(255, 255, 255, ${0.4 + props.bassValue * 0.15})`
      : '0 8px 30px rgba(0, 0, 0, 0.6)'
    };
  }
`;

const TrackInfo = styled.div<{ isFullScreen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: ${props => props.isFullScreen ? 'center' : 'flex-start'};
  width: ${props => props.isFullScreen ? '100%' : 'auto'};
  text-align: ${props => props.isFullScreen ? 'center' : 'left'};
`;

const TrackTitle = styled.h2<{ isFullScreen: boolean }>`
  margin: 0 0 8px 0;
  font-size: ${props => props.isFullScreen ? '42px' : '32px'};
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.5px;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
`;

const TrackArtist = styled.h3<{ isFullScreen: boolean }>`
  margin: 0 0 8px 0;
  font-size: ${props => props.isFullScreen ? '30px' : '22px'};
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
`;

const TrackAlbum = styled.div<{ isFullScreen: boolean }>`
  margin-bottom: ${props => props.isFullScreen ? '40px' : '32px'};
  font-size: ${props => props.isFullScreen ? '24px' : '18px'};
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
`;

const Controls = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '32px' : '24px'};
  margin-bottom: 16px;
`;

const MainControls = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '32px' : '20px'};
`;

const PlayButton = styled.button<{ isFullScreen: boolean }>`
  background: none;
  border: none;
  color: white;
  font-size: ${props => props.isFullScreen ? '72px' : '56px'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin: 0 ${props => props.isFullScreen ? '16px' : '8px'};
  padding: 0;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));

  &:hover {
    transform: scale(1.08);
    color: #1DB954;
    filter: drop-shadow(0 0 10px rgba(29, 185, 84, 0.5));
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
    transform: none;
    filter: none;
  }
`;

const SkipButton = styled.button<{ disabled: boolean; isFullScreen: boolean }>`
  background: none;
  border: none;
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.3)' : 'white'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: ${props => props.isFullScreen ? '52px' : '40px'};
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.3)' : '#1DB954'};
    transform: ${props => props.disabled ? 'none' : 'scale(1.08)'};
  }
`;

const ProgressContainer = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: ${props => props.isFullScreen ? '40px' : '28px'};
  width: ${props => props.isFullScreen ? '80%' : '100%'};
  max-width: ${props => props.isFullScreen ? '1000px' : 'none'};
  padding: 6px 0;
`;

const TimeDisplay = styled.div<{ isFullScreen: boolean }>`
  font-size: ${props => props.isFullScreen ? '18px' : '14px'};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  width: ${props => props.isFullScreen ? '60px' : '50px'};
  text-align: center;
`;

const ProgressBar = styled.input.attrs<ProgressBarProps & { isFullScreen: boolean }>(props => ({
  type: 'range',
  min: 0,
  max: props.max || 1,
  value: props.value || 0
}))<ProgressBarProps & { isFullScreen: boolean }>`
  flex: 1;
  height: ${props => props.isFullScreen ? '6px' : '4px'};
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  outline: none;
  position: relative;
  margin: 8px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: ${props => props.isFullScreen ? '20px' : '16px'};
    height: ${props => props.isFullScreen ? '20px' : '16px'};
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    margin-top: ${props => props.isFullScreen ? '-7px' : '-6px'};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(29, 185, 84, 0.8);
    transition: all 0.2s ease;
  }

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.8) ${props => ((props.value || 0) / (props.max || 1)) * 100}%,
      rgba(255, 255, 255, 0.3) ${props => ((props.value || 0) / (props.max || 1)) * 100}%
    );
    box-shadow: ${props => props.isFullScreen ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none'};
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #1ed760;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(29, 185, 84, 1);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  &::-moz-range-progress {
    background-color: rgba(255, 255, 255, 0.8);
    height: 4px;
    border-radius: 2px;
  }
`;

const VolumeContainer = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '16px' : '12px'};
  margin-left: ${props => props.isFullScreen ? '32px' : '24px'};
`;

const VolumeIcon = styled.button<{ isFullScreen: boolean }>`
  background: none;
  border: none;
  color: white;
  font-size: ${props => props.isFullScreen ? '32px' : '24px'};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: #1DB954;
    transform: scale(1.08);
  }
`;

const VolumeSlider = styled.input.attrs<VolumeSliderProps & { isFullScreen: boolean }>(props => ({
  type: 'range',
  min: 0,
  max: props.max || 1,
  step: 0.01,
  value: props.value || 0
}))<VolumeSliderProps & { isFullScreen: boolean }>`
  width: ${props => props.isFullScreen ? '150px' : '100px'};
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  position: relative;
  margin: 8px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: ${props => props.isFullScreen ? '20px' : '16px'};
    height: ${props => props.isFullScreen ? '20px' : '16px'};
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    margin-top: ${props => props.isFullScreen ? '-8px' : '-6px'};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.8) ${props => ((props.value || 0) / (props.max || 1)) * 100}%,
      rgba(255, 255, 255, 0.3) ${props => ((props.value || 0) / (props.max || 1)) * 100}%
    );
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #1ed760;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  &::-moz-range-progress {
    background-color: rgba(255, 255, 255, 0.8);
    height: 4px;
    border-radius: 2px;
  }
`;

const RepeatButton = styled.button<{ active: boolean; isFullScreen: boolean }>`
  background: none;
  border: none;
  color: ${props => props.active ? '#1DB954' : 'white'};
  cursor: pointer;
  font-size: ${props => props.isFullScreen ? '32px' : '24px'};
  padding: 0;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  text-shadow: ${props => props.active && props.isFullScreen 
    ? '0 0 10px rgba(29, 185, 84, 0.7)' 
    : 'none'};

  &:hover {
    color: #1DB954;
    transform: scale(1.08);
    text-shadow: 0 0 10px rgba(29, 185, 84, 0.7);
  }
`;

const RepeatOneIndicator = styled.span`
  position: absolute;
  font-size: 10px;
  bottom: 0;
  color: inherit;
`;

const ShuffleButton = styled.button<{ active: boolean; isFullScreen: boolean }>`
  background: none;
  border: none;
  color: ${props => props.active ? '#1DB954' : 'white'};
  cursor: pointer;
  font-size: ${props => props.isFullScreen ? '32px' : '24px'};
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  text-shadow: ${props => props.active && props.isFullScreen 
    ? '0 0 10px rgba(29, 185, 84, 0.7)' 
    : 'none'};

  &:hover {
    color: #1DB954;
    transform: scale(1.08);
    text-shadow: 0 0 10px rgba(29, 185, 84, 0.7);
  }
`;

const FullScreenButton = styled.button<{ isFullScreen: boolean }>`
  position: absolute;
  top: ${props => props.isFullScreen ? '15px' : '10px'};
  right: ${props => props.isFullScreen ? '15px' : '10px'};
  background: ${props => props.isFullScreen ? 'rgba(0, 0, 0, 0.5)' : 'none'};
  border: none;
  border-radius: ${props => props.isFullScreen ? '50%' : '0'};
  padding: ${props => props.isFullScreen ? '10px' : '8px'};
  color: white;
  cursor: pointer;
  z-index: 10;
  opacity: 0.7;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: ${props => props.isFullScreen ? 'scale(1.1)' : 'scale(1.05)'};
    background: ${props => props.isFullScreen ? 'rgba(0, 0, 0, 0.7)' : 'none'};
  }
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  margin-top: 10px;
  text-align: center;
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 20;
  font-weight: 500;
`;

// New components for enhanced visuals
const BloomOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  z-index: -3;
  opacity: 0;
  animation: bloom 3s ease-in-out infinite alternate;
  
  @keyframes bloom {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 0.7;
      transform: scale(1.2);
    }
  }
`;

const Particles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  overflow: hidden;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0.6;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 60% 10%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 5%);
    animation: particlesMove 25s linear infinite;
  }
  
  &::after {
    background-size: 150% 150%;
    animation-duration: 30s;
    animation-delay: -5s;
    opacity: 0.4;
  }
  
  @keyframes particlesMove {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 100% 100%;
    }
  }
`;

const PulsingGlow = styled.div<{ dominantColor: string; bassValue: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => 0.9 + props.bassValue * 0.25});
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: ${props => props.dominantColor};
  opacity: ${props => 0.08 + props.bassValue * 0.15};
  filter: blur(80px);
  z-index: -1;
  transition: transform 0.1s ease, opacity 0.1s ease;
`;

// Make bass ripple more visible and responsive
const BassRipple = styled.div<{ bassValue: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => props.bassValue * 0.5 + 0.97});
  width: 103%;
  height: 103%;
  border-radius: 10px;
  background: transparent;
  opacity: ${props => props.bassValue * 0.4};
  z-index: -1;
  box-shadow: 0 0 ${props => 10 + props.bassValue * 40}px rgba(255, 255, 255, ${props => 0.2 + props.bassValue * 0.5});
  transition: all 0.05s ease-out;
`;

export default EnhancedAudioPlayer;