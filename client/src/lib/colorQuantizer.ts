// Color quantization for multi-layer SVG conversion
export interface ColorPalette {
  colors: string[];
  counts: number[];
}

export interface QuantizedPixel {
  r: number;
  g: number;
  b: number;
  count: number;
}

export class ColorQuantizer {
  private colorTolerance = 15; // RGB tolerance for color matching

  /**
   * Extract dominant colors from image data using median cut algorithm
   */
  quantizeColors(imageData: ImageData, maxColors: number): ColorPalette {
    console.log('Starting color quantization for', maxColors, 'colors');
    
    // Extract unique colors with their frequencies
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      const colorKey = `${r},${g},${b}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    console.log('Found', colorMap.size, 'unique colors');

    // Convert to array and sort by frequency
    const colorArray: QuantizedPixel[] = Array.from(colorMap.entries())
      .map(([colorKey, count]) => {
        const [r, g, b] = colorKey.split(',').map(Number);
        return { r, g, b, count };
      })
      .sort((a, b) => b.count - a.count);

    // Use median cut algorithm for better color selection
    const quantizedColors = this.medianCut(colorArray, maxColors);
    
    const colors = quantizedColors.map(color => 
      `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
    );
    
    const counts = quantizedColors.map(color => color.count);
    
    console.log('Quantized to colors:', colors);
    
    return { colors, counts };
  }

  /**
   * Median cut algorithm for color quantization
   */
  private medianCut(colors: QuantizedPixel[], maxColors: number): QuantizedPixel[] {
    if (colors.length <= maxColors) {
      return colors;
    }

    const buckets: QuantizedPixel[][] = [colors];
    
    while (buckets.length < maxColors) {
      // Find the bucket with the largest range
      let largestBucket = 0;
      let largestRange = 0;
      
      for (let i = 0; i < buckets.length; i++) {
        const range = this.getColorRange(buckets[i]);
        if (range > largestRange) {
          largestRange = range;
          largestBucket = i;
        }
      }
      
      // Split the largest bucket
      const bucket = buckets[largestBucket];
      const splitBuckets = this.splitBucket(bucket);
      
      buckets.splice(largestBucket, 1, ...splitBuckets);
    }
    
    // Return representative color from each bucket
    return buckets.map(bucket => this.getAverageColor(bucket));
  }

  /**
   * Calculate the color range of a bucket
   */
  private getColorRange(colors: QuantizedPixel[]): number {
    if (colors.length === 0) return 0;
    
    let minR = colors[0].r, maxR = colors[0].r;
    let minG = colors[0].g, maxG = colors[0].g;
    let minB = colors[0].b, maxB = colors[0].b;
    
    for (const color of colors) {
      minR = Math.min(minR, color.r);
      maxR = Math.max(maxR, color.r);
      minG = Math.min(minG, color.g);
      maxG = Math.max(maxG, color.g);
      minB = Math.min(minB, color.b);
      maxB = Math.max(maxB, color.b);
    }
    
    return Math.max(maxR - minR, maxG - minG, maxB - minB);
  }

  /**
   * Split a bucket along its largest dimension
   */
  private splitBucket(colors: QuantizedPixel[]): QuantizedPixel[][] {
    if (colors.length <= 1) return [colors];
    
    // Find the dimension with the largest range
    let minR = colors[0].r, maxR = colors[0].r;
    let minG = colors[0].g, maxG = colors[0].g;
    let minB = colors[0].b, maxB = colors[0].b;
    
    for (const color of colors) {
      minR = Math.min(minR, color.r);
      maxR = Math.max(maxR, color.r);
      minG = Math.min(minG, color.g);
      maxG = Math.max(maxG, color.g);
      minB = Math.min(minB, color.b);
      maxB = Math.max(maxB, color.b);
    }
    
    const rRange = maxR - minR;
    const gRange = maxG - minG;
    const bRange = maxB - minB;
    
    // Sort by the dimension with the largest range
    if (rRange >= gRange && rRange >= bRange) {
      colors.sort((a, b) => a.r - b.r);
    } else if (gRange >= bRange) {
      colors.sort((a, b) => a.g - b.g);
    } else {
      colors.sort((a, b) => a.b - b.b);
    }
    
    // Split at median
    const mid = Math.floor(colors.length / 2);
    return [colors.slice(0, mid), colors.slice(mid)];
  }

  /**
   * Get the average color of a bucket
   */
  private getAverageColor(colors: QuantizedPixel[]): QuantizedPixel {
    let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
    
    for (const color of colors) {
      totalR += color.r * color.count;
      totalG += color.g * color.count;
      totalB += color.b * color.count;
      totalCount += color.count;
    }
    
    return {
      r: Math.round(totalR / totalCount),
      g: Math.round(totalG / totalCount),
      b: Math.round(totalB / totalCount),
      count: totalCount
    };
  }

  /**
   * Create a binary mask for a specific color
   */
  createColorMask(
    imageData: ImageData, 
    targetColor: string, 
    invert: boolean = false
  ): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    
    const maskData = ctx.createImageData(imageData.width, imageData.height);
    
    // Parse target color
    const hex = targetColor.replace('#', '');
    const targetR = parseInt(hex.substr(0, 2), 16);
    const targetG = parseInt(hex.substr(2, 2), 16);
    const targetB = parseInt(hex.substr(4, 2), 16);
    
    console.log('Creating mask for color:', targetColor, `RGB(${targetR}, ${targetG}, ${targetB})`);
    
    let matchingPixels = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) {
        maskData.data[i] = 255;     // White
        maskData.data[i + 1] = 255;
        maskData.data[i + 2] = 255;
        maskData.data[i + 3] = 255;
        continue;
      }
      
      // Check if pixel matches target color within tolerance
      const colorDistance = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );
      
      const isMatch = colorDistance <= this.colorTolerance;
      const shouldBeBlack = invert ? !isMatch : isMatch;
      
      if (shouldBeBlack) {
        maskData.data[i] = 0;       // Black
        maskData.data[i + 1] = 0;
        maskData.data[i + 2] = 0;
        matchingPixels++;
      } else {
        maskData.data[i] = 255;     // White
        maskData.data[i + 1] = 255;
        maskData.data[i + 2] = 255;
      }
      maskData.data[i + 3] = 255;   // Opaque
    }
    
    console.log('Mask created with', matchingPixels, 'matching pixels');
    
    return maskData;
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}