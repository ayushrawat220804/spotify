import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
// Import the shared types
import { TrackMetadata, Track } from '../types';
import { FaFolderOpen, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoMdSearch, IoMdClose } from 'react-icons/io';

interface LocalFileSelectorProps {
  onFileSelect: (fileUrl: string, metadata?: TrackMetadata) => void;
  onTracksLoaded?: (tracks: Track[]) => void;
  onTrackSelect?: (track: Track) => void;
}

const LocalFileSelector: React.FC<LocalFileSelectorProps> = ({ onFileSelect, onTracksLoaded, onTrackSelect }) => {
  // State variables
  const [folderPath, setFolderPath] = useState<string>('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingFolder, setIsAddingFolder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [musicFolders, setMusicFolders] = useState<string[]>([]);
  const [showTracks, setShowTracks] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);

  // Fetch music folders when component mounts
  const fetchMusicFolders = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/folders');
      setMusicFolders(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching music folders:', error);
      return [];
    }
  }, []);

  // Fetch tracks from the server
  const fetchTracks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Track[]>('http://localhost:5000/api/tracks');
      
      // Update tracks in state
      setTracks(response.data);
      
      // Notify parent component if callback exists
      if (onTracksLoaded) {
        onTracksLoaded(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setErrorMessage('Failed to load tracks. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [onTracksLoaded]);

  // Initial data loading
  useEffect(() => {
    // Load folders and tracks when component mounts
    const loadInitialData = async () => {
      await fetchMusicFolders();
      await fetchTracks();
    };
    
    loadInitialData();
  }, [fetchMusicFolders, fetchTracks]);

  // Filter tracks based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTracks(tracks);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = tracks.filter(track => 
      track.title.toLowerCase().includes(term) || 
      track.artist.toLowerCase().includes(term) || 
      track.album.toLowerCase().includes(term)
    );
    
    setFilteredTracks(filtered);
  }, [searchTerm, tracks]);

  // Handle adding a new folder
  const handleAddFolder = async () => {
    // Validate input
    if (!folderPath || folderPath.trim() === '') {
      setErrorMessage('Please enter a valid folder path');
      return;
    }

    try {
      // Start loading state
      setIsAddingFolder(true);
      setErrorMessage(null);
      
      // Format path for Windows (escape backslashes if needed)
      let formattedPath = folderPath;
      
      console.log('Adding folder:', formattedPath);
      
      // Make request to add folder
      const response = await axios.post('http://localhost:5000/api/folders', {
        folderPath: formattedPath
      });
      
      console.log('Server response:', response.data);
      
      if (response.status === 200) {
        // Success - clear input
        setFolderPath('');
        
        // Refresh folders and tracks
        await fetchMusicFolders();
        await fetchTracks();
      }
    } catch (error: any) {
      // Handle different types of errors
      console.error('Error adding folder:', error);
      
      if (error.response?.status === 404) {
        setErrorMessage('Folder not found. Please check the path and try again.');
      } else if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Failed to add folder. Please check the path and try again.');
      }
    } finally {
      // Add small delay to prevent flickering
      setTimeout(() => {
        setIsAddingFolder(false);
      }, 300);
    }
  };

  // Handle selecting a track to play
  const handleTrackSelect = (track: Track) => {
    const fileUrl = `http://localhost:5000/api/stream/${track.id}`;
    
    const metadata: TrackMetadata = {
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverArt: track.coverArt === null ? undefined : track.coverArt
    };
    
    // Call both callbacks - one for direct playing and one for track management
    onFileSelect(fileUrl, metadata);
    
    // If parent component wants to manage tracks (for navigation)
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  // Reset any error messages
  const clearError = () => {
    setErrorMessage(null);
  };

  // Toggle tracks visibility
  const toggleTracksVisibility = () => {
    setShowTracks(prev => !prev);
  };

  // Reset search term
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Container>
      <h2>Local Music Files</h2>

      {/* Folder input section */}
      <FolderInputSection>
        <FolderInput
          type="text"
          placeholder="Enter folder path (e.g., C:\\Music)"
          value={folderPath}
          onChange={(e) => {
            clearError();
            setFolderPath(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddFolder();
            }
          }}
        />
        <BrowseButton 
          onClick={() => {
            // Create a hidden file input element
            const input = document.createElement('input');
            input.type = 'file';
            // Use setAttribute for non-standard attributes
            input.setAttribute('webkitdirectory', 'true');
            
            // When a folder is selected
            input.onchange = (e: Event) => {
              const target = e.target as HTMLInputElement;
              if (target && target.files && target.files.length > 0) {
                // Get the folder path from the first file
                const file = target.files[0] as File & { webkitRelativePath: string };
                const folderPath = file.webkitRelativePath.split('/')[0];
                // Set the folder path to the correct location
                setFolderPath(`C:\\Users\\rohit\\spotify\\spotify_downloads\\SPOTIFY_PLAYLIST_DOWNLOADER_PYTHON\\${folderPath}`);
              }
            };
            
            // Click the hidden input to open the file dialog
            input.click();
          }}
          title="Browse folders"
        >
          <FaFolderOpen /> Browse
        </BrowseButton>
        <AddButton 
          onClick={handleAddFolder}
          disabled={isAddingFolder}
        >
          {isAddingFolder ? 'Adding...' : 'Add Folder'}
        </AddButton>
      </FolderInputSection>

      {/* Example path helper */}
      <PathHelper>
        Example: C:\Users\rohit\Music
      </PathHelper>

      {/* Error message */}
      {errorMessage && (
        <ErrorMessage>
          <ErrorText>{errorMessage}</ErrorText>
          <CloseButton onClick={clearError}>×</CloseButton>
        </ErrorMessage>
      )}

      {/* Music folders section */}
      {musicFolders.length > 0 && (
        <FoldersSection>
          <h3>Music Folders</h3>
          {musicFolders.map((folder, index) => (
            <FolderItem key={index}>{folder}</FolderItem>
          ))}
        </FoldersSection>
      )}

      {/* Tracks section */}
      <TracksSection>
        <TracksHeader>
          <TracksTitle>
            Tracks ({tracks.length})
            {isLoading && <LoadingIndicator>Loading...</LoadingIndicator>}
          </TracksTitle>
          <ToggleButton onClick={toggleTracksVisibility} title={showTracks ? "Hide tracks" : "Show tracks"}>
            {showTracks ? <FaChevronUp /> : <FaChevronDown />}
          </ToggleButton>
        </TracksHeader>
        
        {/* Search functionality */}
        {showTracks && tracks.length > 0 && (
          <SearchContainer>
            <SearchIcon>
              <IoMdSearch size={20} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search by title, artist, or album..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <ClearButton onClick={clearSearch} title="Clear search">
                <IoMdClose size={16} />
              </ClearButton>
            )}
          </SearchContainer>
        )}
        
        {/* Show search results info */}
        {showTracks && searchTerm && tracks.length > 0 && (
          <SearchResultsInfo>
            Found {filteredTracks.length} of {tracks.length} tracks
          </SearchResultsInfo>
        )}
        
        {tracks.length === 0 ? (
          <NoTracksMessage>
            {isLoading ? 'Loading tracks...' : 'No tracks found. Add a music folder to scan for tracks.'}
          </NoTracksMessage>
        ) : showTracks && (
          <TracksList>
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track) => (
                <TrackItem key={track.id} onClick={() => handleTrackSelect(track)}>
                  {track.coverArt ? (
                    <TrackArtwork src={track.coverArt} alt={`${track.album} cover`} />
                  ) : (
                    <DefaultArtwork>
                      <DefaultArtworkText>
                        {track.title.charAt(0)}
                      </DefaultArtworkText>
                    </DefaultArtwork>
                  )}
                  <TrackInfo>
                    <TrackTitle>{track.title}</TrackTitle>
                    <TrackArtist>{track.artist}</TrackArtist>
                    <TrackAlbum>{track.album}</TrackAlbum>
                  </TrackInfo>
                </TrackItem>
              ))
            ) : (
              <NoSearchResults>
                No tracks found matching "{searchTerm}"
              </NoSearchResults>
            )}
          </TracksList>
        )}
      </TracksSection>
    </Container>
  );
};

