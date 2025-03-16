const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');

const router = express.Router();
router.use(cors());

// Initialize Google Drive API client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/callback'
);

// Set up Google Drive API
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Route to get files from Google Drive
router.post('/files', async (req, res) => {
  try {
    const { authCode } = req.body;
    
    // Exchange auth code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // List files from Google Drive
    const response = await drive.files.list({
      q: "mimeType contains 'audio/'",
      fields: 'files(id, name, webContentLink)',
      spaces: 'drive',
    });

    res.json({ files: response.data.files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files from Google Drive' });
  }
});

// Route to download a file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename=audio.mp3');

    // Pipe the audio stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file from Google Drive' });
  }
});

module.exports = router; 