export interface PotraceParams {
  threshold?: number;
  turdSize?: number;
  alphaMax?: number;
  optCurve?: boolean;
  optTolerance?: number;
}

// Simple path tracing for client-side SVG generation
export class SimplePathTracer {
  private threshold: number;
  private noiseSize: number;
  private smoothing: number;

  constructor(threshold: number = 128, noiseSize: number = 2, smoothing: number = 1.0) {
    this.threshold = threshold;
    this.noiseSize = noiseSize;
    this.smoothing = smoothing;
  }

  // Convert bitmap to SVG paths
  traceBitmap(bitmap: number[], width: number, height: number): string {
    console.log('Tracing bitmap:', width, 'x', height);
    
    const paths: string[] = [];
    const visited = new Array(width * height).fill(false);
    
    // Count black pixels for debugging
    const blackPixels = bitmap.filter(p => p === 1).length;
    console.log('Black pixels found:', blackPixels, '/', bitmap.length);

    if (blackPixels === 0) {
      console.log('No black pixels found, creating empty SVG');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="gray" font-size="14">No content to trace</text>
</svg>`;
    }

    // Use flood-fill to find connected components
    let pathCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && bitmap[idx] === 1) {
          const component = this.floodFill(bitmap, width, height, x, y, visited);
          if (component.length >= this.noiseSize) {
            const path = this.componentToPath(component, width, height);
            if (path) {
              paths.push(path);
              pathCount++;
            }
          }
        }
      }
    }

    console.log('Generated', pathCount, 'paths');

    if (paths.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="gray" font-size="14">No valid paths found</text>
</svg>`;
    }

    // Generate SVG with proper formatting
    const pathElements = paths.map((path, i) => 
      `  <path d="${path}" fill="black" fill-rule="evenodd"/>`
    ).join('\n');
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${pathElements}
</svg>`;
  }

  private floodFill(bitmap: number[], width: number, height: number, startX: number, startY: number, visited: boolean[]): Array<{x: number, y: number}> {
    const component: Array<{x: number, y: number}> = [];
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || bitmap[idx] !== 1) {
        continue;
      }
      
      visited[idx] = true;
      component.push({x, y});
      
      // Add neighbors
      stack.push({x: x + 1, y});
      stack.push({x: x - 1, y});
      stack.push({x, y: y + 1});
      stack.push({x, y: y - 1});
    }
    
    return component;
  }

  private componentToPath(component: Array<{x: number, y: number}>, width: number, height: number): string {
    if (component.length === 0) return '';
    
    // Find bounding box
    let minX = component[0].x, maxX = component[0].x;
    let minY = component[0].y, maxY = component[0].y;
    
    for (const point of component) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    // Create a simple rectangular path for the component
    return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
  }

  /**
   * Trace bitmap and return individual paths as strings (for multi-layer use)
   */
  traceBitmapToPaths(bitmap: number[], width: number, height: number): string[] {
    console.log('Tracing bitmap to individual paths:', width, 'x', height);
    
    const paths: string[] = [];
    const visited = new Array(width * height).fill(false);
    
    // Count black pixels for debugging
    const blackPixels = bitmap.filter(p => p === 1).length;
    console.log('Black pixels found:', blackPixels, '/', bitmap.length);

    if (blackPixels === 0) {
      return [];
    }

    // Use flood-fill to find connected components
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && bitmap[idx] === 1) {
          const component = this.floodFill(bitmap, width, height, x, y, visited);
          if (component.length >= this.noiseSize) {
            const path = this.componentToPath(component, width, height);
            if (path) {
              paths.push(`<path d="${path}"/>`);
            }
          }
        }
      }
    }

    console.log('Generated', paths.length, 'individual paths');
    return paths;
  }

  private traceContour(bitmap: number[], width: number, height: number, startX: number, startY: number, visited: boolean[]): string {
    const path: Array<{x: number, y: number}> = [];
    const directions = [
      {dx: 1, dy: 0},   // right
      {dx: 0, dy: 1},   // down
      {dx: -1, dy: 0},  // left
      {dx: 0, dy: -1}   // up
    ];

    let x = startX;
    let y = startY;
    let dir = 0;
    const startIdx = y * width + x;
    
    do {
      const idx = y * width + x;
      if (idx >= 0 && idx < bitmap.length) {
        visited[idx] = true;
        path.push({x, y});
      }

      // Find next position
      let found = false;
      for (let i = 0; i < 4; i++) {
        const nextDir = (dir + i) % 4;
        const nextX = x + directions[nextDir].dx;
        const nextY = y + directions[nextDir].dy;
        const nextIdx = nextY * width + nextX;

        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height && 
            bitmap[nextIdx] === 1 && !visited[nextIdx]) {
          x = nextX;
          y = nextY;
          dir = nextDir;
          found = true;
          break;
        }
      }

      if (!found) break;
    } while (!(x === startX && y === startY) && path.length < width * height);

    if (path.length < 3) return '';

    // Convert path to SVG path string with smoothing
    return this.pathToSVG(path);
  }

  private pathToSVG(points: Array<{x: number, y: number}>): string {
    if (points.length < 2) return '';

    let pathStr = `M ${points[0].x} ${points[0].y}`;
    
    if (this.smoothing > 0.5 && points.length > 3) {
      // Use smooth curves
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const p3 = points[i + 1];
        
        const cp1x = p1.x + (p2.x - p1.x) * 0.5;
        const cp1y = p1.y + (p2.y - p1.y) * 0.5;
        const cp2x = p2.x + (p3.x - p2.x) * 0.5;
        const cp2y = p2.y + (p3.y - p2.y) * 0.5;
        
        pathStr += ` Q ${p2.x} ${p2.y} ${cp2x} ${cp2y}`;
      }
      pathStr += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    } else {
      // Use straight lines
      for (let i = 1; i < points.length; i++) {
        pathStr += ` L ${points[i].x} ${points[i].y}`;
      }
    }
    
    pathStr += ' Z';
    return pathStr;
  }
}

export class PotraceConverter {
  constructor() {
    // Browser-compatible implementation
  }

  async convertImageToSVG(
    imageFile: File,
    params: PotraceParams = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Starting SVG conversion with params:', params);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Scale down very large images for better performance
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw image to canvas with potential scaling
          ctx.drawImage(img, 0, 0, width, height);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          
          // Convert to grayscale and apply threshold
          const threshold = params.threshold ?? 128;
          console.log('Applying threshold:', threshold);
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            const gray = Math.round(
              0.299 * imageData.data[i] +
              0.587 * imageData.data[i + 1] +
              0.114 * imageData.data[i + 2]
            );
            const value = gray > threshold ? 255 : 0;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
          }

          // Create bitmap for tracing (black pixels = 1, white pixels = 0)
          const bitmap = new Array(width * height);
          for (let i = 0; i < bitmap.length; i++) {
            bitmap[i] = imageData.data[i * 4] === 0 ? 1 : 0;
          }

          console.log('Bitmap created, size:', width, 'x', height, 'pixels');

          // Use our custom tracer
          const tracer = new SimplePathTracer(
            threshold,
            params.turdSize ?? 2,
            params.alphaMax ?? 1.0
          );

          const svg = tracer.traceBitmap(bitmap, width, height);
          
          console.log('SVG generated, length:', svg.length, 'characters');
          console.log('SVG preview:', svg.substring(0, 200) + '...');
          
          if (!svg || svg.length < 50) {
            reject(new Error('Generated SVG is too short or empty'));
            return;
          }
          
          resolve(svg);
        } catch (error) {
          console.error('Error in SVG conversion:', error);
          reject(new Error(`SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        console.error('Failed to load image file');
        reject(new Error('Failed to load image file'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async convertImageDataToSVG(
    imageData: ImageData,
    params: PotraceParams = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const { width, height, data } = imageData;
        
        // Apply threshold
        const threshold = params.threshold ?? 128;
        const processedData = new Uint8ClampedArray(data);
        
        for (let i = 0; i < processedData.length; i += 4) {
          const gray = Math.round(
            0.299 * processedData[i] +
            0.587 * processedData[i + 1] +
            0.114 * processedData[i + 2]
          );
          const value = gray > threshold ? 255 : 0;
          processedData[i] = value;
          processedData[i + 1] = value;
          processedData[i + 2] = value;
        }

        // Create bitmap for tracing
        const bitmap = new Array(width * height);
        for (let i = 0; i < bitmap.length; i++) {
          bitmap[i] = processedData[i * 4] === 0 ? 1 : 0;
        }

        // Use our custom tracer
        const tracer = new SimplePathTracer(
          threshold,
          params.turdSize ?? 2,
          params.alphaMax ?? 1.0
        );

        const svg = tracer.traceBitmap(bitmap, width, height);
        resolve(svg);
      } catch (error) {
        reject(error);
      }
    });
  }
}
