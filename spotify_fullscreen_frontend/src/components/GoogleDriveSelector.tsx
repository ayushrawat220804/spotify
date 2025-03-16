import React, { useState } from 'react';
import styled from 'styled-components';

interface GoogleDriveSelectorProps {
  onFileSelect: (fileUrl: string, fileName: string) => void;
}

const GoogleDriveSelector: React.FC<GoogleDriveSelectorProps> = ({ onFileSelect }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const handleGoogleLogin = async () => {
    // Initialize Google Sign-In
    const client = google.accounts.oauth2.initCodeClient({
      client_id: '107347715450-odqja6gq772mbf51lunaji53gd3libmg.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: async (response) => {
        if (response.code) {
          // Handle the authentication code
          setIsAuthenticated(true);
          await fetchFiles(response.code);
        }
      },
    });

    client.requestCode();
  };

  const fetchFiles = async (authCode: string) => {
    try {
      // This would be handled by your backend
      const response = await fetch('http://localhost:5000/api/drive/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authCode }),
      });
      
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  return (
    <Container>
      {!isAuthenticated ? (
        <LoginButton onClick={handleGoogleLogin}>
          Connect Google Drive
        </LoginButton>
      ) : (
        <FileList>
          {files.map((file) => (
            <FileItem 
              key={file.id}
              onClick={() => onFileSelect(file.webContentLink, file.name)}
            >
              {file.name}
            </FileItem>
          ))}
        </FileList>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  margin: 20px;
`;

const LoginButton = styled.button`
  background: #1DB954;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #1ed760;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FileItem = styled.div`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export default GoogleDriveSelector; 