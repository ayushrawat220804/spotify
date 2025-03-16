import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Track } from '../mockData';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';

interface FullscreenPlayerProps {
  track: Track;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  isRepeatEnabled: boolean;
  onToggleRepeat: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPlaylist: boolean;
  playlistName?: string;
}

const PlayerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #000;
  overflow: hidden;
`;

const BackgroundImage = styled.div<{ backgroundImage: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${props => {
    // Check if the image path is a file URL
    if (props.backgroundImage.startsWith('file://')) {
      return `url("${props.backgroundImage}") no-repeat center center`;
    }
    return `url(${props.backgroundImage}) no-repeat center center`;
  }};
  background-size: cover;
  filter: brightness(0.4) contrast(1.1);
  z-index: 1;
`;

const ContentOverlay = styled.div`
  position: relative;
  z-index: 2;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const SpotifyLogo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1DB954;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SpotifyIcon = styled.div`
  color: white;
  font-size: 18px;
`;

const PlaylistInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PlayingFromText = styled.div`
  font-size: 11px;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const PlaylistName = styled.div`
  font-size: 14px;
  color: white;
  font-weight: 600;
`;

const TrackContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const AlbumArtThumbnail = styled.div<{ src: string }>`
  width: 80px;
  height: 80px;
  background: ${props => {
    // Check if the image path is a file URL
    if (props.src.startsWith('file://')) {
      return `url("${props.src}") no-repeat center center`;
    }
    return `url(${props.src}) no-repeat center center`;
  }};
  background-size: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const TrackInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TrackTitle = styled.h1`
  font-size: 42px;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.1;
`;

const TrackArtist = styled.h2`
  font-size: 18px;
  font-weight: 400;
  margin: 4px 0 0;
  color: #b3b3b3;
`;

const ControlsContainer = styled.div`
  width: 100%;
`;

const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  track,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  isRepeatEnabled,
  onToggleRepeat,
  onPrevious,
  onNext,
  hasPlaylist,
  playlistName = "Local Music"
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (playerRef.current?.requestFullscreen) {
        playerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Add keyboard shortcut for fullscreen (Alt+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+Enter
      if (e.altKey && e.key === 'Enter') {
        toggleFullscreen();
      }
      // Check for Escape key to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error(`Error exiting fullscreen: ${err.message}`);
        });
      }
      // Add keyboard shortcuts for next/previous
      if (hasPlaylist) {
        if (e.key === 'ArrowRight') {
          onNext();
        } else if (e.key === 'ArrowLeft') {
          onPrevious();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, hasPlaylist, onNext, onPrevious]);

  // Determine the background image to use
  const getBackgroundImage = () => {
    // If the track has a specific background image property, use that
    if (track.backgroundImage) {
      return track.backgroundImage;
    }
    
    // Otherwise, use the cover art
    return track.coverArt;
  };

  return (
    <PlayerContainer ref={playerRef}>
      <BackgroundImage backgroundImage={getBackgroundImage()} />
      <ContentOverlay>
        <TopBar>
          <SpotifyLogo>
            <SpotifyIcon>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </SpotifyIcon>
          </SpotifyLogo>
          <PlaylistInfo>
            <PlayingFromText>Now Playing</PlayingFromText>
            <PlaylistName>{playlistName}</PlaylistName>
          </PlaylistInfo>
        </TopBar>
        
        <div style={{ flex: 1 }}></div>
        
        <div>
          <TrackContainer>
            <AlbumArtThumbnail src={track.coverArt} />
            <TrackInfo>
              <TrackTitle>{track.title}</TrackTitle>
              <TrackArtist>{track.artist}</TrackArtist>
            </TrackInfo>
          </TrackContainer>
          
          <ControlsContainer>
            <ProgressBar 
              currentTime={currentTime} 
              duration={track.duration} 
              onSeek={onSeek}
            />
            <PlayerControls 
              isPlaying={isPlaying} 
              onPlayPause={onPlayPause}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              isRepeatEnabled={isRepeatEnabled}
              onToggleRepeat={onToggleRepeat}
              onPrevious={onPrevious}
              onNext={onNext}
              hasPlaylist={hasPlaylist}
            />
          </ControlsContainer>
        </div>
      </ContentOverlay>
    </PlayerContainer>
  );
};

export default FullscreenPlayer; 