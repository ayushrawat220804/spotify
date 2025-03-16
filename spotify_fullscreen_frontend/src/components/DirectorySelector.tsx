import React, { useState, useRef } from 'react';
import styled from 'styled-components';

interface DirectorySelectorProps {
  onSelectMusicDir: (dir: string) => void;
  onSelectArtworkDir: (dir: string) => void;
  onLoadMetadata: () => void;
  onClose: () => void;
  musicDir: string;
  artworkDir: string;
  isLoading: boolean;
}

const SelectorContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #282828;
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  max-width: 90vw;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-top: 0;
  margin-bottom: 16px;
`;

const FileInput = styled.div`
  margin-bottom: 24px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #b3b3b3;
`;

const UploadButton = styled.label`
  display: block;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1ed760;
    transform: translateY(-2px);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? '#1DB954' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#b3b3b3'};
  border: ${props => props.primary ? 'none' : '1px solid #b3b3b3'};
  border-radius: 20px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  
  &:hover {
    background-color: ${props => props.primary ? '#1ed760' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.primary ? 'white' : 'white'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #b3b3b3;
  margin: 16px 0;
  line-height: 1.4;
`;

const FilesList = styled.div`
  margin-top: 16px;
  max-height: 150px;
  overflow-y: auto;
  background-color: #333;
  border-radius: 4px;
  padding: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #444;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
  }
`;

const FileItem = styled.div`
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FileIcon = styled.span`
  color: #1DB954;
  margin-right: 6px;
`;

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  onClose,
  isLoading,
  onLoadMetadata,
  onSelectMusicDir,
  onSelectArtworkDir
}) => {
  const [selectedMusicFiles, setSelectedMusicFiles] = useState<File[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const handleMusicFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and filter for MP3 files
      const fileArray = Array.from(files).filter(file => 
        file.name.toLowerCase().endsWith('.mp3')
      );
      
      setSelectedMusicFiles(fileArray);
      
      // Create a virtual directory path for the MP3 files
      const virtualMusicDir = '/virtual/music';
      
      // Inform the parent component about the selected "directory"
      onSelectMusicDir(virtualMusicDir);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and filter for image files
      const fileArray = Array.from(files).filter(file => 
        file.name.toLowerCase().endsWith('.jpg') || 
        file.name.toLowerCase().endsWith('.jpeg') || 
        file.name.toLowerCase().endsWith('.png')
      );
      
      setSelectedImageFiles(fileArray);
      
      // Create a virtual directory path for the image files
      const virtualImageDir = '/virtual/images';
      
      // Inform the parent component about the selected "directory"
      onSelectArtworkDir(virtualImageDir);
    }
  };

  const handleSubmit = () => {
    // In a real application, you would:
    // 1. Upload the selected files to a temporary storage or process them client-side
    // 2. Create a virtual file system or organize them in memory
    
    // For now, just call onLoadMetadata to proceed with the simulation
    onLoadMetadata();
  };

  return (
    <SelectorContainer>
      <Title>Upload Your Music & Artwork</Title>
      
      <InfoText>
        Select MP3 files and artwork images to use in the player. The application 
        will attempt to match MP3s with artwork based on naming patterns.
      </InfoText>
      
      <FileInput>
        <InputLabel>Select MP3 Files</InputLabel>
        <HiddenFileInput 
          ref={musicFileInputRef}
          type="file"
          accept=".mp3,audio/*"
          multiple
          onChange={handleMusicFileSelect}
        />
        <UploadButton htmlFor={musicFileInputRef.current?.id || 'music-file-input'}>
          <span>📂 Choose MP3 Files</span>
        </UploadButton>
        
        {selectedMusicFiles.length > 0 && (
          <FilesList>
            {selectedMusicFiles.map((file, index) => (
              <FileItem key={index}>
                <div><FileIcon>🎵</FileIcon> {file.name}</div>
                <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </FileItem>
            ))}
          </FilesList>
        )}
      </FileInput>
      
      <FileInput>
        <InputLabel>Select Artwork Images</InputLabel>
        <HiddenFileInput 
          ref={imageFileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/*"
          multiple
          onChange={handleImageFileSelect}
        />
        <UploadButton htmlFor={imageFileInputRef.current?.id || 'image-file-input'}>
          <span>📂 Choose Image Files</span>
        </UploadButton>
        
        {selectedImageFiles.length > 0 && (
          <FilesList>
            {selectedImageFiles.map((file, index) => (
              <FileItem key={index}>
                <div><FileIcon>🖼️</FileIcon> {file.name}</div>
                <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </FileItem>
            ))}
          </FilesList>
        )}
      </FileInput>
      
      <InfoText>
        <strong>Pro Tip:</strong> For best results, name your artwork images to 
        match your MP3 files (e.g., "Artist - Song.mp3" and "Artist - Song.jpg").
      </InfoText>
      
      <ButtonContainer>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          primary 
          onClick={handleSubmit}
          disabled={isLoading || (selectedMusicFiles.length === 0 && selectedImageFiles.length === 0)}
        >
          {isLoading ? 'Loading...' : 'Import Music'}
        </Button>
      </ButtonContainer>
    </SelectorContainer>
  );
};

export default DirectorySelector; 