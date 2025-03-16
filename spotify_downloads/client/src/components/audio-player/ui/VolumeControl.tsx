import React from 'react';
import styled from 'styled-components';
import { IoMdVolumeHigh, IoMdVolumeLow, IoMdVolumeOff } from 'react-icons/io';

interface VolumeControlProps {
  volume: number;
  isFullScreen?: boolean;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isFullScreen = false,
  onVolumeChange
}) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };
  
  const handleMuteToggle = () => {
    onVolumeChange(volume > 0 ? 0 : 0.8);
  };

  return (
    <VolumeContainer isFullScreen={isFullScreen}>
      <VolumeIcon 
        isFullScreen={isFullScreen}
        onClick={handleMuteToggle}
        muted={volume === 0}
      >
        {volume === 0 ? (
          <IoMdVolumeOff size={isFullScreen ? 32 : 24} />
        ) : volume < 0.5 ? (
          <IoMdVolumeLow size={isFullScreen ? 32 : 24} />
        ) : (
          <IoMdVolumeHigh size={isFullScreen ? 32 : 24} />
        )}
      </VolumeIcon>
      
      <SliderWrapper isFullScreen={isFullScreen}>
        <VolumeSlider 
          isFullScreen={isFullScreen}
          value={volume}
          max={1}
          onChange={handleVolumeChange}
        />
      </SliderWrapper>
    </VolumeContainer>
  );
};

const VolumeContainer = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.isFullScreen ? '8px' : '6px'};
  height: ${props => props.isFullScreen ? '32px' : '24px'};
  transform: translateY(-1px); /* Fine adjustment to align with other controls */
  margin-left: ${props => props.isFullScreen ? '60px' : '45px'}; /* Increased spacing to shift further right */
`;

const VolumeIcon = styled.button<{ isFullScreen: boolean; muted: boolean }>`
  background: none;
  border: none;
  color: ${props => props.muted ? 'rgba(255, 255, 255, 0.7)' : 'white'};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: ${props => props.isFullScreen ? '32px' : '24px'};
  
  &:hover {
    color: #1DB954;
    transform: scale(1.08);
    text-shadow: 0 0 10px rgba(29, 185, 84, 0.7);
  }
`;

const SliderWrapper = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  width: ${props => props.isFullScreen ? '150px' : '120px'};
`;

interface SliderProps {
  value: number;
  max: number;
  isFullScreen: boolean;
}

const VolumeSlider = styled.input.attrs<SliderProps>(props => ({
  type: 'range',
  min: 0,
  max: props.max || 1,
  value: props.value || 0,
  step: 0.01
}))<SliderProps>`
  width: 100%;
  height: ${props => props.isFullScreen ? '6px' : '4px'};
  -webkit-appearance: none;
  background: transparent;
  border-radius: 3px;
  outline: none;
  position: relative;
  margin: 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: ${props => props.isFullScreen ? '16px' : '14px'};
    height: ${props => props.isFullScreen ? '16px' : '14px'};
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    margin-top: ${props => props.isFullScreen ? '-5px' : '-5px'};
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
    width: ${props => props.isFullScreen ? '16px' : '14px'};
    height: ${props => props.isFullScreen ? '16px' : '14px'};
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

export default VolumeControl;
