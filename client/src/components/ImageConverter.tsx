import { useImageConverter } from '@/hooks/useImageConverter';
import Sidebar from './Sidebar';
import PreviewArea from './PreviewArea';

export default function ImageConverter() {
  const converter = useImageConverter();

  return (
    <div className="min-h-screen flex bg-slate-50 font-inter">
      <Sidebar {...converter} />
      <PreviewArea 
        selectedImage={converter.selectedImage || null}
        stats={converter.stats}
      />
    </div>
  );
}
