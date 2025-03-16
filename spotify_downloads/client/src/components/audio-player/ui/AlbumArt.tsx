import React from 'react';
import styled, { keyframes, css } from 'styled-components';

interface AlbumArtProps {
  coverArt: string;
  altText: string;
  isFullScreen?: boolean;
  bassValue?: number;
  defaultCoverArt?: string;
  isTransitioning?: boolean;
}

// Animation keyframes
const rotateIn = keyframes`
  from {
    transform: rotate(-5deg) scale(0.95);
    opacity: 0.7;
  }
  to {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
`;

const floatAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

const AlbumArt: React.FC<AlbumArtProps> = ({
  coverArt,
  altText,
  isFullScreen = false,
  bassValue = 0,
  defaultCoverArt = '/default-cover.svg',
  isTransitioning = false
}) => {
  return (
    <ArtworkContainer isFullScreen={isFullScreen} isTransitioning={isTransitioning}>
      <Artwork
        src={coverArt}
        alt={altText}
        onError={(e) => {
          // Fallback to default if image fails to load
          const img = e.target as HTMLImageElement;
          if (img.src !== defaultCoverArt) {
            img.src = defaultCoverArt;
          }
        }}
        isFullScreen={isFullScreen}
        bassIntensity={bassValue}
        isTransitioning={isTransitioning}
      />
      <ReflectionWrapper isFullScreen={isFullScreen} isTransitioning={isTransitioning}>
        <Reflection
          src={coverArt}
          alt=""
          isFullScreen={isFullScreen}
          bassIntensity={bassValue}
          onError={(e) => {
            // Fallback to default if image fails to load
            const img = e.target as HTMLImageElement;
            if (img.src !== defaultCoverArt) {
              img.src = defaultCoverArt;
            }
          }}
        />
      </ReflectionWrapper>
    </ArtworkContainer>
  );
};

const ArtworkContainer = styled.div<{ isFullScreen: boolean; isTransitioning: boolean }>`
  position: relative;
  margin: ${props => props.isFullScreen ? '0 0 20px' : '0 10px 0 0'};
  width: ${props => props.isFullScreen ? '300px' : '180px'};
  height: ${props => props.isFullScreen ? '300px' : '180px'};
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  
  ${props => props.isTransitioning && css`
    animation: ${rotateIn} 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  `}
  
  ${props => props.isFullScreen && !props.isTransitioning && css`
    animation: ${floatAnimation} 6s ease-in-out infinite;
  `}
`;

const Artwork = styled.img<{ isFullScreen: boolean; bassIntensity: number; isTransitioning: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  transform: ${props => props.bassIntensity > 0.3 ? `scale(${1 + props.bassIntensity * 0.05})` : 'scale(1)'};
  
  ${props => props.isTransitioning && css`
    transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.8s ease;
    ${props.isFullScreen ? `
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
    ` : `
      box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
    `}
  `}
`;

const ReflectionWrapper = styled.div<{ isFullScreen: boolean; isTransitioning: boolean }>`
  position: absolute;
  bottom: -60%;
  left: 0;
  width: 100%;
  height: 60%;
  transform: scaleY(-1);
  opacity: ${props => props.isFullScreen ? 0.3 : 0};
  transition: all 0.5s ease;
  pointer-events: none;
  z-index: -1;
  
  ${props => props.isTransitioning && css`
    transition: opacity 1.2s ease;
    opacity: ${props.isFullScreen ? 0.3 : 0};
  `}
`;

const Reflection = styled.img<{ isFullScreen: boolean; bassIntensity: number }>`
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0));
  filter: blur(2px);
  transform: ${props => props.bassIntensity > 0.3 ? `scale(${1 + props.bassIntensity * 0.05})` : 'scale(1)'};
  transition: transform 0.1s ease;
`;

export default AlbumArt;
