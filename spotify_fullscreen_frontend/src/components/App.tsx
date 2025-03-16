import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import FullscreenPlayer from './FullscreenPlayer';
import AudioPlayer from './AudioPlayer';
import { Track, defaultTrack } from '../mockData';
import DirectorySelector from './DirectorySelector';
import { loadTracksFromDirectories } from '../utils/metadataLoader';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #121212;
  position: relative;
`;

const PlaylistContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 300px;
  max-height: 80vh;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  overflow-y: auto;
  z-index: 100;
  color: white;
  padding: 16px;
  display: ${props => props.hidden ? 'none' : 'block'};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #333;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
  }
`;

const PlaylistTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlaylistTitleText = styled.h3`
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
`;

const PlaylistCountToggle = styled.button`
  background: none;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  opacity: 0.7;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    color: white;
  }
`;

const PlaylistItem = styled.div<{ active: boolean }>`
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.active ? 'rgba(29, 185, 84, 0.3)' : 'transparent'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const TrackTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackArtist = styled.div`
  font-size: 12px;
  color: #b3b3b3;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TogglePlaylistButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.7);
  }
`;

const WelcomeContainer = styled.div`
  color: white;
  text-align: center;
  max-width: 600px;
  padding: 20px;
  
  h2 {
    font-size: 32px;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 18px;
    margin-bottom: 24px;
    opacity: 0.8;
  }
  
  button {
    background-color: #1DB954;
    color: white;
    border: none;
    border-radius: 30px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #1ed760;
      transform: scale(1.05);
    }
  }
