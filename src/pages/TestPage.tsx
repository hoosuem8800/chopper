import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Background, { DensityOption, SizeOption, SpeedOption, PatternType, TrajectoryType, DistributionType } from '@/components/Background';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, Layers, Eye, Monitor, Sparkles, BringToFront, Save, Copy } from 'lucide-react';
import { IconColorTheme } from '@/components/FloatingIcons';
import { customToast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBackgroundSettings, BackgroundSettings } from '@/contexts/BackgroundContext';

// Predefined color themes
const colorThemes = {
  default: {
    primary: 'var(--primary-color)',
    secondary: 'var(--highlight-blue)',
    accent: 'var(--success-color)'
  },
  medical: {
    primary: '#00A3E0',
    secondary: '#EF426F',
    accent: '#8CC63F'
  },
  calm: {
    primary: '#7B68EE',
    secondary: '#9370DB',
    accent: '#BA55D3'
  },
  vibrant: {
    primary: '#FF5722',
    secondary: '#FF9800',
    accent: '#FFC107'
  },
  ocean: {
    primary: '#039BE5',
    secondary: '#00ACC1',
    accent: '#00BCD4'
  }
};

// Define ColorThemeKey type for type safety
type ColorThemeKey = keyof typeof colorThemes | 'custom';

// Helper function to validate a color string (hex format)
const isValidColor = (color: string): boolean => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

