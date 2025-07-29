import type { ColorPalette } from '@/lib/colorQuantizer';
import type { LayerInfo } from '@/lib/multiLayerConverter';

export interface UploadedImage {
  id: string;
  name: string;
  size: number;
  file: File;
  url: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  progress?: number;
  svgData?: string;
  svgSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  palette?: ColorPalette;
  layers?: LayerInfo[];
  inversions?: boolean[];
}

export interface ConversionSettings {
  numColors: number;
  threshold: number;
  noiseRemoval: number;
  cornerSmoothing: number;
}

export interface ProcessingStats {
  totalImages: number;
  processedImages: number;
  averageTime: number;
  memoryUsage: number;
}
