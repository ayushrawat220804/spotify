// Add this helper function at the top of your file
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Add this function to convert Track to TrackMetadata
function trackToMetadata(track: Track): TrackMetadata {
  return {
    ...track,
    ...(track.coverArt === null ? { coverArt: undefined } : {})
  };
}

// Create a class that handles the conversion
class TrackMetadataConverter {
  static fromTrack(track: Track): TrackMetadata {
    return {
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverArt: track.coverArt ?? undefined
    };
  }
}

// Then use it
const metadata: TrackMetadata = TrackMetadataConverter.fromTrack(track);

onFileSelect(fileUrl, metadata); 