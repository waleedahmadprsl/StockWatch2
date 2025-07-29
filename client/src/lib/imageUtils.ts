export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getImageDataFromFile = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const downloadSVG = (svgData: string, filename: string) => {
  try {
    console.log('Downloading SVG:', filename, 'Size:', svgData.length, 'characters');
    
    if (!svgData || svgData.length < 10) {
      throw new Error('SVG data is empty or too short');
    }
    
    if (!svgData.includes('<svg')) {
      throw new Error('Invalid SVG data - missing <svg> tag');
    }
    
    const blob = new Blob([svgData], { 
      type: 'image/svg+xml;charset=utf-8' 
    });
    
    console.log('Created blob, size:', blob.size, 'bytes');
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.[^/.]+$/, '.svg');
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('Download initiated successfully');
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

declare global {
  interface Window {
    JSZip: any;
  }
}

export const downloadZip = async (images: Array<{ name: string; svgData: string }>) => {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip library not loaded');
  }

  const zip = new window.JSZip();
  
  images.forEach(image => {
    if (image.svgData) {
      const filename = image.name.replace(/\.[^/.]+$/, '.svg');
      zip.file(filename, image.svgData);
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'converted-svgs.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
