export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string | null; // Now accepts null
}

export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string | null;
} 