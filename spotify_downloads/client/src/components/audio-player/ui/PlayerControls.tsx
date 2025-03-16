import React from 'react';
import styled from 'styled-components';
import {
  BiSkipPrevious,
  BiSkipNext,
  BiRepeat,
  BiShuffle,
  BiPlayCircle,
  BiPauseCircle
} from 'react-icons/bi';

interface PlayerControlsProps {
  isPlaying: boolean;
  loading: boolean;
  isFullScreen?: boolean;
  repeatMode: number;
  isShuffled: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  loading,
  isFullScreen = false,
  repeatMode,
  isShuffled,
  hasNext,
  hasPrevious,
  onPlayPause,
  onNext,
  onPrevious,
  onToggleRepeat,
  onToggleShuffle
}) => {
  return (
    <Controls isFullScreen={isFullScreen}>
      <ShuffleButton
        isFullScreen={isFullScreen}
        onClick={onToggleShuffle}
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
          onClick={onPlayPause}
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
        onClick={onToggleRepeat}
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
    </Controls>
  );
};

const Controls = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '24px' : '16px'};
  height: ${props => props.isFullScreen ? '32px' : '24px'};
`;

const MainControls = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '16px' : '10px'};
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

export default PlayerControls; 