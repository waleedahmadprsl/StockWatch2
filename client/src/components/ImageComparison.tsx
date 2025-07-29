import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, AlertCircle, FileImage } from 'lucide-react';
import { UploadedImage } from '@/types/image';

interface ImageComparisonProps {
  selectedImage: UploadedImage;
  viewMode: 'compare' | 'svg';
  zoomLevel: number;
}

export default function ImageComparison({ selectedImage, viewMode, zoomLevel }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderOriginalImage = () => (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h4 className="text-sm font-medium text-slate-700">Original Image</h4>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-hidden">
        <img 
          src={selectedImage.url} 
          alt={selectedImage.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-transform"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        />
      </div>
    </div>
  );

  const renderSVGPreview = () => (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">SVG Preview</h4>
          <div className="flex items-center space-x-2">
            {selectedImage.status === 'processing' && (
              <div className="flex items-center text-xs text-amber-600">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </div>
            )}
            {selectedImage.svgSize && (
              <span className="text-xs text-slate-500">
                ~{Math.round(selectedImage.svgSize / 1024)} KB
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-hidden">
        {selectedImage.status === 'pending' && (
          <div className="text-center text-slate-500">
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileImage className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">SVG Preview</p>
            <p className="text-xs mt-1">Adjust settings and process to see results</p>
          </div>
        )}
        
        {selectedImage.status === 'processing' && (
          <div className="text-center text-amber-600">
            <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium">Processing...</p>
            <p className="text-xs mt-1">Converting image to SVG</p>
          </div>
        )}
        
        {selectedImage.status === 'error' && (
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm font-medium">Conversion Failed</p>
            <p className="text-xs mt-1">Try adjusting settings and reprocessing</p>
          </div>
        )}
        
        {selectedImage.status === 'processed' && selectedImage.svgData && (
          <div className="w-full h-full flex flex-col space-y-4">
            <div 
              className="flex-1 max-w-full max-h-1/2 border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white transition-transform"
              style={{ transform: `scale(${zoomLevel / 100})` }}
              dangerouslySetInnerHTML={{ __html: selectedImage.svgData }}
            />
            <div className="flex-1 min-h-0">
              <label className="block text-xs font-medium text-slate-700 mb-2">SVG Code (Debug)</label>
              <textarea 
                className="w-full h-full text-xs font-mono border border-slate-300 rounded p-2 bg-slate-50 resize-none"
                value={selectedImage.svgData}
                readOnly
                placeholder="SVG code will appear here..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (viewMode === 'svg') {
    return (
      <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {selectedImage.status === 'processed' && selectedImage.svgData ? (
          <div className="w-full h-full flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700">SVG Preview</h4>
                {selectedImage.svgSize && (
                  <span className="text-xs text-slate-500">
                    ~{Math.round(selectedImage.svgSize / 1024)} KB
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col p-4 space-y-4 min-h-0">
              <div 
                className="flex-1 max-w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white transition-transform flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel / 100})` }}
                dangerouslySetInnerHTML={{ __html: selectedImage.svgData }}
              />
              <div className="flex-1 min-h-0">
                <label className="block text-xs font-medium text-slate-700 mb-2">SVG Code (Debug)</label>
                <textarea 
                  className="w-full h-full text-xs font-mono border border-slate-300 rounded p-2 bg-slate-50 resize-none"
                  value={selectedImage.svgData}
                  readOnly
                  placeholder="SVG code will appear here..."
                />
              </div>
            </div>
          </div>
        ) : (
          renderSVGPreview()
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative select-none"
    >
      <div className="h-full flex">
        {/* Original Image Side */}
        <div 
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{ width: `${sliderPosition}%` }}
        >
          {renderOriginalImage()}
        </div>
        
        {/* SVG Preview Side */}
        <div 
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{ width: `${100 - sliderPosition}%` }}
        >
          {renderSVGPreview()}
        </div>
        
        {/* Draggable Comparison Slider */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-600 cursor-ew-resize z-10 group"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg transition-transform group-hover:scale-110" />
          
          {/* Hover area for easier interaction */}
          <div className="absolute top-0 bottom-0 -left-2 -right-2 cursor-ew-resize" />
        </div>
      </div>
    </div>
  );
}
