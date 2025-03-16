const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const { google } = require('googleapis');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Store music data
let musicLibrary = [];
let musicFolders = [];

// Initialize Google Drive API client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/callback'
);

// Set up Google Drive API
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
// Get all tracks
app.get('/api/tracks', (req, res) => {
  res.json(musicLibrary);
});

// Add a music folder to scan
app.post('/api/folders', async (req, res) => {
  const { folderPath } = req.body;
  
  if (!folderPath) {
    return res.status(400).json({ error: 'Folder path is required' });
  }

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  // Add to folders list if not already there
  if (!musicFolders.includes(folderPath)) {
    musicFolders.push(folderPath);
    
    // Start scanning the folder
    await scanMusicFolder(folderPath);
    
    return res.status(200).json({ message: 'Folder added successfully', folderPath });
  }
  
  return res.status(200).json({ message: 'Folder already exists', folderPath });
});

// Get all music folders
app.get('/api/folders', (req, res) => {
  res.json(musicFolders);
});

// Route to get files from Google Drive
app.post('/api/drive/files', async (req, res) => {
  try {
    console.log('Received auth code request');
    const { authCode } = req.body;
    
    if (!authCode) {
      return res.status(400).json({ error: 'Auth code is required' });
    }
    
    console.log('Getting tokens with auth code');
    // Exchange auth code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    console.log('Listing files from Google Drive');
    // List files from Google Drive
    const response = await drive.files.list({
      q: "mimeType contains 'audio/'",
      fields: 'files(id, name, webContentLink)',
      spaces: 'drive',
    });

    console.log(`Found ${response.data.files.length} audio files`);
    res.json({ files: response.data.files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files from Google Drive',
      details: error.message
    });
  }
});

// Route to download a file
app.get('/api/drive/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`Downloading file ${fileId}`);
    
    // Get metadata first to determine file type
    const metadata = await drive.files.get({
      fileId,
      fields: 'name,mimeType'
    });
    
    console.log(`File type: ${metadata.data.mimeType}, Name: ${metadata.data.name}`);
    
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', metadata.data.mimeType || 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.data.name || 'audio.mp3'}"`);

    // Pipe the audio stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      error: 'Failed to download file from Google Drive',
      details: error.message
    });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Dynamic import for ESM modules
let mm;
(async () => {
  mm = await import('music-metadata');
})();

// Function to scan a music folder
async function scanMusicFolder(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    
    // Ensure mm is loaded
    if (!mm) {
      mm = await import('music-metadata');
    }
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // Recursively scan subfolders
        await scanMusicFolder(filePath);
      } else {
        // Check if file is a music file
        const ext = path.extname(filePath).toLowerCase();
        if (['.mp3', '.m4a', '.flac', '.wav', '.ogg', '.aac'].includes(ext)) {
          try {
            // Parse metadata
            const metadata = await mm.parseFile(filePath);
            
            // Create track object
            const track = {
              id: Buffer.from(filePath).toString('base64'),
              title: metadata.common.title || path.basename(filePath, ext),
              artist: metadata.common.artist || 'Unknown Artist',
              album: metadata.common.album || 'Unknown Album',
              year: metadata.common.year,
              genre: metadata.common.genre ? metadata.common.genre[0] : 'Unknown',
              duration: metadata.format.duration,
              path: filePath,
              coverArt: metadata.common.picture && metadata.common.picture.length > 0 
                ? `data:${metadata.common.picture[0].format};base64,${metadata.common.picture[0].data.toString('base64')}`
                : null
            };
            
            // Check if track already exists in library
            const existingIndex = musicLibrary.findIndex(t => t.path === filePath);
            if (existingIndex >= 0) {
              // Update existing track
              musicLibrary[existingIndex] = track;
            } else {
              // Add new track
              musicLibrary.push(track);
            }

            console.log(`Added track: ${track.title} by ${track.artist}`);
          } catch (error) {
            console.error(`Error parsing metadata for ${filePath}:`, error.message);
          }
        }
      }
    }
    
    console.log(`Finished scanning ${folderPath}. Total tracks: ${musicLibrary.length}`);
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error.message);
  }
}

// Endpoint to stream music files
app.get('/api/stream/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    // Decode the base64 ID to get the file path
    const filePath = Buffer.from(id, 'base64').toString();
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const fileStream = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });
      
      fileStream.pipe(res);
    } else {
      // Handle non-range requests
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error.message);
    res.status(500).json({ error: 'Error streaming file' });
  }
});

// New endpoint to stream directly by audio path
app.get('/api/audio', (req, res) => {
  const { path: audioPath } = req.query;
  
  if (!audioPath) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }
  
  try {
    // Decode the URI component to get the original path
    const decodedPath = decodeURIComponent(audioPath);
    
    // Normalize path to handle both forward and back slashes
    const normalizedPath = path.normalize(decodedPath);
    
    console.log(`Streaming audio file from path: ${normalizedPath}`);
    
    if (!fs.existsSync(normalizedPath)) {
      console.error(`File not found: ${normalizedPath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file stats
    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const fileStream = fs.createReadStream(normalizedPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });
      
      fileStream.pipe(res);
    } else {
      // Handle non-range requests
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      
      fs.createReadStream(normalizedPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file by path:', error.message);
    res.status(500).json({ error: 'Error streaming file', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Google Drive API client initialized with client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 10)}...`);
}); 