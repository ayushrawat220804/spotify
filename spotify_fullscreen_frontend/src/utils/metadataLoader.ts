import { Track } from '../mockData';

interface SongMetadata {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  file_prefix: string;
  has_artwork: boolean;
  has_background: boolean;
  artwork_path: string | null;
  background_path: string | null;
}

interface MetadataFile {
  songs: SongMetadata[];
  failed_songs: string[];
  last_processed_index: number;
}

/**
 * Clean and normalize a file path for consistent use
 * @param path The file path to normalize
 * @returns Normalized file path
 */
const normalizePath = (path: string): string => {
  // Replace backslashes with forward slashes for consistency
  let normalized = path.replace(/\\/g, '/');
  
  // Ensure the path ends with a slash
  if (!normalized.endsWith('/')) {
    normalized += '/';
  }
  
  return normalized;
};

/**
 * Load metadata from the specified directory
 * @param artworkDir The directory containing the metadata.json file and artwork
 * @returns Promise resolving to the metadata object or null if not found
 */
export const loadMetadata = async (artworkDir: string): Promise<MetadataFile | null> => {
  try {
    // Normalize the artwork directory path
    const normalizedArtworkDir = normalizePath(artworkDir);
    
    // In a real implementation, you would use the File System API or Node.js fs module
    // to read the metadata.json file from the artwork directory
    
    // For demonstration, we'll simulate loading metadata
    console.log(`Loading metadata from ${normalizedArtworkDir}metadata.json`);
    
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a dummy metadata object - in a real app you would parse the actual JSON file
    return {
      songs: [
        {
          track_id: '1',
          title: 'KEROSENE',
          artist: '6YNTHMANE',
          album: 'KEROSENE',
          file_prefix: '6YNTHMANE - KEROSENE',
          has_artwork: true,
          has_background: true,
          artwork_path: 'artwork/6YNTHMANE - KEROSENE.jpg',
          background_path: 'background/6YNTHMANE - KEROSENE_bg.jpg'
        },
        {
          track_id: '2',
          title: 'PHONKY TOWN',
          artist: 'PlayaPhonk',
          album: 'PHONKY TOWN',
          file_prefix: 'PlayaPhonk - PHONKY TOWN',
          has_artwork: true,
          has_background: true,
          artwork_path: 'artwork/PlayaPhonk - PHONKY TOWN.jpg',
          background_path: 'background/PlayaPhonk - PHONKY TOWN_bg.jpg'
        }
      ],
      failed_songs: [],
      last_processed_index: 1
    };
  } catch (error) {
    console.error('Error loading metadata:', error);
    return null;
  }
};

/**
 * Scan the music directory for MP3 files
 * @param musicDir The directory containing MP3 files
 * @returns Promise resolving to an array of filenames
 */
export const scanMusicDirectory = async (musicDir: string): Promise<string[]> => {
  try {
    // Normalize the music directory path
    const normalizedMusicDir = normalizePath(musicDir);
    
    // In a real implementation, you would use the File System API or Node.js fs module
    // to list all files in the music directory and filter for MP3 files
    
    // For demonstration, we'll simulate finding MP3 files
    console.log(`Scanning music directory: ${normalizedMusicDir}`);
    
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return dummy MP3 filenames
    return [
      '6YNTHMANE - KEROSENE.mp3',
      'PlayaPhonk - PHONKY TOWN.mp3'
    ];
  } catch (error) {
    console.error('Error scanning music directory:', error);
    return [];
  }
};

/**
 * Create a file URL for local files that works in the browser
 * @param basePath Base directory path
 * @param relativePath Relative path to the file
 * @returns A URL that can be used in browser contexts
 */
const createFileUrl = (basePath: string, relativePath: string): string => {
  const normalizedBase = normalizePath(basePath);
  
  // For browser security reasons, file:// URLs may not work properly in all contexts
  // This is a simplified approach for demonstration purposes
  
  // In a real application with Electron or a backend server, you would:
  // 1. In Electron: Use actual file:// URLs with proper path resolution
  // 2. With a backend: Create a route that serves the files and return URLs to that route
  
  // For now, return a path that at least looks like a proper file URL
  return `file://${normalizedBase}${relativePath}`;
};

