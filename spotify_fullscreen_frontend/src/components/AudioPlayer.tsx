import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Track } from '../mockData';

// Fixed cover art URL
const defaultCoverUrl = '/default-cover.svg';

interface AudioPlayerProps {
  onTrackLoad: (track: Track) => void;
  onPlaylistLoad: (tracks: Track[]) => void;
  onTimeUpdate: (currentTime: number) => void;
  onTrackEnd: () => void;
  isPlaying: boolean;
  currentTime: number;
  track: Track | null;
  isRepeatEnabled: boolean;
}

const AudioPlayer = forwardRef<HTMLInputElement, AudioPlayerProps>(({
  onTrackLoad,
  onPlaylistLoad,
  onTimeUpdate,
  onTrackEnd,
  isPlaying,
  currentTime,
  track,
  isRepeatEnabled
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Expose the file input ref
  useImperativeHandle(ref, () => fileInputRef.current!);

  // Process a single file and create a Track object
  const processFile = (file: File): Promise<Track> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      
      // Create a temporary audio element to get duration
      const tempAudio = new Audio(objectUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        // Create track object from file
        const newTrack: Track = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          artist: 'Unknown Artist', // Default value
          album: 'Unknown Album', // Default value
          duration: Math.floor(tempAudio.duration),
          coverArt: defaultCoverUrl, // Default cover art
          backgroundColor: '#000000',
          isPlaying: false,
          progress: 0,
          filePath: objectUrl
        };

        // Try to extract metadata from file name
        const filenameParts = newTrack.title.split(' - ');
        if (filenameParts.length > 1) {
          newTrack.artist = filenameParts[0].trim();
          newTrack.title = filenameParts[1].trim();
        }

        resolve(newTrack);
      });
      
      // Handle loading errors
      tempAudio.addEventListener('error', () => {
        resolve({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          coverArt: defaultCoverUrl,
          backgroundColor: '#000000',
          isPlaying: false,
          progress: 0,
          filePath: objectUrl
        });
      });
    });
  };

  // Handle file input change - process the selected MP3 files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const trackPromises = fileArray.map(file => processFile(file));
    const tracks = await Promise.all(trackPromises);
    
    // Set the first track as active
    if (tracks.length > 0) {
      const firstTrack = { ...tracks[0], isPlaying: true };
      setAudioSrc(firstTrack.filePath || null);
      onTrackLoad(firstTrack);
      
      // Load the entire playlist
      onPlaylistLoad(tracks);
    }
  };

  // Set loop property on audio element based on repeat setting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isRepeatEnabled;
    }
  }, [isRepeatEnabled]);

  // Update audio source when track changes
  useEffect(() => {
    if (track?.filePath && audioRef.current) {
      if (audioRef.current.src !== track.filePath) {
        setIsLoading(true);
        setAudioSrc(track.filePath);
        
        // Load the new audio source
        audioRef.current.load();
      }
    }
  }, [track]);

  // Handle audio load event
  const handleCanPlayThrough = () => {
    setIsLoading(false);
    
    // Start playing if isPlaying is true
    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play error:", error);
        });
      }
    }
  };

  // Control audio playback based on isPlaying prop
  useEffect(() => {
    if (audioRef.current && !isLoading) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => console.error("Playback error:", err));
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isLoading]);

  // Update current time when changed externally (e.g., when user drags progress bar)
  useEffect(() => {
    if (audioRef.current && !isLoading && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isLoading]);

  // Handle timeupdate event
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime);
    }
  };

  // Handle track ended event
  const handleEnded = () => {
    // Only call onTrackEnd if repeat is not enabled
    // If repeat is enabled, the audio element will automatically loop
    if (!isRepeatEnabled) {
      onTrackEnd();
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="audio/mp3,audio/*" 
        onChange={handleFileChange} 
        id="audio-file-input"
        multiple
      />
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlayThrough={handleCanPlayThrough}
        loop={isRepeatEnabled}
      />
    </div>
  );
});

export default AudioPlayer; 