`;

const App: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showTrackCount, setShowTrackCount] = useState(true);
  const audioPlayerRef = useRef<HTMLInputElement>(null);
  
  // Add state for directory selection
  const [musicDir, setMusicDir] = useState<string>('');
  const [artworkDir, setArtworkDir] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [showDirSelector, setShowDirSelector] = useState<boolean>(false);
  
  const handleFileSelect = () => {
    // Trigger the hidden file input
    if (audioPlayerRef.current) {
      audioPlayerRef.current.click();
    }
  };
  
  const handleTrackLoad = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
  }, []);
  
  const handlePlaylistLoad = useCallback((tracks: Track[]) => {
    setPlaylist(tracks);
    setCurrentTrackIndex(0);
    setShowPlaylist(true);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);
  
  const handleTrackEnd = useCallback(() => {
    if (playlist.length > 0 && currentTrackIndex < playlist.length - 1) {
      // Play next track if there's one
      handleNextTrack();
    } else {
      // Otherwise just stop playback
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [playlist, currentTrackIndex]);
  
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  }, []);
  
  const handleSeek = useCallback((newPosition: number) => {
    setCurrentTime(newPosition);
  }, []);
  
  const handleToggleRepeat = useCallback(() => {
    setIsRepeatEnabled(prevRepeat => !prevRepeat);
  }, []);

  const handleChangeTrack = useCallback((index: number) => {
    if (index >= 0 && index < playlist.length) {
      const newTrack = playlist[index];
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setIsPlaying(true);
      setCurrentTrack({...newTrack, isPlaying: true});
    }
  }, [playlist]);

  const handlePreviousTrack = useCallback(() => {
    if (playlist.length === 0 || currentTrackIndex <= 0) return;
    
    const newIndex = currentTrackIndex - 1;
    setCurrentTrackIndex(newIndex);
    setCurrentTrack(playlist[newIndex]);
    setCurrentTime(0);
    setIsPlaying(true); // Always start playing when navigating tracks
  }, [playlist, currentTrackIndex]);

  const handleNextTrack = useCallback(() => {
    if (playlist.length === 0 || currentTrackIndex >= playlist.length - 1) return;
    
    const newIndex = currentTrackIndex + 1;
    setCurrentTrackIndex(newIndex);
    setCurrentTrack(playlist[newIndex]);
    setCurrentTime(0);
    setIsPlaying(true); // Always start playing when navigating tracks
  }, [playlist, currentTrackIndex]);

  const handleSelectTrack = useCallback((index: number) => {
    handleChangeTrack(index);
  }, [handleChangeTrack]);

  const togglePlaylistView = useCallback(() => {
    setShowPlaylist(prev => !prev);
  }, []);
  
  const toggleTrackCount = useCallback(() => {
    setShowTrackCount(prev => !prev);
  }, []);
  
  // Add keyboard shortcut for space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key to toggle play/pause
      if (e.code === 'Space' && !e.ctrlKey && !e.altKey && !e.metaKey &&
          (document.activeElement?.tagName !== 'INPUT' && 
           document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault(); // Prevent scrolling
        handlePlayPause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);
  
  // New function to handle music directory selection
  const handleMusicDirSelect = useCallback((dir: string) => {
    console.log('Selected music directory:', dir);
    setMusicDir(dir);
  }, []);
  
  // New function to handle artwork directory selection
  const handleArtworkDirSelect = useCallback((dir: string) => {
    console.log('Selected artwork directory:', dir);
    setArtworkDir(dir);
  }, []);
  
  // Update the loadMetadataFromDirectories function to use our utility
  const loadMetadataFromDirectories = useCallback(async () => {
    if (!musicDir || !artworkDir) {
      console.error('Music or artwork directory not selected');
      return;
    }
    
    setIsLoadingMetadata(true);
    
    try {
      // Load tracks from the specified directories
      const tracks = await loadTracksFromDirectories(musicDir, artworkDir);
      
      if (tracks.length === 0) {
        console.error('No tracks found or could be loaded');
        return;
      }
      
      // Update playlist with loaded tracks
      setPlaylist(tracks);
      
      // Set first track as current track
      setCurrentTrackIndex(0);
      setCurrentTrack(tracks[0]);
      
      // Update state
      setShowDirSelector(false);
      
      console.log(`Successfully loaded ${tracks.length} tracks`);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [musicDir, artworkDir]);
  
  // Toggle directory selector
  const toggleDirSelector = useCallback(() => {
    setShowDirSelector(prev => !prev);
  }, []);

  return (
    <AppContainer>
      <AudioPlayer
        ref={audioPlayerRef}
        onTrackLoad={handleTrackLoad}
        onPlaylistLoad={handlePlaylistLoad}
        onTimeUpdate={handleTimeUpdate}
        onTrackEnd={handleTrackEnd}
        isPlaying={isPlaying}
        currentTime={currentTime}
        track={currentTrack}
        isRepeatEnabled={isRepeatEnabled}
      />
      
      {/* Directory selector dialog */}
      {showDirSelector && (
        <DirectorySelector
          onSelectMusicDir={handleMusicDirSelect}
          onSelectArtworkDir={handleArtworkDirSelect}
          onLoadMetadata={loadMetadataFromDirectories}
          musicDir={musicDir}
          artworkDir={artworkDir}
          isLoading={isLoadingMetadata}
          onClose={() => setShowDirSelector(false)}
        />
      )}
      
      {currentTrack ? (
        <>
          {playlist.length > 0 && (
            <>
              <TogglePlaylistButton onClick={togglePlaylistView}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 4v7h-7v-7h7zm-1 1h-5v5h5v-5zm-7 7v7h7v-7h-7zm1 1h5v5h-5v-5zm7-1h7v-7h-7v7zm1-6h5v5h-5v-5zm0 7v7h7v-7h-7zm1 1h5v5h-5v-5z"/>
                </svg>
              </TogglePlaylistButton>
              
              <PlaylistContainer hidden={!showPlaylist}>
                <PlaylistTitle>
                  <PlaylistTitleText>
                    Your Playlist {showTrackCount && `(${playlist.length} tracks)`}
                  </PlaylistTitleText>
                  <PlaylistCountToggle onClick={toggleTrackCount} title={showTrackCount ? "Hide track count" : "Show track count"}>
                    {showTrackCount ? "−" : "+"}
                  </PlaylistCountToggle>
                </PlaylistTitle>
                
                {playlist.map((track, index) => (
                  <PlaylistItem 
                    key={track.id} 
                    active={index === currentTrackIndex}
                    onClick={() => handleSelectTrack(index)}
                  >
                    <TrackTitle>{track.title}</TrackTitle>
                    <TrackArtist>{track.artist}</TrackArtist>
                  </PlaylistItem>
                ))}
              </PlaylistContainer>
            </>
          )}
          
          <FullscreenPlayer 
            track={currentTrack}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            isRepeatEnabled={isRepeatEnabled}
            onToggleRepeat={handleToggleRepeat}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            hasPlaylist={playlist.length > 1}
            playlistName={playlist.length > 0 ? "Your Playlist" : "Now Playing"}
          />
        </>
      ) : (
        <WelcomeContainer>
          <h2>Spotify Fullscreen Player</h2>
          <p>Play your local music files with a beautiful fullscreen interface inspired by Spotify</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleFileSelect}>Select MP3 Files</button>
            <button 
              onClick={toggleDirSelector} 
              style={{ backgroundColor: '#333', color: 'white' }}
            >
              Import Spotify Downloads
            </button>
          </div>
        </WelcomeContainer>
      )}
    </AppContainer>
  );
};

export default App; 