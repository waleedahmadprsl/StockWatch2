import { useCallback } from 'react';
import { Upload, FileImage, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ImageQueue from './ImageQueue';
import ControlPanel from './ControlPanel';
import { downloadZip } from '@/lib/imageUtils';
import { UploadedImage, ConversionSettings, ProcessingStats } from '@/types/image';

interface SidebarProps {
  images: UploadedImage[];
  selectedImageId: string | null;
  settings: ConversionSettings;
  isProcessing: boolean;
  stats: ProcessingStats;
  addImages: (files: File[]) => void;
  processAllImages: () => void;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
  reprocessWithSettings: (imageId: string) => void;
  setSelectedImageId: (id: string | null) => void;
  updateColorInversion: (imageId: string, colorIndex: number, inverted: boolean) => void;
}

export default function Sidebar({
  images,
  selectedImageId,
  settings,
  isProcessing,
  stats,
  addImages,
  processAllImages,
  updateSettings,
  reprocessWithSettings,
  setSelectedImageId,
  updateColorInversion,
}: SidebarProps) {
  const { toast } = useToast();
  
  const selectedImage = selectedImageId ? images.find(img => img.id === selectedImageId) : null;

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      addImages(files);
    }
    // Reset input value to allow re-uploading same files
    event.target.value = '';
  }, [addImages]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const processedImages = images.filter(img => img.status === 'processed' && img.svgData);
    
    if (processedImages.length === 0) {
      toast({
        title: "No SVGs to Download",
        description: "Process some images first before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      await downloadZip(processedImages.map(img => ({
        name: img.name,
        svgData: img.svgData!
      })));
      
      toast({
        title: "Download Started",
        description: `ZIP file with ${processedImages.length} SVGs is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try again.",
        variant: "destructive",
      });
    }
  }, [images, toast]);

  const processedCount = images.filter(img => img.status === 'processed').length;

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">SVG Converter</h1>
        <p className="text-sm text-slate-600">Professional image vectorization</p>
      </div>
      
      {/* Upload Section */}
      <div className="p-6 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-3">Upload Images</label>
        <Card
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-slate-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input 
            type="file" 
            multiple 
            accept=".jpg,.jpeg,.png" 
            className="hidden" 
            id="file-input"
            onChange={handleFileUpload}
          />
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">Drop files here or click to upload</p>
            <p className="text-xs text-slate-500">JPG, PNG up to 10MB each</p>
          </div>
        </Card>
      </div>
      
      {/* Image Queue */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 pb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Image Queue <span className="text-slate-500 font-normal">({images.length})</span>
          </h3>
        </div>
        
        <ImageQueue 
          images={images}
          selectedImageId={selectedImageId}
          onSelectImage={setSelectedImageId}
        />
      </div>
      
      {/* Control Panel */}
      <div className="border-t border-slate-200 p-6">
        <ControlPanel 
          settings={settings}
          onSettingsChange={updateSettings}
          onReprocess={selectedImageId ? () => reprocessWithSettings(selectedImageId) : undefined}
          palette={selectedImage?.palette}
          inversions={selectedImage?.inversions}
          onInversionChange={selectedImageId ? (index, inverted) => updateColorInversion(selectedImageId, index, inverted) : undefined}
        />
        
        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={processAllImages}
            disabled={isProcessing || images.filter(img => img.status === 'pending' || img.status === 'error').length === 0}
          >
            <FileImage className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply to All Images'}
          </Button>
          
          <Button 
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium"
            onClick={handleDownloadAll}
            disabled={processedCount === 0}
          >
            <Package className="w-4 h-4 mr-2" />
            Download All as ZIP ({processedCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
