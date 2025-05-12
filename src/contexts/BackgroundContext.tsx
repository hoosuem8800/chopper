import React, { createContext, useContext, useState, useEffect } from 'react';
import { PatternType, DensityOption, SizeOption, SpeedOption, TrajectoryType, DistributionType } from '@/components/Background';
import { IconColorTheme } from '@/components/FloatingIcons';
import { customToast } from '@/lib/toast';

// Define the Background Settings interface
export interface BackgroundSettings {
  // Background settings
  showFloatingIcons: boolean;
  showPattern: boolean;
  patternOpacity: number;
  patternType: PatternType;
  backgroundColor: string;
  
  // Icon settings
  iconDensity: DensityOption;
  iconSpeed: SpeedOption;
  iconSize: SizeOption;
  iconGlow: boolean;
  iconColorTheme: string;
  customIconColors: IconColorTheme;
  
  // Advanced icon settings
  iconOpacity: number;
  iconTrajectory: TrajectoryType;
  iconRotation: boolean;
  iconDistribution: DistributionType;
  iconPulse: boolean;
  
  // Pattern settings
  patternSize: SizeOption;
  patternAnimation: boolean;
  patternSpeed: SpeedOption;
}

// Default background settings
export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  showFloatingIcons: true,
  showPattern: true,
  patternOpacity: 0.50,
  patternType: 'dots',
  backgroundColor: 'bg-gradient-to-br from-indigo-50 to-pink-50',
  iconDensity: 'dense',
  iconSpeed: 'slow',
  iconSize: 'medium',
  iconGlow: false,
  iconColorTheme: 'ocean',
  customIconColors: {
    primary: '#039BE5',
    secondary: '#00ACC1',
    accent: '#00BCD4'
  },
  iconOpacity: 0.80,
  iconTrajectory: 'upward',
  iconRotation: true,
  iconDistribution: 'even',
  iconPulse: false,
  patternSize: 'medium',
  patternAnimation: true,
  patternSpeed: 'medium'
};

// Create a context for background settings
interface BackgroundContextType {
  bgSettings: BackgroundSettings;
  updateBgSettings: (settings: Partial<BackgroundSettings>) => void;
  resetToDefaults: () => void;
  saveAsDefaults: () => void;
}

const BackgroundContext = createContext<BackgroundContextType>({
  bgSettings: DEFAULT_BACKGROUND_SETTINGS,
  updateBgSettings: () => {},
  resetToDefaults: () => {},
  saveAsDefaults: () => {}
});

export const useBackgroundSettings = () => useContext(BackgroundContext);

// Storage key for background settings
const STORAGE_KEY = 'backgroundSettings';
const DEFAULT_SETTINGS_KEY = 'defaultBackgroundSettings';

// Force a refresh of background settings when on profile page to ensure it's applied  
const forceBgRefreshForSpecificPages = () => {
  try {
    // Get current path
    const currentPath = window.location.pathname;
    
    // List of paths that need special background refresh handling
    const pathsNeedingRefresh = [
      '/profile',
      '/doctor-dash',
      '/admin',
      '/app-dash',
      '/consultations'
    ];
    
    // Check if current path matches any of the special paths
    const needsRefresh = pathsNeedingRefresh.some(path => currentPath.includes(path));
    
    if (needsRefresh) {
      console.log(`Forced background refresh for path: ${currentPath}`);
      const currentSettings = localStorage.getItem(STORAGE_KEY);
      if (currentSettings) {
        // Dispatch the refresh event with a small delay to ensure it happens after React rendering
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('background-settings-refresh'));
        }, 200);
      }
    }
  } catch (error) {
    console.error('Error in forced background refresh:', error);
  }
};

