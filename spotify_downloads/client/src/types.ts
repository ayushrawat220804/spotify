// Common type definitions
export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string; // Use string | undefined consistently
}

export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string | null; // Server might return null, so keep this as is
} 