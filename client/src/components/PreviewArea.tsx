import { useState } from 'react';
import { ZoomIn, ZoomOut, Eye, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/imageUtils';
import ImageComparison from './ImageComparison';
import { UploadedImage, ProcessingStats } from '@/types/image';

interface PreviewAreaProps {
  selectedImage: UploadedImage | null;
  stats: ProcessingStats;
}

export default function PreviewArea({ selectedImage, stats }: PreviewAreaProps) {
  const [viewMode, setViewMode] = useState<'compare' | 'svg'>('compare');
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
  };

  if (!selectedImage) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">No Image Selected</h2>
          <p className="text-sm text-slate-600 mt-1">Upload and select an image to see the preview</p>
        </div>
        
        <div className="flex-1 bg-slate-25 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium mb-2">Select an Image</p>
            <p className="text-sm">Choose an image from the queue to see the preview</p>
          </div>
        </div>
        
        <div className="bg-white border-t border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-slate-600">
              <span>Ready</span>
              <span>•</span>
              <span>{stats.totalImages} images queued</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-600">
              <span>Memory: {formatFileSize(stats.memoryUsage)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Preview Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{selectedImage.name}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Real-time SVG preview • {selectedImage.dimensions ? `${selectedImage.dimensions.width}×${selectedImage.dimensions.height}` : 'Loading...'} • {formatFileSize(selectedImage.size)}
              {selectedImage.svgSize && ` → ${formatFileSize(selectedImage.svgSize)}`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Zoom controls */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 25}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-slate-700">{zoomLevel}%</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'compare' ? 'default' : 'ghost'}
                className={`h-7 px-3 text-xs ${viewMode === 'compare' ? 'bg-blue-600 text-white shadow-sm' : ''}`}
                onClick={() => setViewMode('compare')}
              >
                <GitCompare className="w-3 h-3 mr-1" />
                Compare
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'svg' ? 'default' : 'ghost'}
                className={`h-7 px-3 text-xs ${viewMode === 'svg' ? 'bg-blue-600 text-white shadow-sm' : ''}`}
                onClick={() => setViewMode('svg')}
              >
                <Eye className="w-3 h-3 mr-1" />
                SVG Only
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 bg-slate-25 overflow-hidden">
        <div className="h-full p-6">
          <ImageComparison 
            selectedImage={selectedImage}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
          />
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-slate-600">
            <span className={`flex items-center ${
              selectedImage.status === 'processing' ? 'text-amber-600' : 
              selectedImage.status === 'processed' ? 'text-green-600' : 
              selectedImage.status === 'error' ? 'text-red-600' : 'text-slate-600'
            }`}>
              {selectedImage.status === 'processing' && (
                <div className="animate-spin w-3 h-3 border border-amber-300 border-t-amber-600 rounded-full mr-2" />
              )}
              {selectedImage.status.charAt(0).toUpperCase() + selectedImage.status.slice(1)}
            </span>
            <span>•</span>
            <span>{stats.totalImages} images queued</span>
            {stats.averageTime > 0 && (
              <>
                <span>•</span>
                <span>Avg time: {(stats.averageTime / 1000).toFixed(1)}s</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4 text-slate-600">
            <span>Memory: {formatFileSize(stats.memoryUsage)}</span>
            <span>•</span>
            <a href="#" className="text-blue-600 hover:text-blue-700">Help & Tips</a>
          </div>
        </div>
      </div>
    </div>
  );
}