/**
 * Create Track objects by matching MP3 files with metadata
 * @param musicDir The directory containing MP3 files
 * @param artworkDir The directory containing artwork and metadata
 * @param metadata The metadata object
 * @param mp3Files The array of MP3 filenames
 * @returns Promise resolving to an array of Track objects
 */
export const createTracksFromMetadata = async (
  musicDir: string,
  artworkDir: string,
  metadata: MetadataFile,
  mp3Files: string[]
): Promise<Track[]> => {
  try {
    const normalizedMusicDir = normalizePath(musicDir);
    const normalizedArtworkDir = normalizePath(artworkDir);
    
    // For each MP3 file, find matching metadata and create a Track object
    const tracks: Track[] = [];
    
    for (const mp3File of mp3Files) {
      // Remove the .mp3 extension to get the base filename
      const baseFilename = mp3File.replace(/\.mp3$/, '');
      
      // Find matching metadata
      const songMetadata = metadata.songs.find(song => 
        song.file_prefix === baseFilename || 
        `${song.artist} - ${song.title}` === baseFilename
      );
      
      if (songMetadata) {
        // Create a Track object
        const track: Track = {
          id: songMetadata.track_id,
          title: songMetadata.title,
          artist: songMetadata.artist,
          album: songMetadata.album,
          duration: 180, // Default duration (would be read from the MP3 file)
          coverArt: songMetadata.has_artwork 
            ? createFileUrl(normalizedArtworkDir, songMetadata.artwork_path)
            : '/default-cover.svg',
          backgroundColor: '#000000',
          isPlaying: false,
          progress: 0,
          filePath: createFileUrl(normalizedMusicDir, mp3File),
          // Add background image if available
          backgroundImage: songMetadata.has_background
            ? createFileUrl(normalizedArtworkDir, songMetadata.background_path)
            : undefined
        };
        
        tracks.push(track);
      } else {
        // Create a Track with limited info from the filename
        const parts = baseFilename.split(' - ');
        const artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
        const title = parts.length > 1 ? parts[1] : baseFilename;
        
        const track: Track = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title,
          artist,
          album: 'Unknown Album',
          duration: 180, // Default duration
          coverArt: '/default-cover.svg',
          backgroundColor: '#000000',
          isPlaying: false,
          progress: 0,
          filePath: createFileUrl(normalizedMusicDir, mp3File)
        };
        
        tracks.push(track);
      }
    }
    
    return tracks;
  } catch (error) {
    console.error('Error creating tracks from metadata:', error);
    return [];
  }
};

/**
 * Load tracks from the specified directories
 * @param musicDir The directory containing MP3 files
 * @param artworkDir The directory containing artwork and metadata
 * @returns Promise resolving to an array of Track objects
 */
export const loadTracksFromDirectories = async (
  musicDir: string,
  artworkDir: string
): Promise<Track[]> => {
  try {
    // Load metadata from artwork directory
    const metadata = await loadMetadata(artworkDir);
    
    if (!metadata) {
      console.warn('No metadata found. Will attempt to load MP3s with limited info.');
    }
    
    // Scan music directory for MP3 files
    const mp3Files = await scanMusicDirectory(musicDir);
    
    if (mp3Files.length === 0) {
      console.error('No MP3 files found in the specified directory.');
      return [];
    }
    
    // Create Track objects by matching MP3 files with metadata
    if (metadata) {
      return await createTracksFromMetadata(musicDir, artworkDir, metadata, mp3Files);
    } else {
      // Create Track objects with limited info from filenames
      const normalizedMusicDir = normalizePath(musicDir);
      
      return mp3Files.map(mp3File => {
        const baseFilename = mp3File.replace(/\.mp3$/, '');
        const parts = baseFilename.split(' - ');
        const artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
        const title = parts.length > 1 ? parts[1] : baseFilename;
        
        return {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title,
          artist,
          album: 'Unknown Album',
          duration: 180, // Default duration
          coverArt: '/default-cover.svg',
          backgroundColor: '#000000',
          isPlaying: false,
          progress: 0,
          filePath: createFileUrl(normalizedMusicDir, mp3File)
        };
      });
    }
  } catch (error) {
    console.error('Error loading tracks from directories:', error);
    return [];
  }
}; 