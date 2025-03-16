import { Howl } from 'howler';

class AudioService {
  private sound: Howl | null = null;
  private currentTrackUrl: string = '';
  private volume: number = 0.8;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onLoadCallback: (() => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;
  
  constructor() {
    console.log('AudioService initialized');
  }
  
  sanitizeUrl(url: string): string {
    // Make sure the URL is properly formatted for the audio element
    if (url.startsWith('/')) {
      // Convert relative URL to absolute
      const baseUrl = window.location.origin;
      return `${baseUrl}${url}`;
    }
    
    // If it's a local file URL that doesn't start with the API prefix
    if (!url.startsWith('http') && !url.startsWith('/api/')) {
      return `/api/audio?path=${encodeURIComponent(url)}`;
    }
    
    return url;
  }
  
  loadTrack(url: string): void {
    console.log('Loading track, original URL:', url);
    const sanitizedUrl = this.sanitizeUrl(url);
    console.log('Sanitized URL:', sanitizedUrl);
    
    // Stop and unload current track if it exists
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
      this.sound = null;
    }
    
    this.currentTrackUrl = sanitizedUrl;
    
    // Create new Howl instance
    this.sound = new Howl({
      src: [sanitizedUrl],
      html5: true, // Force HTML5 Audio for streaming
      volume: this.volume,
      autoplay: false,
      format: ['mp3', 'wav', 'aac', 'ogg'],
      onplay: () => {
        console.log('Track playing:', sanitizedUrl);
        if (this.onPlayCallback) this.onPlayCallback();
      },
      onpause: () => {
        console.log('Track paused');
        if (this.onPauseCallback) this.onPauseCallback();
      },
      onend: () => {
        console.log('Track ended');
        if (this.onEndCallback) this.onEndCallback();
      },
      onload: () => {
        console.log('Track loaded successfully');
        if (this.onLoadCallback) this.onLoadCallback();
      },
      onloaderror: (id, error) => {
        console.error('Error loading track:', error);
        if (this.onErrorCallback) this.onErrorCallback(`Error loading track: ${error || 'Unknown error'}`);
      },
      onplayerror: (id, error) => {
        console.error('Error playing track:', error);
        if (this.onErrorCallback) this.onErrorCallback(`Error playing track: ${error || 'Unknown error'}`);
      }
    });
    
    // Try to load the audio
    try {
      // Load the audio (this triggers onload or onloaderror)
      this.sound.load();
    } catch (err) {
      console.error('Exception when loading audio:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Exception loading audio: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  
  play(): void {
    if (this.sound) {
      console.log('Attempting to play:', this.currentTrackUrl);
      try {
        this.sound.play();
      } catch (err) {
        console.error('Error playing sound:', err);
        if (this.onErrorCallback) {
          this.onErrorCallback(`Error playing sound: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      console.error('No track loaded');
      if (this.onErrorCallback) {
        this.onErrorCallback('No track loaded');
      }
    }
  }
  
  pause(): void {
    if (this.sound) {
      this.sound.pause();
    }
  }
  
  togglePlay(): void {
    if (!this.sound) {
      if (this.onErrorCallback) {
        this.onErrorCallback('No track loaded');
      }
      return;
    }
    
    if (this.sound.playing()) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  seek(position: number): void {
    if (this.sound) {
      this.sound.seek(position);
    }
  }
  
  setVolume(volume: number): void {
    this.volume = volume;
    if (this.sound) {
      this.sound.volume(volume);
    }
  }
  
  getDuration(): number {
    return this.sound ? this.sound.duration() : 0;
  }
  
  getCurrentTime(): number {
    return this.sound ? this.sound.seek() as number : 0;
  }
  
  isPlaying(): boolean {
    return this.sound ? this.sound.playing() : false;
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
  
  // Clean up when component unmounts
  dispose(): void {
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
      this.sound = null;
    }
    
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onEndCallback = null;
    this.onLoadCallback = null;
    this.onErrorCallback = null;
  }
}

// Export a singleton instance
export const audioService = new AudioService();
export default audioService; 