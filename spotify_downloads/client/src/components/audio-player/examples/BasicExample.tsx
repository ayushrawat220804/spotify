import React, { useState } from 'react';
import styled from 'styled-components';
import { EnhancedAudioPlayer } from '../';

const BasicExample: React.FC = () => {
  // Sample tracks
  const tracks = [
    {
      url: 'https://example.com/track1.mp3',
      metadata: {
        title: 'Sample Track 1',
        artist: 'Artist Name',
        album: 'Album Title',
        coverArt: 'https://picsum.photos/id/1/500/500'
      }
    },
    {
      url: 'https://example.com/track2.mp3',
      metadata: {
        title: 'Sample Track 2',
        artist: 'Another Artist',
        album: 'Another Album',
        coverArt: 'https://picsum.photos/id/2/500/500'
      }
    },
    {
      url: 'https://example.com/track3.mp3',
      metadata: {
        title: 'Sample Track 3',
        artist: 'Third Artist',
        album: 'Third Album',
        coverArt: 'https://picsum.photos/id/3/500/500'
      }
    }
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  const handlePrevious = () => {
    setCurrentTrackIndex(prev => (prev > 0 ? prev - 1 : tracks.length - 1));
  };

  const handleNext = () => {
    setCurrentTrackIndex(prev => (prev < tracks.length - 1 ? prev + 1 : 0));
  };

  const handleShuffleChange = (shuffled: boolean) => {
    setIsShuffled(shuffled);
    console.log(`Shuffle mode ${shuffled ? 'enabled' : 'disabled'}`);
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <ExampleContainer>
      <h1>Enhanced Audio Player Example</h1>
      
      <PlayerWrapper>
        <EnhancedAudioPlayer
          url={currentTrack.url}
          metadata={currentTrack.metadata}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={tracks.length > 1}
          hasNext={tracks.length > 1}
          onShuffleChange={handleShuffleChange}
        />
      </PlayerWrapper>
      
      <TrackList>
        <h2>Available Tracks</h2>
        {tracks.map((track, index) => (
          <TrackItem 
            key={index}
            isActive={index === currentTrackIndex}
            onClick={() => setCurrentTrackIndex(index)}
          >
            <TrackImage src={track.metadata.coverArt} alt={track.metadata.title} />
            <TrackDetails>
              <TrackTitle>{track.metadata.title}</TrackTitle>
              <TrackArtist>{track.metadata.artist}</TrackArtist>
            </TrackDetails>
          </TrackItem>
        ))}
      </TrackList>
    </ExampleContainer>
  );
};

const ExampleContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  h1 {
    color: #1DB954;
    margin-bottom: 2rem;
  }
`;

const PlayerWrapper = styled.div`
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
`;

const TrackList = styled.div`
  background: #282828;
  border-radius: 12px;
  padding: 1.5rem;
  
  h2 {
    color: white;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
`;

const TrackItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.isActive ? 'rgba(29, 185, 84, 0.2)' : 'transparent'};
  border-left: ${props => props.isActive ? '4px solid #1DB954' : '4px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:not(:last-child) {
    margin-bottom: 0.5rem;
  }
`;

const TrackImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
`;

const TrackDetails = styled.div`
  margin-left: 1rem;
  color: white;
`;

const TrackTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const TrackArtist = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

export default BasicExample;