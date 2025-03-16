import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { IoMdExpand, IoMdContract } from 'react-icons/io';
import { TrackMetadata } from '../../types';

// Import custom hooks
import useAudioContext from './hooks/useAudioContext';
import useAudioAnalysis from './hooks/useAudioAnalysis';
import useAudioPlayer from './hooks/useAudioPlayer';

// Import UI components
import AlbumArt from './ui/AlbumArt';
import PlayerControls from './ui/PlayerControls';
import ProgressBar from './ui/ProgressBar';
import VolumeControl from './ui/VolumeControl';

// Import utilities
import { extractDominantColor } from './utils/audioUtils';

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

// High-performance animation keyframes - optimized for 30+ fps
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const scaleUp = keyframes`
  0% {
    transform: scale(0.96) translateZ(0);
  }
  100% {
    transform: scale(1) translateZ(0);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(15px) translateZ(0);
    opacity: 0;
  }
  to {
    transform: translateY(0) translateZ(0);
    opacity: 1;
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(29, 185, 84, 0.3);
  }
  50% {
    box-shadow: 0 0 10px rgba(29, 185, 84, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(29, 185, 84, 0.3);
  }
`;

const pulseScale = keyframes`
  0% {
    transform: scale(1) translateZ(0);
  }
  50% {
    transform: scale(1.02) translateZ(0);
  }
  100% {
    transform: scale(1) translateZ(0);
  }
`;