const TestPage = () => {
  // Use the BackgroundContext directly instead of maintaining separate state
  const { bgSettings, updateBgSettings, resetToDefaults, saveAsDefaults } = useBackgroundSettings();
  
  // Copy color to clipboard
  const copyColorToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
      .then(() => customToast.success(`Color ${color} copied to clipboard`))
      .catch(() => customToast.error('Failed to copy color'));
  };

  // Type-safe handleChange function
  const handleChange = <K extends keyof typeof bgSettings>(key: K, value: any) => {
    if (key === 'iconColorTheme' && value === 'custom' && !bgSettings.customIconColors) {
      // If switching to custom theme and customIconColors is undefined,
      // initialize it with default custom colors and enable glow for better visibility
      updateBgSettings({ 
        [key]: value,
        iconGlow: true, // Enable glow when switching to custom colors for better visibility
        customIconColors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B'
        }
      });
    } else {
      updateBgSettings({ [key]: value });
    }
  };
  
  // Handle custom color change
  const handleCustomColorChange = (colorKey: keyof typeof bgSettings.customIconColors, value: string) => {
    // Initialize customIconColors if it doesn't exist
    if (!bgSettings.customIconColors) {
      const defaultCustomColors = {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B'
      };
      updateBgSettings({
        customIconColors: {
          ...defaultCustomColors,
          [colorKey]: value
        }
      });
    } else {
      // Only update if it's a valid color format or empty (while typing)
      if (!value || isValidColor(value)) {
        updateBgSettings({
          customIconColors: {
            ...bgSettings.customIconColors,
            [colorKey]: value
          }
        });
      }
    }
  };

  // Add a handler for the save button with enhanced logging
  const handleSaveAsDefaults = () => {
    console.log('Save Settings button clicked in TestPage');
    saveAsDefaults();
    customToast.success('Settings saved as the new application defaults');
  };

  // Function to apply the exact settings from the screenshots
  const applyScreenshotPreset = () => {
    const screenshotPreset: Partial<BackgroundSettings> = {
      showFloatingIcons: true,
      showPattern: true,
      patternOpacity: 0.50,
      patternType: 'dots' as PatternType,
      backgroundColor: 'bg-gradient-to-br from-indigo-50 to-pink-50',
      iconDensity: 'dense' as DensityOption,
      iconSpeed: 'slow' as SpeedOption,
      iconSize: 'medium' as SizeOption,
      iconGlow: false,
      iconColorTheme: 'ocean',
      customIconColors: {
        primary: '#039BE5',
        secondary: '#00ACC1',
        accent: '#00BCD4'
      },
      iconOpacity: 0.80,
      iconTrajectory: 'upward' as TrajectoryType,
      iconRotation: true,
      iconDistribution: 'even' as DistributionType,
      iconPulse: false,
      patternSize: 'medium' as SizeOption,
      patternAnimation: true,
      patternSpeed: 'medium' as SpeedOption
    };
    
    updateBgSettings(screenshotPreset);
    customToast.success('Applied the preset settings from the screenshots');
  };

  // Memoize the icon colors to prevent unnecessary recalculations
  const iconColors = useMemo<IconColorTheme>(() => {
    if (bgSettings.iconColorTheme === 'custom') {
      // Return default custom colors if customIconColors is undefined
      return bgSettings.customIconColors || {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B'
      };
    }
    return colorThemes[bgSettings.iconColorTheme as ColorThemeKey] || colorThemes.default;
  }, [bgSettings.iconColorTheme, bgSettings.customIconColors]);

  return (
    <Background 
      showFloatingIcons={bgSettings.showFloatingIcons}
      showPattern={bgSettings.showPattern}
      patternOpacity={bgSettings.patternOpacity}
      patternType={bgSettings.patternType}
      backgroundColor={bgSettings.backgroundColor}
      iconDensity={bgSettings.iconDensity}
      iconSpeed={bgSettings.iconSpeed}
      iconSize={bgSettings.iconSize}
      iconGlow={bgSettings.iconGlow}
      iconColors={iconColors}
      iconOpacity={bgSettings.iconOpacity}
      iconTrajectory={bgSettings.iconTrajectory}
      iconRotation={bgSettings.iconRotation}
      iconDistribution={bgSettings.iconDistribution}
      iconPulse={bgSettings.iconPulse}
      patternSize={bgSettings.patternSize}
      patternAnimation={bgSettings.patternAnimation}
      patternSpeed={bgSettings.patternSpeed}
      className="flex flex-col"
    >
      <div className="flex-grow container mx-auto px-4 py-10">
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Background Configuration</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Customize the background settings and save them as defaults for the entire application.
          </p>
          
          {/* Admin warning banner */}
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-8 rounded-md max-w-2xl mx-auto">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <p className="font-semibold">Admin Only Page: This configuration page is restricted to administrative users only.</p>
            </div>
          </div>
          
          <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings size={20} /> Background Configuration</CardTitle>
              <CardDescription>
                Adjust the settings below to see different background effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visibility">
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="pattern" className="flex items-center gap-1"><Layers size={14} /> Pattern</TabsTrigger>
                  <TabsTrigger value="icons" className="flex items-center gap-1"><Sparkles size={14} /> Icons</TabsTrigger>
                  <TabsTrigger value="colors" className="flex items-center gap-1"><Palette size={14} /> Colors</TabsTrigger>
                  <TabsTrigger value="iconcolors" className="flex items-center gap-1"><BringToFront size={14} /> Icon Colors</TabsTrigger>
                  <TabsTrigger value="visibility" className="flex items-center gap-1"><Eye size={14} /> Visibility</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pattern" className="space-y-6">
                  <div>
                    <Label>Pattern Type</Label>
                    <Select 
                      value={bgSettings.patternType}
                      onValueChange={(value: PatternType) => handleChange('patternType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                        <SelectItem value="waves">Waves</SelectItem>
                        <SelectItem value="circles">Circles</SelectItem>
                        <SelectItem value="hexagons">Hexagons</SelectItem>
                        <SelectItem value="diamonds">Diamonds</SelectItem>
                        <SelectItem value="triangles">Triangles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Pattern Opacity: {bgSettings.patternOpacity.toFixed(2)}</Label>
                    </div>
                    <Slider 
                      value={[bgSettings.patternOpacity]} 
                      min={0.05} 
                      max={0.5} 
                      step={0.05}
                      onValueChange={(value) => handleChange('patternOpacity', value[0])}
                    />
                  </div>
                  
                  <div>
                    <Label>Pattern Size</Label>
                    <Select 
                      value={bgSettings.patternSize}
                      onValueChange={(value: SizeOption) => handleChange('patternSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pattern-animation">Pattern Animation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable pattern movement
                      </p>
                    </div>
                    <Switch
                      id="pattern-animation"
                      checked={bgSettings.patternAnimation}
                      onCheckedChange={(checked) => handleChange('patternAnimation', checked)}
                    />
                  </div>
                  
                  {bgSettings.patternAnimation && (
                    <div>
                      <Label>Animation Speed</Label>
                      <Select 
                        value={bgSettings.patternSpeed}
                        onValueChange={(value: SpeedOption) => handleChange('patternSpeed', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select animation speed" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="icons" className="space-y-6">
                  <div>
                    <Label>Icon Density</Label>
                    <Select 
                      value={bgSettings.iconDensity}
                      onValueChange={(value: DensityOption) => handleChange('iconDensity', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sparse">Sparse</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="dense">Dense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Icon Size</Label>
                    <Select 
                      value={bgSettings.iconSize}
                      onValueChange={(value: SizeOption) => handleChange('iconSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Animation Speed</Label>
                    <Select 
                      value={bgSettings.iconSpeed}
                      onValueChange={(value: SpeedOption) => handleChange('iconSpeed', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animation speed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Motion Pattern</Label>
                    <Select 
                      value={bgSettings.iconTrajectory}
                      onValueChange={(value: TrajectoryType) => handleChange('iconTrajectory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon motion pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upward">Upward (Default)</SelectItem>
                        <SelectItem value="zigzag">Zig-Zag</SelectItem>
                        <SelectItem value="spiral">Spiral</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Distribution</Label>
                    <Select 
                      value={bgSettings.iconDistribution}
                      onValueChange={(value: DistributionType) => handleChange('iconDistribution', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon distribution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="even">Even (Default)</SelectItem>
                        <SelectItem value="clustered">Clustered</SelectItem>
                        <SelectItem value="corners">Corner Focus</SelectItem>
                        <SelectItem value="center">Center Focus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Icon Opacity: {bgSettings.iconOpacity.toFixed(2)}</Label>
                    </div>
                    <Slider 
                      value={[bgSettings.iconOpacity]} 
                      min={0.2} 
                      max={1.0} 
                      step={0.05}
                      onValueChange={(value) => handleChange('iconOpacity', value[0])}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="icon-glow">Icon Glow Effect</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the glow around icons
                      </p>
                    </div>
                    <Switch
                      id="icon-glow"
                      checked={bgSettings.iconGlow}
                      onCheckedChange={(checked) => handleChange('iconGlow', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="icon-rotation">Icon Rotation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable icon rotation during animation
                      </p>
                    </div>
                    <Switch
                      id="icon-rotation"
                      checked={bgSettings.iconRotation}
                      onCheckedChange={(checked) => handleChange('iconRotation', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="icon-pulse">Pulsing Effect</Label>
                      <p className="text-sm text-muted-foreground">
                        Add subtle size pulsing to icons
                      </p>
                    </div>
                    <Switch
                      id="icon-pulse"
                      checked={bgSettings.iconPulse}
                      onCheckedChange={(checked) => handleChange('iconPulse', checked)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="iconcolors" className="space-y-6">
                  <div>
                    <Label>Icon Color Selection</Label>
                    <RadioGroup 
                      value={bgSettings.iconColorTheme}
                      onValueChange={(value: ColorThemeKey) => handleChange('iconColorTheme', value)}
                      className="flex flex-col space-y-1 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="theme-default" />
                        <Label htmlFor="theme-default">Default Theme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medical" id="theme-medical" />
                        <Label htmlFor="theme-medical">Medical Theme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calm" id="theme-calm" />
                        <Label htmlFor="theme-calm">Calm Theme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vibrant" id="theme-vibrant" />
                        <Label htmlFor="theme-vibrant">Vibrant Theme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ocean" id="theme-ocean" />
                        <Label htmlFor="theme-ocean">Ocean Theme</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="theme-custom" />
                        <Label htmlFor="theme-custom">Custom Colors</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {bgSettings.iconColorTheme === 'custom' && (
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="block mb-2">Custom Icon Colors</Label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded" 
                              style={{ background: bgSettings.customIconColors.primary }}
                            />
                            <Label>Primary</Label>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={bgSettings.customIconColors.primary}
                              onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                              className="w-10 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={bgSettings.customIconColors.primary}
                              onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                              className="w-28 font-mono"
                              placeholder="#rrggbb"
                            />
                            <Button 
                              size="icon" 
                              variant="outline" 
                              onClick={() => copyColorToClipboard(bgSettings.customIconColors.primary)}
                              title="Copy color"
                            >
                              <Copy size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded" 
                              style={{ background: bgSettings.customIconColors.secondary }}
                            />
                            <Label>Secondary</Label>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={bgSettings.customIconColors.secondary}
                              onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                              className="w-10 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={bgSettings.customIconColors.secondary}
                              onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                              className="w-28 font-mono"
                              placeholder="#rrggbb"
                            />
                            <Button 
                              size="icon" 
                              variant="outline" 
                              onClick={() => copyColorToClipboard(bgSettings.customIconColors.secondary)}
                              title="Copy color"
                            >
                              <Copy size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded" 
                              style={{ background: bgSettings.customIconColors.accent }}
                            />
                            <Label>Accent</Label>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={bgSettings.customIconColors.accent}
                              onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                              className="w-10 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={bgSettings.customIconColors.accent}
                              onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                              className="w-28 font-mono"
                              placeholder="#rrggbb"
                            />
                            <Button 
                              size="icon" 
                              variant="outline" 
                              onClick={() => copyColorToClipboard(bgSettings.customIconColors.accent)}
                              title="Copy color"
                            >
                              <Copy size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-lg border flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full mb-2" 
                        style={{ background: iconColors.primary }}
                      ></div>
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="p-4 rounded-lg border flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full mb-2" 
                        style={{ background: iconColors.secondary }}
                      ></div>
                      <span className="text-sm">Secondary</span>
                    </div>
                    <div className="p-4 rounded-lg border flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full mb-2" 
                        style={{ background: iconColors.accent }}
                      ></div>
                      <span className="text-sm">Accent</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6">
                  <div>
                    <Label>Background Type</Label>
                    <Select 
                      value={bgSettings.backgroundColor}
                      onValueChange={(value) => handleChange('backgroundColor', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select background type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gradient-bg">Default Gradient</SelectItem>
                        <SelectItem value="bg-white">White</SelectItem>
                        <SelectItem value="bg-gray-50">Light Gray</SelectItem>
                        <SelectItem value="bg-gradient-to-br from-blue-50 to-cyan-50">Blue Gradient</SelectItem>
                        <SelectItem value="bg-gradient-to-br from-indigo-50 to-pink-50">Indigo to Pink</SelectItem>
                        <SelectItem value="bg-gradient-to-br from-purple-50 to-cyan-50">Purple to Cyan</SelectItem>
                        <SelectItem value="bg-gradient-to-br from-teal-50 to-blue-50">Teal to Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="visibility" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-floating-icons">Floating Icons</Label>
                      <p className="text-sm text-muted-foreground">
                        Show or hide the floating medical icons
                      </p>
                    </div>
                    <Switch
                      id="show-floating-icons"
                      checked={bgSettings.showFloatingIcons}
                      onCheckedChange={(checked) => handleChange('showFloatingIcons', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-pattern">Background Pattern</Label>
                      <p className="text-sm text-muted-foreground">
                        Show or hide the background pattern
                      </p>
                    </div>
                    <Switch
                      id="show-pattern"
                      checked={bgSettings.showPattern}
                      onCheckedChange={(checked) => handleChange('showPattern', checked)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex justify-center gap-4 mt-6">
            <Button 
              className="flex items-center gap-2"
              onClick={(e) => {
                console.log('Save Settings button clicked directly');
                handleSaveAsDefaults();
              }}
            >
              <Save size={16} /> Save as Application Defaults
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={resetToDefaults}
            >
              <Monitor size={16} /> Reset to Default
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={applyScreenshotPreset}
              variant="outline"
            >
              <Sparkles size={16} /> Apply Screenshot Preset
            </Button>
          </div>
        </div>
        
        {/* Settings information */}
        <div className="fixed bottom-4 left-4 p-4 bg-black/70 text-white rounded-lg z-50 max-w-md text-xs" style={{ maxHeight: '300px', overflow: 'auto' }}>
          <h3 className="font-bold mb-2">Settings Status:</h3>
          <div>
            <strong>Current settings applied</strong>
            <div className="mt-1 text-xs">
              Pattern: {bgSettings.patternType}, Density: {bgSettings.iconDensity}, Speed: {bgSettings.iconSpeed}
            </div>
          </div>
          <div className="mt-2">
            <strong>Saved defaults exist:</strong> {localStorage.getItem('defaultBackgroundSettings') ? 'Yes' : 'No'}
          </div>
          <div className="mt-2 text-xs text-gray-300">
            Click "Save as Application Defaults" to make these settings the default for all users.
          </div>
        </div>
      </div>
    </Background>
  );
};

export default TestPage; 