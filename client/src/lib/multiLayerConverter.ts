// Multi-layer SVG converter with color separation
import { ColorQuantizer, type ColorPalette } from './colorQuantizer';
import { SimplePathTracer } from './potrace';

export interface ConversionSettings {
  numColors: number;
  threshold: number;
  turdSize: number;
  alphaMax: number;
  colorInversions: boolean[];
}

export interface LayerInfo {
  color: string;
  inverted: boolean;
  pathData: string;
  pixelCount: number;
}

export interface ConversionResult {
  svg: string;
  layers: LayerInfo[];
  palette: ColorPalette;
  width: number;
  height: number;
}

export class MultiLayerConverter {
  private quantizer = new ColorQuantizer();

  async convertImageToMultiLayerSVG(
    imageFile: File,
    settings: ConversionSettings
  ): Promise<ConversionResult> {
    console.log('Starting multi-layer conversion with settings:', settings);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          // Step 1: Prepare canvas with exact image dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Critical: Use exact native dimensions
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

          // Draw image at exact size
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
          
          // Extract image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Step 2: Color quantization
          console.log('Quantizing colors...');
          const palette = this.quantizer.quantizeColors(imageData, settings.numColors);
          
          if (palette.colors.length === 0) {
            throw new Error('No colors found in image');
          }

          // Step 3: Generate masks and trace each color layer
          console.log('Processing', palette.colors.length, 'color layers...');
          const layers: LayerInfo[] = [];
          const tracer = new SimplePathTracer(
            settings.threshold,
            settings.turdSize,
            settings.alphaMax
          );

          for (let i = 0; i < palette.colors.length; i++) {
            const color = palette.colors[i];
            const inverted = settings.colorInversions[i] || false;
            
            try {
              console.log(`Processing layer ${i + 1}: ${color} (inverted: ${inverted})`);
              
              // Create color mask
              const mask = this.quantizer.createColorMask(imageData, color, inverted);
              
              // Convert mask to bitmap array
              const bitmap = this.imageDataToBitmap(mask);
              
              // Trace the mask
              const pathStrings = tracer.traceBitmapToPaths(bitmap, mask.width, mask.height);
              const pathData = pathStrings.join('\n');
              
              if (pathData && pathData.length > 0) {
                layers.push({
                  color,
                  inverted,
                  pathData,
                  pixelCount: palette.counts[i]
                });
                
                console.log(`Layer ${i + 1} traced: ${pathData.length} paths`);
              } else {
                console.log(`Layer ${i + 1} skipped: no paths generated`);
              }
            } catch (layerError) {
              console.error(`Failed to process layer ${i + 1}:`, layerError);
              // Continue with other layers
            }
          }

          if (layers.length === 0) {
            throw new Error('No valid layers generated');
          }

          // Step 4: Combine layers into final SVG
          const svg = this.combineLayers(layers, canvas.width, canvas.height);
          
          console.log('Multi-layer SVG generated:', layers.length, 'layers');
          
          resolve({
            svg,
            layers,
            palette,
            width: canvas.width,
            height: canvas.height
          });

        } catch (error) {
          console.error('Multi-layer conversion failed:', error);
          reject(new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Convert ImageData to bitmap array (1 = black, 0 = white)
   */
  private imageDataToBitmap(imageData: ImageData): number[] {
    const bitmap = new Array(imageData.width * imageData.height);
    
    for (let i = 0; i < bitmap.length; i++) {
      const pixelIndex = i * 4;
      // Black pixels (R=0, G=0, B=0) become 1, white pixels become 0
      bitmap[i] = imageData.data[pixelIndex] === 0 ? 1 : 0;
    }
    
    return bitmap;
  }

  /**
   * Combine all layers into a single SVG
   */
  private combineLayers(layers: LayerInfo[], width: number, height: number): string {
    console.log('Combining', layers.length, 'layers into final SVG');
    
    const pathElements = layers.map((layer, index) => {
      return `  <!-- Layer ${index + 1}: ${layer.color} -->
  <g id="layer-${index + 1}" fill="${layer.color}" fill-rule="evenodd">
${layer.pathData.split('\n').map(path => `    ${path}`).join('\n')}
  </g>`;
    }).join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Multi-layer SVG generated with ${layers.length} color layers -->
${pathElements}
</svg>`;
  }

  /**
   * Get default settings for conversion
   */
  static getDefaultSettings(): ConversionSettings {
    return {
      numColors: 8,
      threshold: 128,
      turdSize: 2,
      alphaMax: 1.0,
      colorInversions: []
    };
  }
}