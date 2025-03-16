export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverArt: string;
  backgroundColor: string;
  isPlaying: boolean;
  progress: number; // in seconds
  filePath?: string; // URL to the audio file
  backgroundImage?: string; // Add backgroundImage property
}

export const defaultTrack: Track = {
  id: 'default',
  title: 'No Track Selected',
  artist: 'Unknown Artist',
  album: 'Unknown Album',
  duration: 0,
  coverArt: '/default-cover.svg',
  backgroundColor: '#121212',
  isPlaying: false,
  progress: 0
};

export const mockTrackData: Track = {
  id: '5NFUH8Kprd2JyAaeuz8365',
  title: 'BRAZILIAN DANÇA PHONK',
  artist: '6YNTHMANE',
  album: 'BRAZILIAN DANÇA PHONK',
  duration: 118, // 1:58
  coverArt: 'https://mosaic.scdn.co/640/ab67616d00001e02577ca58a6c3bceac0d9e0a79ab67616d00001e0272300c29d347150ff2301b81ab67616d00001e02ac8244d923a12389d49ac8d9ab67616d00001e02b6f57b1f7a85ec52fbfb997f',
  backgroundColor: '#000000',
  isPlaying: true,
  progress: 9
};

export const playlistData = [
  mockTrackData,
  {
    id: '43QJUld27UfsrpGZVhhTpe',
    title: 'MURDER IN MY MIND',
    artist: 'Kordhell',
    album: 'MURDER IN MY MIND',
    duration: 156, // 2:36
    coverArt: 'https://i.scdn.co/image/ab67616d0000b273db3631da86e10391947a5973',
    backgroundColor: '#202020',
    isPlaying: false,
    progress: 0
  },
  {
    id: '4J4me8ujHGnKUJRn4FIqg2',
    title: 'Close Eyes',
    artist: 'DVRST',
    album: 'Close Eyes',
    duration: 186, // 3:06
    coverArt: 'https://i.scdn.co/image/ab67616d0000b273e6d4c235e0d87df991e10a81',
    backgroundColor: '#686868',
    isPlaying: false,
    progress: 0
  }
]; 