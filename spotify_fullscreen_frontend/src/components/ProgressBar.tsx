import React, { useState, useRef } from 'react';
import styled from 'styled-components';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (position: number) => void;
}

const ProgressBarContainer = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #b3b3b3;
  margin-bottom: 8px;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
`;

const ProgressFill = styled.div<{ width: string }>`
  height: 100%;
  background-color: #fff;
  border-radius: 2px;
  width: ${props => props.width};
  position: relative;
  transition: width 0.1s ease;
`;

const ProgressHandle = styled.div<{ visible: boolean }>`
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

// Helper to format time in MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ currentTime, duration, onSeek }) => {
  const [isHovering, setIsHovering] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const progressPercentage = (currentTime / duration) * 100;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const clickPercentage = clickPosition / rect.width;
      const newTime = clickPercentage * duration;
      onSeek(newTime);
    }
  };

  return (
    <ProgressBarContainer>
      <TimeDisplay>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </TimeDisplay>
      <ProgressTrack 
        ref={progressRef}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <ProgressFill width={`${progressPercentage}%`}>
          <ProgressHandle visible={isHovering || false} />
        </ProgressFill>
      </ProgressTrack>
    </ProgressBarContainer>
  );
};

export default ProgressBar; 