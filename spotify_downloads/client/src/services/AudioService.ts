/**
 * Enhanced Audio Service
 * 
 * A robust audio service that wraps the native Audio API
 * with improved error handling and better playback support
 */

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private currentTrackUrl: string = '';
  private volume: number = 0.8;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onLoadCallback: (() => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;
  private onTimeUpdateCallback: (() => void) | null = null;
  
  constructor() {
    console.log('AudioService initialized');
    this.initAudio();
  }
  
  private initAudio(): void {
    // Create a new audio element
    this.audio = new Audio();
    
    // Set initial volume
    this.audio.volume = this.volume;
    
    // Add event listeners
    this.audio.addEventListener('play', () => {
      console.log('Audio event: play');
      if (this.onPlayCallback) this.onPlayCallback();
    });
    
    this.audio.addEventListener('pause', () => {
      console.log('Audio event: pause');
      if (this.onPauseCallback) this.onPauseCallback();
    });
    
    this.audio.addEventListener('ended', () => {
      console.log('Audio event: ended');
      if (this.onEndCallback) this.onEndCallback();
    });
    
    this.audio.addEventListener('loadedmetadata', () => {
      console.log('Audio event: loadedmetadata');
      if (this.onLoadCallback) this.onLoadCallback();
    });
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio event: error', this.audio?.error);
      let errorMessage = 'Unknown audio error';
      
      if (this.audio?.error) {
        switch (this.audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted by the user';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - please check your connection';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decoding error - file might be corrupted';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
          default:
            errorMessage = `Audio error: ${this.audio.error.message || 'unknown'}`;
        }
      }
      
      if (this.onErrorCallback) this.onErrorCallback(errorMessage);
    });
    
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) this.onTimeUpdateCallback();
    });
  }
  
  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    console.log('Sanitizing URL:', url);
    
    // If it's already a full URL, return it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's already an API path, return it as is
    if (url.startsWith('/api/')) {
      return url;
    }
    
    // If it's a Windows path, ensure it's properly formatted
    // Replace backslashes with forward slashes for the URL
    let formattedPath = url.replace(/\\/g, '/');
    
    // Make sure the path is properly encoded for URLs
    formattedPath = encodeURIComponent(formattedPath);
    
    // Return the full API URL
    const finalUrl = `/api/audio?path=${formattedPath}`;
    console.log('Formatted URL:', finalUrl);
    return finalUrl;
  }
  
  loadTrack(url: string): void {
    if (!this.audio) {
      this.initAudio();
    }
    
    if (!this.audio) {
      console.error('Failed to initialize audio element');
      if (this.onErrorCallback) this.onErrorCallback('Failed to initialize audio player');
      return;
    }
    
    console.log('Loading track, original URL:', url);
    const sanitizedUrl = this.sanitizeUrl(url);
    console.log('Sanitized URL:', sanitizedUrl);
    
    // Stop current track
    this.audio.pause();
    
    // Clean up current audio source
    this.audio.src = '';
    this.audio.removeAttribute('src');
    this.audio.load();
    
    // Small delay to ensure proper cleanup
    setTimeout(() => {
      if (!this.audio) return;
      
      try {
        // Set new track URL
        this.currentTrackUrl = sanitizedUrl;
        this.audio.src = sanitizedUrl;
        this.audio.load();
        
        console.log('Audio source set successfully');
      } catch (err) {
        console.error('Error setting audio source:', err);
        if (this.onErrorCallback) {
          this.onErrorCallback(`Error setting up audio: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }, 100);
  }
  
  play(): void {
    if (!this.audio) return;
    
    console.log('Attempting to play:', this.currentTrackUrl);
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('Error playing audio:', err);
        if (this.onErrorCallback) {
          this.onErrorCallback(`Error playing audio: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    }
  }
  
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }
  
  togglePlay(): void {
    if (!this.audio) return;
    
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }
  
  seek(position: number): void {
    if (this.audio) {
      this.audio.currentTime = position;
    }
  }
  
  setVolume(volume: number): void {
    this.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
  }
  
  getDuration(): number {
    return this.audio ? this.audio.duration || 0 : 0;
  }
  
  getCurrentTime(): number {
    return this.audio ? this.audio.currentTime || 0 : 0;
  }
  
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }
  
  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
  
  onPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }
  
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }
  
  onLoad(callback: () => void): void {
    this.onLoadCallback = callback;
  }
  
  onError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }
  
  onTimeUpdate(callback: () => void): void {
    this.onTimeUpdateCallback = callback;
  }
  
  // Clean up when component unmounts
  dispose(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.removeAttribute('src');
      this.audio.load();
      
      // Remove all event listeners
      this.audio.onplay = null;
      this.audio.onpause = null;
      this.audio.onended = null;
      this.audio.onloadedmetadata = null;
      this.audio.onerror = null;
      this.audio.ontimeupdate = null;
      
      this.audio = null;
    }
    
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onEndCallback = null;
    this.onLoadCallback = null;
    this.onErrorCallback = null;
    this.onTimeUpdateCallback = null;
  }
}

// Export a singleton instance
export const audioService = new AudioService();
export default audioService; 