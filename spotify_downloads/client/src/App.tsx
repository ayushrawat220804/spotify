import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import GoogleDriveSelector from './components/GoogleDriveSelector';
import LocalFileSelector from './components/LocalFileSelector';
import { EnhancedAudioPlayer } from './components/audio-player';
import { TrackMetadata, Track } from './types';

// Extend the TrackMetadata type to include url
interface EnhancedTrackMetadata extends TrackMetadata {
  url: string;
}

const App: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<{ url: string; metadata?: Omit<TrackMetadata, 'url'> } | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffledIndexes, setShuffledIndexes] = useState<number[]>([]);
  const [shuffleHistory, setShuffleHistory] = useState<number[]>([]);
  const [shuffleHistoryIndex, setShuffleHistoryIndex] = useState<number>(-1);
  
  useEffect(() => {
    if (currentTrack?.url) {
      const index = allTracks.findIndex(track => {
        // Try different matching strategies
        if (`http://localhost:5000/api/stream/${track.id}` === currentTrack.url) {
          return true;
        }
        
        if (track.path === currentTrack.url) {
          return true;
        }
        
        return false;
      });
      
      setCurrentTrackIndex(index);
    }
  }, [currentTrack, allTracks]);

  // Add a function to generate shuffled indexes
  const generateShuffledIndexes = useCallback(() => {
    if (allTracks.length === 0) return [];
    
    // Create an array of indexes and shuffle it
    const indexes = Array.from({ length: allTracks.length }, (_, i) => i);
    
    // Fisher-Yates shuffle algorithm
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    
    return indexes;
  }, [allTracks.length]);

  const handleGoogleDriveFileSelect = useCallback((fileUrl: string, fileName: string) => {
    setCurrentTrack({ 
      url: fileUrl, 
      metadata: {
        title: fileName,
        artist: 'Google Drive',
        album: 'Cloud Storage'
      }
    });
  }, []);

  const handleLocalFileSelect = useCallback((fileUrl: string, metadata?: TrackMetadata) => {
    setCurrentTrack({ url: fileUrl, metadata });
  }, []);

  const handleTracksLoaded = useCallback((tracks: Track[]) => {
    console.log('Tracks loaded:', tracks);
    setAllTracks(tracks);
    
    // Reset shuffle indexes when new tracks are loaded
    if (isShuffled) {
      console.log('Tracks changed, regenerating shuffle order');
      setShuffledIndexes(generateShuffledIndexes());
    }
  }, [isShuffled, generateShuffledIndexes]);

  // Add this function to properly format the audio URL
  const getProperAudioUrl = (trackPath: string) => {
    if (!trackPath) return '';
    
    console.log('Original track path:', trackPath);
    
    // If it's already a full URL, return it as is
    if (trackPath.startsWith('http')) {
      return trackPath;
    }
    
    // If it's already an API path, return it as is
    if (trackPath.startsWith('/api/')) {
      return trackPath;
    }
    
    // If it's a Windows path, ensure it's properly formatted
    // Replace backslashes with forward slashes for the URL
    let formattedPath = trackPath.replace(/\\/g, '/');
    
    // Make sure the path is properly encoded for URLs
    formattedPath = encodeURIComponent(formattedPath);
    
    // Return the full API URL
    const finalUrl = `/api/audio?path=${formattedPath}`;
    console.log('Formatted URL:', finalUrl);
    return finalUrl;
  };

  const handleTrackSelect = (track: Track) => {
    const index = allTracks.findIndex(t => t.path === track.path);
    if (index !== -1) {
      setCurrentTrackIndex(index);
      
      // Update shuffle history when directly selecting a track
      if (isShuffled) {
        // If we're in the middle of the history, truncate the history
        const newHistory = shuffleHistoryIndex >= 0 
          ? [...shuffleHistory.slice(0, shuffleHistoryIndex + 1), index]
          : [index];
        
        setShuffleHistory(newHistory);
        setShuffleHistoryIndex(newHistory.length - 1);
        console.log('Updated shuffle history after track select:', newHistory);
      }
      
      // When selecting a track directly, use the original path format
      setCurrentTrack({
        url: track.path,
        metadata: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverArt: track.coverArt || undefined
        }
      });
    }
  };

  // Modified function to get the next track index based on shuffle state
  const getNextTrackIndex = useCallback(() => {
    if (!isShuffled) {
      // Normal sequential playback
      return currentTrackIndex < allTracks.length - 1 ? currentTrackIndex + 1 : -1;
    } else {
      if (allTracks.length === 0) return -1;
      
      // If we're not at the end of the history, move forward in history
      if (shuffleHistoryIndex < shuffleHistory.length - 1) {
        return shuffleHistory[shuffleHistoryIndex + 1];
      }
      
      // Otherwise pick a random track that's not the current one
      if (allTracks.length > 1) {
        // Create a list of available indexes (excluding current track)
        const availableIndexes = Array.from({ length: allTracks.length }, (_, i) => i)
          .filter(idx => idx !== currentTrackIndex);
        
        // Randomly select one
        const randomIndex = Math.floor(Math.random() * availableIndexes.length);
        return availableIndexes[randomIndex];
      } else if (allTracks.length === 1) {
        // Only one track, repeat it
        return currentTrackIndex;
      }
      
      return -1;
    }
  }, [currentTrackIndex, allTracks.length, isShuffled, shuffleHistory, shuffleHistoryIndex]);
  
  // Modified function to get the previous track index based on shuffle state
  const getPreviousTrackIndex = useCallback(() => {
    if (!isShuffled) {
      // Normal sequential playback
      return currentTrackIndex > 0 ? currentTrackIndex - 1 : -1;
    } else {
      // If we have history and not at the beginning, go back in history
      if (shuffleHistory.length > 0 && shuffleHistoryIndex > 0) {
        return shuffleHistory[shuffleHistoryIndex - 1];
      }
      
      return -1;
    }
  }, [currentTrackIndex, isShuffled, shuffleHistory, shuffleHistoryIndex]);

  // Handle shuffle toggle from the audio player
  const handleShuffleChange = useCallback((shuffleState: boolean) => {
    setIsShuffled(shuffleState);
    if (shuffleState) {
      console.log('Shuffle enabled - preparing shuffle mode');
      if (currentTrackIndex !== -1) {
        // Initialize shuffle history with current track
        setShuffleHistory([currentTrackIndex]);
        setShuffleHistoryIndex(0);
      } else {
        setShuffleHistory([]);
        setShuffleHistoryIndex(-1);
      }
    } else {
      console.log('Shuffle disabled - returning to sequential playback');
      setShuffleHistory([]);
      setShuffleHistoryIndex(-1);
    }
  }, [currentTrackIndex]);

  // Update the handle functions to use the shuffle-aware logic
  const handlePreviousTrack = () => {
    const newIndex = getPreviousTrackIndex();
    if (newIndex !== -1) {
      setCurrentTrackIndex(newIndex);
      
      // Update shuffle history index if in shuffle mode
      if (isShuffled && shuffleHistoryIndex > 0) {
        setShuffleHistoryIndex(shuffleHistoryIndex - 1);
      }
      
      const track = allTracks[newIndex];
      
      console.log(`Playing previous track ${isShuffled ? '(shuffled)' : ''}: ${track.title}`);
      
      setCurrentTrack({
        url: track.path,
        metadata: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverArt: track.coverArt || undefined
        }
      });
    }
  };
  
  const handleNextTrack = () => {
    const newIndex = getNextTrackIndex();
    if (newIndex !== -1) {
      setCurrentTrackIndex(newIndex);
      
      // Update shuffle history
      if (isShuffled) {
        if (shuffleHistoryIndex < shuffleHistory.length - 1) {
          // Moving forward in existing history
          setShuffleHistoryIndex(shuffleHistoryIndex + 1);
        } else {
          // Add new track to history
          const newHistory = [...shuffleHistory.slice(0, shuffleHistoryIndex + 1), newIndex];
          setShuffleHistory(newHistory);
          setShuffleHistoryIndex(newHistory.length - 1);
          console.log('Updated shuffle history:', newHistory, 'Current index:', newHistory.length - 1);
        }
      }
      
      const track = allTracks[newIndex];
      
      console.log(`Playing next track ${isShuffled ? '(shuffled)' : ''}: ${track.title}`);
      
      setCurrentTrack({
        url: track.path,
        metadata: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverArt: track.coverArt || undefined
        }
      });
    }
  };

  return (
    <Container>
      <Header>
        <Logo>Spotify Local</Logo>
        <Subtitle>Play music from your local files or Google Drive</Subtitle>
      </Header>

      <MainContent>
        <Tabs>
          <TabList>
            <Tab>Local Files</Tab>
            <Tab>Google Drive</Tab>
          </TabList>

          <TabPanel>
            <LocalFileSelector 
              onFileSelect={handleLocalFileSelect} 
              onTracksLoaded={handleTracksLoaded}
              onTrackSelect={handleTrackSelect}
            />
          </TabPanel>
          
          <TabPanel>
            <GoogleDriveSelector onFileSelect={handleGoogleDriveFileSelect} />
          </TabPanel>
        </Tabs>

        {currentTrack ? (
          <EnhancedAudioPlayer 
            url={currentTrack.url}
            metadata={currentTrack.metadata}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            hasPrevious={getPreviousTrackIndex() !== -1}
            hasNext={allTracks.length > 0} // In shuffle mode, always have a next track if any tracks exist
            onShuffleChange={handleShuffleChange}
          />
        ) : (
          <EmptyState>
            <EmptyStateText>
              Select a song to play
            </EmptyStateText>
          </EmptyState>
        )}
      </MainContent>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: #121212;
  color: white;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Logo = styled.h1`
  font-size: 2.5em;
  color: #1DB954;
  margin: 0;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 10px 0 0;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
`;

const EmptyState = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-top: 20px;
`;

const EmptyStateText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2em;
  margin: 0;
`;

export default App; 