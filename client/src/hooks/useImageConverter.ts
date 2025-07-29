import { useState, useCallback, useRef } from 'react';
import { UploadedImage, ConversionSettings, ProcessingStats } from '@/types/image';
import { MultiLayerConverter } from '@/lib/multiLayerConverter';
import { validateImageFile, getImageDimensions, getImageDataFromFile } from '@/lib/imageUtils';
import { useToast } from '@/hooks/use-toast';

export const useImageConverter = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    numColors: 8,
    threshold: 128,
    noiseRemoval: 2,
    cornerSmoothing: 1.0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    totalImages: 0,
    processedImages: 0,
    averageTime: 0,
    memoryUsage: 0,
  });

  const converterRef = useRef<MultiLayerConverter | null>(null);
  const { toast } = useToast();

  const initializeConverter = useCallback(() => {
    try {
      if (!converterRef.current) {
        converterRef.current = new MultiLayerConverter();
      }
      return true;
    } catch (error) {
      toast({
        title: "Initialization Error",
        description: "Failed to initialize multi-layer converter. Please refresh the page.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const addImages = useCallback(async (files: File[]) => {
    const validFiles = files.filter(validateImageFile);
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: `${files.length - validFiles.length} files were rejected. Only JPG and PNG files up to 10MB are supported.`,
        variant: "destructive",
      });
    }

    const newImages: UploadedImage[] = [];

    for (const file of validFiles) {
      try {
        const dimensions = await getImageDimensions(file);
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          file,
          url: URL.createObjectURL(file),
          status: 'pending',
          dimensions,
        };
        newImages.push(newImage);
      } catch (error) {
        toast({
          title: "Error Processing File",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setStats(prev => ({ ...prev, totalImages: prev.totalImages + newImages.length }));

    if (newImages.length > 0 && !selectedImageId) {
      setSelectedImageId(newImages[0].id);
    }

    toast({
      title: "Images Added",
      description: `${newImages.length} images added to queue.`,
    });
  }, [selectedImageId, toast]);

  const processImage = useCallback(async (imageId: string, customSettings?: ConversionSettings) => {
    if (!initializeConverter()) return;

    const image = images.find(img => img.id === imageId);
    if (!image || !converterRef.current) return;

    const startTime = Date.now();
    
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, status: 'processing', progress: 0 } : img
    ));

    try {
      const processingSettings = customSettings || settings;
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, progress: Math.min((img.progress || 0) + 10, 90) } : img
        ));
      }, 100);

      const result = await converterRef.current.convertImageToMultiLayerSVG(image.file, {
        numColors: processingSettings.numColors,
        threshold: processingSettings.threshold,
        turdSize: processingSettings.noiseRemoval,
        alphaMax: processingSettings.cornerSmoothing,
        colorInversions: image.inversions || []
      });

      clearInterval(progressInterval);

      const svgSize = new Blob([result.svg]).size;
      const processingTime = Date.now() - startTime;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { 
          ...img, 
          status: 'processed', 
          progress: 100,
          svgData: result.svg,
          svgSize,
          palette: result.palette,
          layers: result.layers,
          inversions: image.inversions || new Array(result.palette.colors.length).fill(false)
        } : img
      ));

      setStats(prev => ({
        ...prev,
        processedImages: prev.processedImages + 1,
        averageTime: (prev.averageTime * (prev.processedImages - 1) + processingTime) / prev.processedImages,
        memoryUsage: prev.memoryUsage + svgSize,
      }));

      toast({
        title: "Conversion Complete",
        description: `${image.name} converted successfully in ${(processingTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, status: 'error', progress: 0 } : img
      ));

      toast({
        title: "Conversion Failed",
        description: `Failed to convert ${image.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [images, settings, initializeConverter, toast]);

  const processAllImages = useCallback(async () => {
    if (!initializeConverter()) return;

    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    
    if (pendingImages.length === 0) {
      toast({
        title: "No Images to Process",
        description: "All images have already been processed.",
      });
      return;
    }

    setIsProcessing(true);

    for (const image of pendingImages) {
      await processImage(image.id);
    }

    setIsProcessing(false);

    toast({
      title: "Batch Processing Complete",
      description: `Processed ${pendingImages.length} images successfully.`,
    });
  }, [images, processImage, initializeConverter, toast]);

  const updateSettings = useCallback((newSettings: Partial<ConversionSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const reprocessWithSettings = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    await processImage(imageId, settings);
  }, [images, settings, processImage]);

  const removeImage = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      URL.revokeObjectURL(image.url);
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      if (selectedImageId === imageId) {
        const remainingImages = images.filter(img => img.id !== imageId);
        setSelectedImageId(remainingImages.length > 0 ? remainingImages[0].id : null);
      }
    }
  }, [images, selectedImageId]);

  const clearAllImages = useCallback(() => {
    images.forEach(image => URL.revokeObjectURL(image.url));
    setImages([]);
    setSelectedImageId(null);
    setStats({
      totalImages: 0,
      processedImages: 0,
      averageTime: 0,
      memoryUsage: 0,
    });
  }, [images]);

  const selectedImage = selectedImageId ? images.find(img => img.id === selectedImageId) : null;

  const updateColorInversion = useCallback((imageId: string, colorIndex: number, inverted: boolean) => {
    setImages(prev => prev.map(img => {
      if (img.id === imageId) {
        const newInversions = [...(img.inversions || [])];
        newInversions[colorIndex] = inverted;
        return { ...img, inversions: newInversions };
      }
      return img;
    }));
  }, []);

  return {
    images,
    selectedImage,
    selectedImageId,
    settings,
    isProcessing,
    stats,
    addImages,
    processImage,
    processAllImages,
    updateSettings,
    reprocessWithSettings,
    removeImage,
    clearAllImages,
    setSelectedImageId,
    updateColorInversion,
  };
};