// Add forceBgRefreshForSpecificPages to initialization
const initializeDefaultSettings = () => {
  try {
    // Check if default settings exist
    const existingDefaults = localStorage.getItem(DEFAULT_SETTINGS_KEY);
    const existingSettings = localStorage.getItem(STORAGE_KEY);
    
    if (!existingDefaults) {
      // Save default settings
      localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(DEFAULT_BACKGROUND_SETTINGS));
      console.log('Initialized default background settings in localStorage');
    }
    
    if (!existingSettings) {
      // Also set as current settings
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BACKGROUND_SETTINGS));
      console.log('Initialized current background settings in localStorage');
    }
    
    // Force refresh of background settings when navigating between pages
    window.addEventListener('popstate', () => {
      const currentSettings = localStorage.getItem(STORAGE_KEY);
      if (currentSettings) {
        try {
          // Dispatch a custom event to notify the application that settings should be refreshed
          window.dispatchEvent(new CustomEvent('background-settings-refresh'));
          
          // Force specific page refreshes
          forceBgRefreshForSpecificPages();
        } catch (error) {
          console.error('Error refreshing background settings on navigation:', error);
        }
      }
    });
    
    // Additional event listener for page navigation using React Router
    // This helps with programmatic navigation that doesn't trigger popstate
    window.addEventListener('routechange', () => {
      const currentSettings = localStorage.getItem(STORAGE_KEY);
      if (currentSettings) {
        try {
          // Dispatch a custom event to notify the application that settings should be refreshed
          window.dispatchEvent(new CustomEvent('background-settings-refresh'));
          
          // Force specific page refreshes
          forceBgRefreshForSpecificPages();
        } catch (error) {
          console.error('Error refreshing background settings on route change:', error);
        }
      }
    });
    
    // Initial call to handle the case where the user lands directly on the profile page
    forceBgRefreshForSpecificPages();
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

// Run the initialization immediately
initializeDefaultSettings();

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Basic validation
        if (typeof parsedSettings === 'object' && parsedSettings !== null) {
          // Merge with defaults to ensure all properties exist
          return { ...DEFAULT_BACKGROUND_SETTINGS, ...parsedSettings };
        }
      }
    } catch (error) {
      console.error('Error loading background settings:', error);
    }
    
    // Try to load custom defaults if they exist
    try {
      const customDefaults = localStorage.getItem(DEFAULT_SETTINGS_KEY);
      if (customDefaults) {
        const parsedDefaults = JSON.parse(customDefaults);
        if (typeof parsedDefaults === 'object' && parsedDefaults !== null) {
          return parsedDefaults;
        }
      }
    } catch (error) {
      console.error('Error loading custom default settings:', error);
    }
    
    return DEFAULT_BACKGROUND_SETTINGS;
  });

  // Update settings and save to localStorage
  const updateBgSettings = (newSettings: Partial<BackgroundSettings>) => {
    setBgSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('Error saving background settings:', error);
      }
      return updatedSettings;
    });
  };

  // Reset settings to defaults
  const resetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      
      // Use custom defaults if they exist
      const customDefaults = localStorage.getItem(DEFAULT_SETTINGS_KEY);
      if (customDefaults) {
        const parsedDefaults = JSON.parse(customDefaults);
        if (typeof parsedDefaults === 'object' && parsedDefaults !== null) {
          setBgSettings(parsedDefaults);
          return;
        }
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    }
    
    // Fall back to original defaults
    setBgSettings(DEFAULT_BACKGROUND_SETTINGS);
  };
  
  // Save current settings as defaults
  const saveAsDefaults = () => {
    try {
      console.log('Saving current settings as defaults');
      
      // Save current settings as the new defaults
      localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(bgSettings));
      
      // Also update the regular settings storage so it takes effect immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bgSettings));
      
      // Show success message
      customToast.success('Current settings saved as the new defaults');
    } catch (error) {
      console.error('Error saving settings as defaults:', error);
      customToast.error('Failed to save settings as defaults');
    }
  };

  // Listen for storage events (settings changed in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          if (typeof newSettings === 'object' && newSettings !== null) {
            // Don't trigger a state update if nothing changed
            if (JSON.stringify(newSettings) !== JSON.stringify(bgSettings)) {
              setBgSettings(newSettings);
            }
          }
        } catch (error) {
          console.error('Error parsing background settings from storage event:', error);
        }
      }
    };

    // Handle refresh events from navigation
    const handleRefreshEvent = () => {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (typeof parsedSettings === 'object' && parsedSettings !== null) {
            // Update settings if they've changed
            if (JSON.stringify(parsedSettings) !== JSON.stringify(bgSettings)) {
              setBgSettings(parsedSettings);
            }
          }
        }
      } catch (error) {
        console.error('Error handling background settings refresh:', error);
      }
    };

    // Register to force refresh background settings when location hash changes
    // This helps with React Router navigation that uses hash-based routing
    const handleHashChange = () => {
      window.dispatchEvent(new CustomEvent('background-settings-refresh'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('background-settings-refresh', handleRefreshEvent);
    window.addEventListener('hashchange', handleHashChange);
    
    // Force a refresh when component mounts to ensure settings are applied
    window.dispatchEvent(new CustomEvent('background-settings-refresh'));
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('background-settings-refresh', handleRefreshEvent);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [bgSettings]);

  return (
    <BackgroundContext.Provider value={{ bgSettings, updateBgSettings, resetToDefaults, saveAsDefaults }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundContext; 