/**
 * Audio utility functions for the enhanced audio player
 */

/**
 * Extracts the dominant color from an image URL
 * @param imageUrl URL of the image to analyze
 * @returns Promise resolving to a hex color string
 */
export const extractDominantColor = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size to a small sample (for performance)
        canvas.width = 50;
        canvas.height = 50;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate average color
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;
        
        // Sample pixels (every 4th pixel for performance)
        for (let i = 0; i < data.length; i += 16) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];
          
          // Skip transparent pixels
          if (alpha < 128) continue;
          
          r += red;
          g += green;
          b += blue;
          pixelCount++;
        }
        
        // Calculate average
        if (pixelCount > 0) {
          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);
          
          // Convert to hex
          const hex = rgbToHex(r, g, b);
          resolve(hex);
        } else {
          // Default color if no valid pixels
          resolve('#121212');
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Converts RGB values to a hex color string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
};

/**
 * Converts a single color component to hex
 */
const componentToHex = (c: number): string => {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

/**
 * Formats time in seconds to MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Calculates the frequency data from an analyzer node
 * @param analyser Web Audio API analyzer node
 * @returns Object with bass, mid, and treble values
 */
export const calculateFrequencyData = (analyser: AnalyserNode | null): { 
  bass: number; 
  mid: number; 
  treble: number;
  average: number;
} => {
  if (!analyser) {
    return { bass: 0, mid: 0, treble: 0, average: 0 };
  }
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate frequency ranges (approximate)
  // Bass: 20-250Hz, Mid: 250-2000Hz, Treble: 2000-20000Hz
  // The exact bin indices depend on the FFT size and sample rate
  
  // Assuming standard 44.1kHz sample rate and fftSize of 2048
  // Each bin represents ~21.5Hz (44100/2048)
  
  const bassRange = { start: 1, end: 12 }; // ~20-250Hz
  const midRange = { start: 12, end: 93 }; // ~250-2000Hz
  const trebleRange = { start: 93, end: bufferLength }; // ~2000-20000Hz
  
  let bassSum = 0;
  let midSum = 0;
  let trebleSum = 0;
  let totalSum = 0;
  
  // Calculate sums for each range
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i];
    totalSum += value;
    
    if (i >= bassRange.start && i < bassRange.end) {
      bassSum += value;
    } else if (i >= midRange.start && i < midRange.end) {
      midSum += value;
    } else if (i >= trebleRange.start && i < trebleRange.end) {
      trebleSum += value;
    }
  }
  
  // Normalize values between 0 and 1
  const bass = bassSum / ((bassRange.end - bassRange.start) * 255);
  const mid = midSum / ((midRange.end - midRange.start) * 255);
  const treble = trebleSum / ((trebleRange.end - trebleRange.start) * 255);
  const average = totalSum / (bufferLength * 255);
  
  return { bass, mid, treble, average };
};

/**
 * Sanitizes a URL for audio playback
 * @param url The URL to sanitize
 * @returns Sanitized URL
 */
export const sanitizeAudioUrl = (url: string): string => {
  // Handle file:// URLs for local files
  if (url.startsWith('file://')) {
    // Remove file:// prefix and decode URI components
    return decodeURIComponent(url.replace(/^file:\/\//, ''));
  }
  
  // Handle Windows paths
  if (/^[A-Z]:\\/i.test(url)) {
    return url;
  }
  
  // Handle regular URLs
  return url;
};

/**
 * Generates a waveform visualization data array from audio buffer
 * @param audioBuffer The audio buffer to analyze
 * @param numPoints Number of data points to generate
 * @returns Array of normalized amplitude values
 */
export const generateWaveformData = (audioBuffer: AudioBuffer, numPoints: number): number[] => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(channelData.length / numPoints);
  const waveformData: number[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const startSample = blockSize * i;
    let sum = 0;
    
    // Calculate average amplitude for this block
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[startSample + j] || 0);
    }
    
    const average = sum / blockSize;
    waveformData.push(average);
  }
  
  return waveformData;
};

/**
 * Smoothly interpolates between two values
 * @param current Current value
 * @param target Target value
 * @param factor Smoothing factor (0-1)
 * @returns Interpolated value
 */
export const smoothValue = (current: number, target: number, factor: number = 0.3): number => {
  return current + (target - current) * factor;
};

export default {
  extractDominantColor,
  formatTime,
  calculateFrequencyData,
  sanitizeAudioUrl,
  generateWaveformData,
  smoothValue
}; 