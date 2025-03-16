import React from 'react';
import styled from 'styled-components';
import { formatTime } from '../utils/audioUtils';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  isFullScreen?: boolean;
  onSeek: (time: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  isFullScreen = false,
  onSeek
}) => {
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    onSeek(seekTime);
  };

  return (
    <ProgressContainer isFullScreen={isFullScreen}>
      <TimeDisplay isFullScreen={isFullScreen}>{formatTime(currentTime)}</TimeDisplay>
      <ProgressSlider 
        isFullScreen={isFullScreen}
        value={currentTime}
        max={duration || 1}
        onChange={handleSeek}
      />
      <TimeDisplay isFullScreen={isFullScreen}>{formatTime(duration)}</TimeDisplay>
    </ProgressContainer>
  );
};

const ProgressContainer = styled.div<{ isFullScreen: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: ${props => props.isFullScreen ? '40px' : '28px'};
  width: ${props => props.isFullScreen ? '80%' : '100%'};
  max-width: ${props => props.isFullScreen ? '1000px' : 'none'};
  padding: 6px 0;
`;

const TimeDisplay = styled.div<{ isFullScreen: boolean }>`
  font-size: ${props => props.isFullScreen ? '18px' : '14px'};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  width: ${props => props.isFullScreen ? '60px' : '50px'};
  text-align: center;
`;

interface SliderProps {
  value: number;
  max: number;
  isFullScreen: boolean;
}

const ProgressSlider = styled.input.attrs<SliderProps>(props => ({
  type: 'range',
  min: 0,
  max: props.max || 1,
  value: props.value || 0
}))<SliderProps>`
  flex: 1;
  height: ${props => props.isFullScreen ? '6px' : '4px'};
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  outline: none;
  position: relative;
  margin: 8px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: ${props => props.isFullScreen ? '20px' : '16px'};
    height: ${props => props.isFullScreen ? '20px' : '16px'};
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    margin-top: ${props => props.isFullScreen ? '-7px' : '-6px'};
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
    width: 16px;
    height: 16px;
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

export default ProgressBar; 