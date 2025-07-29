import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ColorPalette as ColorPaletteType } from '@/lib/colorQuantizer';

interface ColorPaletteProps {
  palette: ColorPaletteType | null;
  inversions: boolean[];
  onInversionChange: (index: number, inverted: boolean) => void;
}

export default function ColorPalette({ palette, inversions, onInversionChange }: ColorPaletteProps) {
  if (!palette || palette.colors.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Color Palette</h3>
        <p className="text-xs text-slate-500">Upload and process an image to see the color palette</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-medium text-slate-900 mb-3">
        Color Palette ({palette.colors.length} colors)
      </h3>
      
      <div className="space-y-3">
        {palette.colors.map((color, index) => {
          const percentage = ((palette.counts[index] / Math.max(...palette.counts)) * 100).toFixed(0);
          
          return (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              {/* Color Swatch */}
              <div 
                className="w-8 h-8 rounded border border-slate-300 shadow-sm flex-shrink-0"
                style={{ backgroundColor: color }}
                title={color}
              />
              
              {/* Color Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded">
                    {color.toUpperCase()}
                  </code>
                  <Badge variant="secondary" className="text-xs">
                    {percentage}%
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {palette.counts[index].toLocaleString()} pixels
                </div>
              </div>
              
              {/* Invert Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-xs text-slate-600">Invert</label>
                <Switch
                  checked={inversions[index] || false}
                  onCheckedChange={(checked) => onInversionChange(index, checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {palette.colors.length > 8 && (
        <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          Tip: Consider reducing the number of colors for better performance and cleaner results
        </div>
      )}
    </div>
  );
}