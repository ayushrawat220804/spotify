import { EventEmitter } from 'events';

class AudioBufferManager extends EventEmitter {
  private audioContext: AudioContext;
  private bufferSize: number;
  private sourceNode?: AudioBufferSourceNode;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;
  private bufferCache: Map<string, AudioBuffer>;
  private maxCacheSize: number;

  constructor(options = { bufferSize: 4096, maxCacheSize: 10 }) {
    super();
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.bufferSize = options.bufferSize;
    this.maxCacheSize = options.maxCacheSize;
    this.bufferCache = new Map();
    
    // Create audio nodes
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    
    // Configure analyser
    this.analyserNode.fftSize = 2048;
    
    // Connect nodes
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  async loadAudio(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Manage cache size
      if (this.bufferCache.size >= this.maxCacheSize) {
        const firstKey = this.bufferCache.keys().next().value;
        this.bufferCache.delete(firstKey);
      }

      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  play(buffer: AudioBuffer, startTime = 0): void {
    if (this.sourceNode) {
      this.stop();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.start(0, startTime);
    this.sourceNode.onended = () => {
      this.emit('ended');
    };
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = undefined;
    }
  }

  setVolume(value: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  getAnalyserData(): Uint8Array {
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
    this.analyserNode.disconnect();
    this.bufferCache.clear();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

export default AudioBufferManager; 