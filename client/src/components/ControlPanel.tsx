import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, HelpCircle, Palette } from 'lucide-react';
import { ConversionSettings } from '@/types/image';
import ColorPalette from './ColorPalette';
import type { ColorPalette as ColorPaletteType } from '@/lib/colorQuantizer';

interface ControlPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: Partial<ConversionSettings>) => void;
  onReprocess?: () => void;
  palette?: ColorPaletteType | null;
  inversions?: boolean[];
  onInversionChange?: (index: number, inverted: boolean) => void;
}

export default function ControlPanel({ 
  settings, 
  onSettingsChange, 
  onReprocess,
  palette,
  inversions = [],
  onInversionChange
}: ControlPanelProps) {
  const handleNumColorsChange = (value: number[]) => {
    onSettingsChange({ numColors: value[0] });
  };

  const handleThresholdChange = (value: number[]) => {
    onSettingsChange({ threshold: value[0] });
  };

  const handleNoiseRemovalChange = (value: number[]) => {
    onSettingsChange({ noiseRemoval: value[0] });
  };

  const handleCornerSmoothingChange = (value: number[]) => {
    onSettingsChange({ cornerSmoothing: value[0] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">Conversion Settings</h3>
        {onReprocess && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReprocess}
            className="h-7 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Apply
          </Button>
        )}
      </div>
      
      {/* Number of Colors Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Palette className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-medium text-slate-700">Number of Colors</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">More colors = better detail, fewer colors = cleaner result</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-slate-600 font-mono">{settings.numColors || 8}</span>
        </div>
        <Slider
          value={[settings.numColors || 8]}
          onValueChange={handleNumColorsChange}
          max={16}
          min={2}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>2</span>
          <span>16</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Controls color separation layers in the final SVG</p>
      </div>
      
      {/* Color Palette Display */}
      {palette && (
        <div className="mb-6">
          <ColorPalette 
            palette={palette}
            inversions={inversions}
            onInversionChange={onInversionChange || (() => {})}
          />
        </div>
      )}

      {/* Threshold Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Label className="text-sm font-medium text-slate-700">Threshold</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Controls black/white cutoff for shape definition</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-slate-600 font-mono">{settings.threshold}</span>
        </div>
        <Slider
          value={[settings.threshold]}
          onValueChange={handleThresholdChange}
          max={255}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>255</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Controls black/white cutoff for shape definition</p>
      </div>
      
      {/* Noise Removal Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Label className="text-sm font-medium text-slate-700">Noise Removal</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Removes small specks and unwanted artifacts</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-slate-600 font-mono">{settings.noiseRemoval}</span>
        </div>
        <Slider
          value={[settings.noiseRemoval]}
          onValueChange={handleNoiseRemovalChange}
          max={10}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>10</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Removes small specks and unwanted artifacts</p>
      </div>
      
      {/* Corner Smoothing Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Label className="text-sm font-medium text-slate-700">Corner Smoothing</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Smooths curves and prevents sharp corners</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-sm text-slate-600 font-mono">{settings.cornerSmoothing.toFixed(2)}</span>
        </div>
        <Slider
          value={[settings.cornerSmoothing]}
          onValueChange={handleCornerSmoothingChange}
          max={1.34}
          min={0}
          step={0.01}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>1.34</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Smooths curves and prevents sharp corners</p>
      </div>
    </div>
  );
}
