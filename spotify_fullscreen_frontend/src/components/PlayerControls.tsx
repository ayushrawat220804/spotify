import React from 'react';
import styled from 'styled-components';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isRepeatEnabled: boolean;
  onToggleRepeat: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPlaylist: boolean;
}

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
`;

const MainControlsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0 16px;
  transition: all 0.2s ease;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
  
  &:focus {
    outline: none;
  }
`;

const ShuffleButton = styled(ControlButton)`
  margin-right: 12px;
`;

const PreviousButton = styled(ControlButton)<{ disabled: boolean }>`
  margin-right: 12px;
  opacity: ${props => props.disabled ? 0.3 : 0.7};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  
  &:hover {
    opacity: ${props => props.disabled ? 0.3 : 1};
    transform: ${props => props.disabled ? 'none' : 'scale(1.05)'};
  }
`;

const NextButton = styled(ControlButton)<{ disabled: boolean }>`
  margin-left: 12px;
  opacity: ${props => props.disabled ? 0.3 : 0.7};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  
  &:hover {
    opacity: ${props => props.disabled ? 0.3 : 1};
    transform: ${props => props.disabled ? 'none' : 'scale(1.05)'};
  }
`;

const RepeatButton = styled(ControlButton)<{ active: boolean }>`
  margin-left: 12px;
  opacity: ${props => props.active ? 1 : 0.7};
  color: ${props => props.active ? '#1DB954' : 'white'};
  
  &:hover {
    opacity: 1;
    color: ${props => props.active ? '#1DB954' : 'white'};
  }
`;

const PlayPauseButton = styled(ControlButton)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: white;
  color: black;
  opacity: 1;
  
  &:hover {
    transform: scale(1.05);
    background-color: #fff;
  }
`;

const SideControls = styled.div`
  display: flex;
  align-items: center;
  min-width: 100px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  width: 100px;
`;

const VolumeBar = styled.div`
  width: 80px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-left: 8px;
  position: relative;
`;

const VolumeFill = styled.div`
  height: 100%;
  width: 70%;
  background-color: white;
  border-radius: 2px;
`;

const FullscreenButton = styled(ControlButton)`
  margin-left: 16px;
`;

const IconSvg = styled.svg`
  width: 1em;
  height: 1em;
  fill: currentColor;
`;

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  onToggleFullscreen,
  isFullscreen,
  isRepeatEnabled,
  onToggleRepeat,
  onPrevious,
  onNext,
  hasPlaylist
}) => {
  return (
    <ControlsContainer>
      <SideControls>
        {/* Empty space to balance layout */}
      </SideControls>
      
      <MainControlsWrapper>
        <ShuffleButton aria-label="Shuffle">
          <IconSvg viewBox="0 0 16 16" width="16" height="16">
            <path d="M4.5 6.8l.7-.8C4.1 4.7 2.5 4 .9 4v1c1.3 0 2.6.6 3.5 1.6l.1.2zm7.5 4.7c-1.2 0-2.3-.5-3.2-1.3l-.6.8c1 1 2.4 1.5 3.8 1.5V14l3.5-2-3.5-2v1.5zm0-6V7l3.5-2L12 3v1.5c-1.6 0-3.2.7-4.2 2l-3.4 3.9c-.9 1-2.2 1.6-3.5 1.6v1c1.6 0 3.2-.7 4.2-2l3.4-3.9c.9-1 2.2-1.6 3.5-1.6z"/>
          </IconSvg>
        </ShuffleButton>
        
        <PreviousButton 
          aria-label="Previous track" 
          onClick={hasPlaylist ? onPrevious : undefined}
          disabled={!hasPlaylist}
        >
          <IconSvg viewBox="0 0 16 16" width="16" height="16">
            <path d="M13 2.5L5 7.119V3H3v10h2V8.881l8 4.619z"/>
          </IconSvg>
        </PreviousButton>
        
        <PlayPauseButton 
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <IconSvg viewBox="0 0 16 16" width="16" height="16">
              <path d="M3 2h3v12H3zm7 0h3v12h-3z"/>
            </IconSvg>
          ) : (
            <IconSvg viewBox="0 0 16 16" width="16" height="16">
              <path d="M4.018 14L14.41 8 4.018 2z"/>
            </IconSvg>
          )}
        </PlayPauseButton>
        
        <NextButton 
          aria-label="Next track"
          onClick={hasPlaylist ? onNext : undefined}
          disabled={!hasPlaylist}
        >
          <IconSvg viewBox="0 0 16 16" width="16" height="16">
            <path d="M11 3v4.119L3 2.5v11l8-4.619V13h2V3z"/>
          </IconSvg>
        </NextButton>
        
        <RepeatButton 
          aria-label={isRepeatEnabled ? "Disable repeat" : "Enable repeat"}
          onClick={onToggleRepeat}
          active={isRepeatEnabled}
        >
          <IconSvg viewBox="0 0 16 16" width="16" height="16">
            <path d="M5.5 5H10v1.5l3.5-2-3.5-2V4H5.5C3 4 1 6 1 8.5c0 .6.1 1.2.4 1.8l.9-.5C2.1 9.4 2 9 2 8.5 2 6.6 3.6 5 5.5 5zm9.1 1.7l-.9.5c.2.4.3.8.3 1.3 0 1.9-1.6 3.5-3.5 3.5H6v-1.5l-3.5 2 3.5 2V13h4.5C13 13 15 11 15 8.5c0-.6-.1-1.2-.4-1.8z"/>
          </IconSvg>
        </RepeatButton>
      </MainControlsWrapper>
      
      <SideControls>
        <VolumeControl>
          <IconSvg viewBox="0 0 16 16" width="16" height="16" style={{ opacity: 0.7 }}>
            <path d="M12.945 1.379l-.652.763c1.577 1.462 2.57 3.544 2.57 5.858s-.994 4.396-2.57 5.858l.651.763a8.966 8.966 0 00.001-13.242zm-2.272 2.66l-.651.763a4.484 4.484 0 01-.001 6.397l.651.763c1.04-1 1.691-2.404 1.691-3.961s-.65-2.962-1.69-3.962zM0 5v6h2.804L8 14V2L2.804 5H0zm7-1.268v8.536L3.072 10H1V6h2.072L7 3.732z"/>
          </IconSvg>
          <VolumeBar>
            <VolumeFill />
          </VolumeBar>
        </VolumeControl>
        
        <FullscreenButton 
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <IconSvg viewBox="0 0 16 16" width="16" height="16" style={{ opacity: 0.7 }}>
              <path d="M1 1h6v1H2v5H1V1zm5 14H1v-6h1v5h4v1zm9-1h-5v1h6v-6h-1v5zm0-13v5h1V1h-6v1h5z"/>
            </IconSvg>
          ) : (
            <IconSvg viewBox="0 0 16 16" width="16" height="16" style={{ opacity: 0.7 }}>
              <path d="M6.064 10.229l-2.418 2.418L2 11v4h4l-1.647-1.646 2.418-2.418-.707-.707zM11 2l1.647 1.647-2.418 2.418.707.707 2.418-2.418L15 6V2h-4z"/>
            </IconSvg>
          )}
        </FullscreenButton>
      </SideControls>
    </ControlsContainer>
  );
};

export default PlayerControls; 