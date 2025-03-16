interface ColorWorkerMessage {
  dataArray: number[];
  dimensions: { width: number; height: number };
}

const extractDominantColor = (dataArray: number[]): string => {
  let r = 0, g = 0, b = 0;
  const pixelCount = dataArray.length / 4;

  // Sum up all RGB values
  for (let i = 0; i < dataArray.length; i += 4) {
    r += dataArray[i];
    g += dataArray[i + 1];
    b += dataArray[i + 2];
  }

  // Calculate average
  r = Math.round(r / pixelCount);
  g = Math.round(g / pixelCount);
  b = Math.round(b / pixelCount);

  // Darken for background use
  return `rgb(${r * 0.6}, ${g * 0.6}, ${b * 0.6})`;
};

// Handle messages from main thread
// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<ColorWorkerMessage>) => {
  const { dataArray, dimensions } = e.data;
  
  try {
    // Small optimization for 1x1 pixel data
    if (dimensions.width === 1 && dimensions.height === 1 && dataArray.length === 4) {
      const r = dataArray[0];
      const g = dataArray[1];
      const b = dataArray[2];
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ color: `rgb(${r * 0.6}, ${g * 0.6}, ${b * 0.6})` });
    } else {
      const color = extractDominantColor(dataArray);
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ color });
    }
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ error: (error as Error).message });
  }
};

export {}; // Required for TypeScript modules 