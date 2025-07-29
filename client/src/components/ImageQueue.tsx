import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize, downloadSVG } from '@/lib/imageUtils';
import { UploadedImage } from '@/types/image';
import { useToast } from '@/hooks/use-toast';

interface ImageQueueProps {
  images: UploadedImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
}

export default function ImageQueue({ images, selectedImageId, onSelectImage }: ImageQueueProps) {
  const { toast } = useToast();

  const handleDownload = (image: UploadedImage) => {
    try {
      if (!image.svgData) {
        toast({
          title: "Download Failed",
          description: "No SVG data available. Process the image first.",
          variant: "destructive",
        });
        return;
      }

      downloadSVG(image.svgData, image.name);
      toast({
        title: "Download Started",
        description: `${image.name} SVG is being downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download ${image.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (image: UploadedImage) => {
    switch (image.status) {
      case 'processed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Pending
          </span>
        );
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex-1 px-6 pb-4 flex items-center justify-center text-center">
        <div className="text-slate-500">
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs mt-1">Upload some images to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 pb-4 overflow-y-auto custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(248, 39%, 96%);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(215, 25%, 81%);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(215, 16%, 58%);
        }
      `}</style>
      
      {images.map((image) => (
        <div
          key={image.id}
          className={`mb-3 p-3 rounded-lg cursor-pointer transition-all ${
            selectedImageId === image.id
              ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-200'
              : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
          onClick={() => onSelectImage(image.id)}
        >
          <div className="flex items-center space-x-3">
            <img 
              src={image.url} 
              alt={image.name}
              className="w-12 h-9 object-cover rounded border bg-slate-100" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{image.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(image)}
                <span className="text-xs text-slate-500">{formatFileSize(image.size)}</span>
                {image.dimensions && (
                  <span className="text-xs text-slate-500">
                    {image.dimensions.width}×{image.dimensions.height}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {image.status === 'processing' && typeof image.progress === 'number' && (
            <div className="mt-3">
              <Progress value={image.progress} className="h-1.5" />
            </div>
          )}
          
          {image.status === 'processed' && (
            <div className="mt-3 flex space-x-2">
              <Button 
                size="sm"
                variant="outline"
                className="flex-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image);
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Download SVG
              </Button>
            </div>
          )}
          
          {image.svgSize && (
            <div className="mt-2 text-xs text-slate-500">
              SVG size: {formatFileSize(image.svgSize)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