const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const FolderInputSection = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
`;

const FolderInput = styled.input`
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const BrowseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 10px;

  &:hover {
    background: #1ed760;
  }

  &:disabled {
    background: #1db95480;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  background: #1DB954;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: #1ed760;
  }

  &:disabled {
    background: #1db95480;
    cursor: not-allowed;
  }
`;

const PathHelper = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 15px;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ErrorText = styled.span`
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
`;

const FoldersSection = styled.div`
  margin-top: 20px;
`;

const FolderItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  word-break: break-all;
`;

const TracksSection = styled.div`
  margin-top: 20px;
`;

const TracksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const TracksTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const LoadingIndicator = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
`;

const NoTracksMessage = styled.div`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 15px;
`;

const TracksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TrackArtwork = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  margin-right: 15px;
  background: #333;
`;

const DefaultArtwork = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 4px;
  margin-right: 15px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DefaultArtworkText = styled.span`
  font-size: 24px;
  color: white;
  text-transform: uppercase;
`;

const TrackInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const TrackTitle = styled.div`
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackArtist = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackAlbum = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// New styled components for search functionality
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 8px 12px;
  margin: 10px 0;
  transition: all 0.2s ease;
  
  &:focus-within {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.5);
  }
`;

const SearchIcon = styled.span`
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: white;
  font-size: 14px;
  width: 100%;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #1DB954;
  }
`;

const SearchResultsInfo = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
`;

const NoSearchResults = styled.div`
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
`;

export default LocalFileSelector; 