const rotateAround = keyframes`
  from {
    transform: rotate(0deg) translateX(10px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(10px) rotate(-360deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  url,
  metadata,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onShuffleChange
}) => {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [volume, setVolume] = useState(0.8);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [dominantColor, setDominantColor] = useState('#121212');
  const [isShuffled, setIsShuffled] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Custom hooks
  const {
    audioContext,
    analyser,
    animationFrameRef,
    resetAudioContext,
    safeResetAudioContext,
    createAudioContext
  } = useAudioContext(audioRef);
  
  const {
    isPlaying,
    currentTime,
    duration,
    loading,
    error,
    handlePlayPause,
    handleSeek,
    handleVolumeChange: audioVolumeChange,
    sanitizeUrl
  } = useAudioPlayer({
    audioRef,
    url,
    onEnd: handleEnded,
    volume,
    createAudioContext,
    audioContext,
    safeResetAudioContext
  });
  
  const { bassValue } = useAudioAnalysis(analyser, isPlaying, animationFrameRef);

  // Extract dominant color from album art
  useEffect(() => {
    if (!metadata?.coverArt) return;
    
    extractDominantColor(metadata.coverArt)
      .then(color => setDominantColor(color))
      .catch(() => setDominantColor('#121212'));
  }, [metadata?.coverArt]);

  // Handle track ended
  function handleEnded() {
    if (repeatMode === 2) {
      // Repeat one
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
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
  }

  // Toggle fullscreen with immediate response
  const toggleFullScreen = () => {
    setIsTransitioning(true);
    
    // Immediate response
    if (!isFullScreen) {
      playerRef.current?.requestFullscreen()
        .catch(err => {
          console.error('Error enabling full-screen mode:', err);
          setIsTransitioning(false);
        });
    } else {
      document.exitFullscreen()
        .catch(err => {
          console.error('Error exiting full-screen mode:', err);
          setIsTransitioning(false);
        });
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      const newFullscreenState = !!document.fullscreenElement;
      setIsFullScreen(newFullscreenState);
      
      // Very short transition - focus on performance
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Handle fullscreen state changes
  useEffect(() => {
    // Show particles with a minimal delay
    if (isFullScreen) {
      const timer = setTimeout(() => {
        setShowParticles(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowParticles(false);
    }
  }, [isFullScreen]);

  // Toggle repeat mode
  const toggleRepeatMode = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    const newShuffleState = !isShuffled;
    setIsShuffled(newShuffleState);
    if (onShuffleChange) {
      onShuffleChange(newShuffleState);
    }
  };

  // Volume change handler that updates both audio and state
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume); // Update state
    audioVolumeChange(newVolume); // Update audio element
  }, [audioVolumeChange]);

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

  return (
    <PlayerContainer 
      ref={playerRef} 
      dominantColor={dominantColor} 
      isFullScreen={isFullScreen}
      isTransitioning={isTransitioning}
    >
      {isFullScreen && metadata?.coverArt && (
        <>
          <FullScreenBackground 
            coverArt={metadata.coverArt} 
            isTransitioning={isTransitioning}
          />
          <BloomOverlay isTransitioning={isTransitioning} />
          {showParticles && <Particles isTransitioning={isTransitioning} />}
          <PulsingGlow 
            dominantColor={dominantColor} 
            bassValue={bassValue}
            isTransitioning={isTransitioning}
          />
        </>
      )}

      <PlayerContent 
        isFullScreen={isFullScreen}
        isTransitioning={isTransitioning}
      >
        <AlbumArt 
          coverArt={metadata?.coverArt || defaultCoverArt}
          altText={`${metadata?.album || 'Album'} cover`}
          isFullScreen={isFullScreen}
          bassValue={bassValue}
          defaultCoverArt={defaultCoverArt}
          isTransitioning={isTransitioning}
        />

        <TrackInfo 
          isFullScreen={isFullScreen}
          isTransitioning={isTransitioning}
        >
          <TrackTitle 
            isFullScreen={isFullScreen}
            isTransitioning={isTransitioning}
          >
            {metadata?.title || 'Unknown Title'}
          </TrackTitle>
          <TrackArtist 
            isFullScreen={isFullScreen}
            isTransitioning={isTransitioning}
          >
            {metadata?.artist || 'Unknown Artist'}
          </TrackArtist>
          <TrackAlbum 
            isFullScreen={isFullScreen}
            isTransitioning={isTransitioning}
          >
            {metadata?.album || 'Unknown Album'}
          </TrackAlbum>

          <ProgressBar 
            currentTime={currentTime}
            duration={duration}
            isFullScreen={isFullScreen}
            onSeek={handleSeek}
          />

          <ControlsWrapper isFullScreen={isFullScreen}>
            <PlayerControls 
              isPlaying={isPlaying}
              loading={loading}
              isFullScreen={isFullScreen}
              repeatMode={repeatMode}
              isShuffled={isShuffled}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPlayPause={handlePlayPause}
              onNext={onNext}
              onPrevious={onPrevious}
              onToggleRepeat={toggleRepeatMode}
              onToggleShuffle={toggleShuffle}
            />

            <VolumeControl 
              volume={volume}
              isFullScreen={isFullScreen}
              onVolumeChange={handleVolumeChange}
            />
          </ControlsWrapper>
        </TrackInfo>
      </PlayerContent>

      <FullScreenButton 
        isFullScreen={isFullScreen}
        onClick={toggleFullScreen} 
        title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        isTransitioning={isTransitioning}
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

// Styled components
const PlayerContainer = styled.div<{ dominantColor: string; isFullScreen: boolean; isTransitioning: boolean }>`
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
  box-shadow: ${props => props.isFullScreen ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.3)'};
  transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${scaleUp} 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) both;
  `}
`;

const FullScreenBackground = styled.div<{ coverArt: string; isTransitioning: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.coverArt});
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(0.4);
  z-index: -4;
  transform: scale(1.05) translateZ(0);
  will-change: opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.3s ease-out forwards;
  `}
  
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

const PlayerContent = styled.div<{ isFullScreen: boolean; isTransitioning: boolean }>`
  display: flex;
  flex-direction: ${props => props.isFullScreen ? 'column' : 'row'};
  align-items: center;
  gap: ${props => props.isFullScreen ? '40px' : '20px'};
  width: 100%;
  max-width: ${props => props.isFullScreen ? '1400px' : '1200px'};
  z-index: 1;
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.25s ease-out forwards;
  `}
`;

const TrackInfo = styled.div<{ isFullScreen: boolean; isTransitioning: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: ${props => props.isFullScreen ? 'center' : 'flex-start'};
  width: ${props => props.isFullScreen ? '100%' : 'auto'};
  text-align: ${props => props.isFullScreen ? 'center' : 'left'};
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && props.isFullScreen && css`
    animation: ${slideIn} 0.3s ease-out forwards;
  `}
