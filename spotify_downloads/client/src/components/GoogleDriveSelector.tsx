import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Define types
interface File {
  id: string;
  name: string;
  webContentLink: string;
}

interface GoogleDriveSelectorProps {
  onFileSelect: (fileUrl: string, fileName: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleDriveSelector: React.FC<GoogleDriveSelectorProps> = ({ onFileSelect }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Create a new script element
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Identity Services SDK loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services SDK');
      setError('Failed to load Google authentication. Please try again later.');
    };
    
    // Add it to the document
    document.body.appendChild(script);

    // Clean up
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!scriptLoaded) {
      setError('Google authentication is still loading. Please try again in a moment.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Initializing Google Sign-In...');
      // Initialize Google Sign-In
      window.google.accounts.oauth2.initCodeClient({
        client_id: '107347715450-odqja6gq772mbf51lunaji53gd3libmg.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (response: any) => {
          if (response.code) {
            try {
              console.log('Authentication successful, fetching files...');
              // Exchange the auth code for files
              const apiResponse = await fetch('http://localhost:5000/api/drive/files', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ authCode: response.code }),
              });
              
              if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.details || `Failed to fetch files: ${apiResponse.statusText}`);
              }
              
              const data = await apiResponse.json();
              console.log(`Received ${data.files?.length || 0} files from server`);
              setFiles(data.files || []);
              setIsAuthenticated(true);
              setLoading(false);
            } catch (err: any) {
              console.error('Error fetching files:', err);
              setError(err.message || 'Failed to fetch files');
              setLoading(false);
            }
          } else {
            console.error('No authorization code received');
            setError('Authentication failed - no authorization code received');
            setLoading(false);
          }
        },
        error_callback: (error: any) => {
          console.error('Auth error:', error);
          setError('Authentication failed: ' + (error.message || 'Unknown error'));
          setLoading(false);
        }
      }).requestCode();
    } catch (err: any) {
      console.error('Failed to initialize Google Sign-In:', err);
      setError('Failed to initialize Google Sign-In: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // Create a URL for the file that goes through our proxy
    const fileUrl = `http://localhost:5000/api/drive/download/${file.id}`;
    onFileSelect(fileUrl, file.name);
  };

  return (
    <Container>
      <h2>Google Drive Music</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {!isAuthenticated ? (
        <LoginButton 
          onClick={handleGoogleLogin} 
          disabled={loading || !scriptLoaded}
        >
          {loading ? 'Connecting...' : 'Connect Google Drive'}
        </LoginButton>
      ) : (
        <>
          <FileCount>{files.length} audio files found</FileCount>
          
          {files.length === 0 ? (
            <NoFiles>No audio files found in your Google Drive</NoFiles>
          ) : (
            <FileList>
              {files.map((file) => (
                <FileItem 
                  key={file.id}
                  onClick={() => handleFileSelect(file)}
                >
                  {file.name}
                </FileItem>
              ))}
            </FileList>
          )}
        </>
      )}

      {loading && (
        <LoadingIndicator>Loading...</LoadingIndicator>
      )}
    </Container>
  );
};

const Container = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
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
  display: block;
  margin: 20px auto;

  &:hover {
    background: #1ed760;
  }

  &:disabled {
    background: #1db95480;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 15px;
  padding-right: 10px;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

const FileItem = styled.div`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const FileCount = styled.div`
  margin: 15px 0;
  color: rgba(255, 255, 255, 0.7);
`;

const NoFiles = styled.div`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin: 20px 0;
`;

export default GoogleDriveSelector; 