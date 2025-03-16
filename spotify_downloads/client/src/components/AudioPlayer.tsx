import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface AudioPlayerProps {
  url: string;
  title: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when a new track is loaded
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);
    setError(null);
    
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [url, volume]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
            })
            .catch(error => {
              // Auto-play was prevented
              setError('Playback was prevented by the browser. Please interact with the page first.');
              console.error('Playback error:', error);
            });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setLoading(false);
    }
  };

  const handleLoadedData = () => {
    setLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e);
    setError('Error loading audio. Please try again or select another track.');
    setLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

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

  // Format time in MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <PlayerContainer>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        onError={handleError}
      />
      
      <TrackInfo>
        <TrackTitle>{title}</TrackTitle>
      </TrackInfo>
      
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          <Controls>
            <PlayButton onClick={handlePlayPause} disabled={loading}>
              {loading ? '⌛' : isPlaying ? '❚❚' : '▶'}
            </PlayButton>
            
            <ProgressContainer>
              <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
              <ProgressBar 
                type="range" 
                min={0} 
                max={duration || 0} 
                value={currentTime} 
                onChange={handleSeek} 
                step={0.1}
                disabled={loading}
              />
              <TimeDisplay>{formatTime(duration)}</TimeDisplay>
            </ProgressContainer>
          </Controls>
          
          <VolumeContainer>
            <VolumeIcon>🔊</VolumeIcon>
            <VolumeSlider 
              type="range" 
              min={0} 
              max={1} 
              step={0.01} 
              value={volume} 
              onChange={handleVolumeChange} 
            />
          </VolumeContainer>
        </>
      )}
    </PlayerContainer>
  );
};

const PlayerContainer = styled.div`
  background: linear-gradient(to bottom, #121212, #181818);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const TrackInfo = styled.div`
  margin-bottom: 20px;
`;

const TrackTitle = styled.h3`
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const PlayButton = styled.button`
  background: #1DB954;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #1ed760;
  }

  &:disabled {
    background: #1db95480;
    cursor: not-allowed;
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const ProgressBar = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: #535353;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
  }

  &:hover::-webkit-slider-thumb {
    background: #1DB954;
  }

  &:hover::-moz-range-thumb {
    background: #1DB954;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const TimeDisplay = styled.span`
  font-size: 12px;
  color: #b3b3b3;
  width: 45px;
  text-align: center;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
`;

const VolumeIcon = styled.span`
  font-size: 16px;
  color: #b3b3b3;
`;

const VolumeSlider = styled.input`
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: #535353;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
  text-align: center;
`;

export default AudioPlayer; 