`;

// High-performance text animations - all elements animate together instead of staggered
const TrackTitle = styled.h2<{ isFullScreen: boolean; isTransitioning: boolean }>`
  margin: 0 0 8px 0;
  font-size: ${props => props.isFullScreen ? '42px' : '32px'};
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.5px;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${slideIn} 0.3s ease-out forwards;
    text-shadow: ${props.isFullScreen ? '0 2px 8px rgba(0, 0, 0, 0.4)' : 'none'};
  `}
`;

const TrackArtist = styled.h3<{ isFullScreen: boolean; isTransitioning: boolean }>`
  margin: 0 0 8px 0;
  font-size: ${props => props.isFullScreen ? '30px' : '22px'};
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${slideIn} 0.3s ease-out forwards;
    text-shadow: ${props.isFullScreen ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none'};
  `}
`;

const TrackAlbum = styled.div<{ isFullScreen: boolean; isTransitioning: boolean }>`
  margin-bottom: ${props => props.isFullScreen ? '40px' : '32px'};
  font-size: ${props => props.isFullScreen ? '24px' : '18px'};
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.isFullScreen ? '80vw' : '100%'};
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${slideIn} 0.3s ease-out forwards;
    text-shadow: ${props.isFullScreen ? '0 1px 4px rgba(0, 0, 0, 0.25)' : 'none'};
  `}
`;

const FullScreenButton = styled.button<{ isFullScreen: boolean; isTransitioning: boolean }>`
  position: absolute;
  top: ${props => props.isFullScreen ? '15px' : '10px'};
  right: ${props => props.isFullScreen ? '15px' : '10px'};
  background: ${props => props.isFullScreen ? 'rgba(0, 0, 0, 0.5)' : 'none'};
  border: none;
  border-radius: ${props => props.isFullScreen ? '50%' : '0'};
  padding: ${props => props.isFullScreen ? '12px' : '10px'};
  color: white;
  cursor: pointer;
  z-index: 10;
  opacity: 0.7;
  transition: all 0.15s ease-out;
  will-change: transform, opacity;
  
  &:hover {
    opacity: 1;
    transform: ${props => props.isFullScreen ? 'scale(1.1)' : 'scale(1.05)'};
    background: ${props => props.isFullScreen ? 'rgba(0, 0, 0, 0.7)' : 'none'};
    ${props => !props.isTransitioning && css`
      animation: ${glow} 2s infinite;
    `}
  }
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.25s ease-out forwards;
  `}
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

// Simplified visual effects for better performance
const BloomOverlay = styled.div<{ isTransitioning: boolean }>`
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
  will-change: opacity;
  transform: translateZ(0);
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.4s ease-out forwards;
  `}
`;

// Simplified particles for better performance
const Particles = styled.div<{ isTransitioning: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  overflow: hidden;
  will-change: opacity;
  transform: translateZ(0);
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.4s ease-out forwards;
  `}
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0.4;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 5%),
      radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 5%);
    will-change: transform;
    transform: translateZ(0);
  }
`;

// Simplified glow effect for better performance
const PulsingGlow = styled.div<{ dominantColor: string; bassValue: number; isTransitioning: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => 0.9 + props.bassValue * 0.15}) translateZ(0);
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: ${props => props.dominantColor};
  opacity: ${props => 0.08 + props.bassValue * 0.12};
  filter: blur(60px);
  z-index: -1;
  transition: transform 0.03s linear, opacity 0.03s linear;
  will-change: transform, opacity;
  
  ${props => props.isTransitioning && css`
    animation: ${fadeIn} 0.35s ease-out forwards;
  `}
`;

const ControlsWrapper = styled.div<{ isFullScreen?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: ${props => props.isFullScreen ? '20px' : '15px'};
  justify-content: center;
  gap: ${props => props.isFullScreen ? '20px' : '15px'};
  height: ${props => props.isFullScreen ? '32px' : '24px'}; /* Consistent height for all controls */
`;

export default EnhancedAudioPlayer; 