import { create } from 'zustand';
import { TrackMetadata } from '../types';
import AudioBufferManager from '../audio/AudioBufferManager';

// Update the TrackMetadata interface locally to add the url property
interface ExtendedTrackMetadata extends Omit<TrackMetadata, 'url'> {
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
}

interface AudioState {
  currentTrack: ExtendedTrackMetadata | null;
  playlist: ExtendedTrackMetadata[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
  repeatMode: number; // 0: no repeat, 1: repeat all, 2: repeat one
  audioManager: AudioBufferManager | null;
  dominantColor: string;
  isFullScreen: boolean;
  
  // Actions
  initializeAudioManager: () => void;
  setCurrentTrack: (track: ExtendedTrackMetadata | null) => void;
  setPlaylist: (tracks: ExtendedTrackMetadata[]) => void;
  togglePlay: () => void;
  setTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRepeatMode: (mode: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  cleanup: () => void;
}

// Go back to the simplest form of create
const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  loading: false,
  error: null,
  repeatMode: 0,
  audioManager: null,
  dominantColor: '#121212',
  isFullScreen: false,

  initializeAudioManager: () => {
    const audioManager = new AudioBufferManager();
    set({ audioManager });
  },

  setCurrentTrack: (track: ExtendedTrackMetadata | null) => {
    set({ currentTrack: track, loading: true, error: null });
    const { audioManager } = get();
    
    if (track && audioManager) {
      audioManager.loadAudio(track.url)
        .then((buffer: AudioBuffer) => {
          audioManager.play(buffer);
          set({ loading: false, isPlaying: true });
        })
        .catch((error: Error) => {
          set({ error: error.message, loading: false });
        });
    }
  },

  setPlaylist: (tracks: ExtendedTrackMetadata[]) => {
    set({ playlist: tracks });
  },

  togglePlay: () => {
    const { isPlaying, audioManager, currentTrack } = get();
    if (!audioManager || !currentTrack) return;

    if (isPlaying) {
      audioManager.stop();
    } else {
      audioManager.loadAudio(currentTrack.url)
        .then((buffer: AudioBuffer) => audioManager.play(buffer, get().currentTime))
        .catch((error: Error) => set({ error: error.message }));
    }
    set({ isPlaying: !isPlaying });
  },

  setTime: (time: number) => {
    const { audioManager, currentTrack } = get();
    set({ currentTime: time });

    if (audioManager && currentTrack) {
      audioManager.stop();
      audioManager.loadAudio(currentTrack.url)
        .then((buffer: AudioBuffer) => {
          if (get().isPlaying) {
            audioManager.play(buffer, time);
          }
        })
        .catch((error: Error) => set({ error: error.message }));
    }
  },

  setVolume: (volume: number) => {
    const { audioManager } = get();
    if (audioManager) {
      audioManager.setVolume(volume);
    }
    set({ volume });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setRepeatMode: (mode: number) => set({ repeatMode: mode }),

  nextTrack: () => {
    const { currentTrack, playlist, repeatMode } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((track: ExtendedTrackMetadata) => track.url === currentTrack.url);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= playlist.length) {
      if (repeatMode === 1) { // repeat all
        nextIndex = 0;
      } else {
        return;
      }
    }

    get().setCurrentTrack(playlist[nextIndex]);
  },

  previousTrack: () => {
    const { currentTrack, playlist } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((track: ExtendedTrackMetadata) => track.url === currentTrack.url);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      get().setCurrentTrack(playlist[prevIndex]);
    }
  },

  cleanup: () => {
    const { audioManager } = get();
    if (audioManager) {
      audioManager.dispose();
    }
    set({ audioManager: null });
  }
}));

export default useAudioStore; 