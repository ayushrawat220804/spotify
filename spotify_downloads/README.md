# Local Spotify Clone

A web-based music player application that looks and feels like Spotify but plays your local music files.

## Features

- Modern Spotify-like UI
- Local music file playback
- Music library scanning and organization
- Album artwork display
- Playlist creation and management
- Search functionality
- Audio visualization
- Dark mode

## Technology Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Music Metadata: music-metadata library
- Audio Playback: howler.js

## Getting Started

### Prerequisites

- Node.js 14+ installed
- npm or yarn

### Installation

1. Clone this repository
2. Install frontend dependencies:
   ```
   cd client
   npm install
   ```
3. Install backend dependencies:
   ```
   cd ../server
   npm install
   ```
4. Start the backend server:
   ```
   npm start
   ```
5. Start the frontend development server:
   ```
   cd ../client
   npm start
   ```

## How It Works

The application scans your specified local music directories, extracts metadata from your music files, and displays them in a Spotify-like interface. All playback happens locally in your browser without any streaming service requirements. 