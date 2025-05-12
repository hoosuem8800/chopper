import React, { useState, useEffect } from 'react';
import { 
  Heart, Stethoscope, Pill, Thermometer, Zap, 
  BarChart4, Syringe, Microscope, Radiation, 
  BadgeAlert, HeartPulse, Building, ShieldCheck,
  LucideIcon, Dna, Brain, Scan, PlusCircle, 
  Hospital, Beaker, Clipboard, Activity, 
  Clock, Droplet, Scissors, User, Award,
  Bookmark, CheckCircle, FileText
} from 'lucide-react';
import { DensityOption, SizeOption, SpeedOption, TrajectoryType } from './Background';

// Custom medical-themed SVG icons
const LungsIcon = ({ className, size = 24, color }: { className?: string, size?: number, color?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    fill="currentColor" 
    viewBox="0 0 16 16"
    className={className}
    style={{ color }}
  >
    <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
  </svg>
);

const VirusIcon = ({ className, size = 24, color }: { className?: string, size?: number, color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 16 16"
    className={className}
    style={{ color }}
  >
    <path d="M8 0a1 1 0 0 1 1 1v1.402c1.535.46 2.782 1.707 3.242 3.242H14a1 1 0 0 1 0 2h-1.758c-.46 1.535-1.707 2.782-3.242 3.242V14a1 1 0 0 1-2 0v-3.114c-1.535-.46-2.782-1.707-3.242-3.242H2a1 1 0 0 1 0-2h1.758c.46-1.535 1.707-2.782 3.242-3.242V1a1 1 0 0 1 1-1zm2.7 8.5a.5.5 0 1 0 .6-.8.5.5 0 0 0-.6.8zm-5.4 0a.5.5 0 1 0 .6-.8.5.5 0 0 0-.6.8zm2.7-5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm0 5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm0 3a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
  </svg>
);

const MaskIcon = ({ className, size = 24, color }: { className?: string, size?: number, color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 16 16"
    className={className}
    style={{ color }}
  >
    <path d="M6.225 1.227A7.5 7.5 0 0 1 10.5 8a7.5 7.5 0 0 1-4.275 6.773 7 7 0 1 0 0-13.546zM4.187.966a8 8 0 1 1 7.627 14.069A8 8 0 0 1 4.186.964z"/>
    <path d="M12.5 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H12a.5.5 0 0 1 .5.5z"/>
  </svg>
);

const FirstAidIcon = ({ className, size = 24, color }: { className?: string, size?: number, color?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    fill="currentColor"
    viewBox="0 0 16 16"
    className={className}
    style={{ color }}
  >
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
    <path d="M1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm13 0H2v12h12V2z"/>
  </svg>
);

// Interface for color theme options
export interface IconColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

// Default color theme
const defaultColorTheme: IconColorTheme = {
  primary: 'var(--primary-color)',
  secondary: 'var(--highlight-blue)',
  accent: 'var(--success-color)'
};

// Define animation types
type AnimationType = 'float-up' | 'float-down' | 'float-left' | 'float-right' | 'pulse' | 'spin';

// Define icon regions for placement
type RegionType = 'left' | 'middle' | 'right';

// Update DistributionType to match Background.tsx
type DistributionType = 'even' | 'clustered' | 'corners' | 'center' | 'staggered' | 'left-heavy' | 'right-heavy';

// Define props interface
interface FloatingIconsProps {
  density?: DensityOption;
  size?: SizeOption; 
  speed?: SpeedOption;
  glow?: boolean;
  iconColors?: IconColorTheme;
  // Advanced options
  iconOpacity?: number;
  trajectory?: TrajectoryType;
  rotation?: boolean;
  distribution?: DistributionType;
  pulse?: boolean;
}

// Define icon element interface
interface IconElement {
  id: string;
  Component: any;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  animation: AnimationType;
  color: string;
  rotate?: number;
}

// Main component
const FloatingIcons: React.FC<FloatingIconsProps> = ({
  density = 'dense',
  size = 'small',
  speed = 'slow',
  glow = false,
  iconColors = defaultColorTheme,
  iconOpacity = 0.8,
  trajectory = 'upward',
  rotation = true,
  distribution = 'even',
  pulse = false
}) => {
  // State for icons
  const [icons, setIcons] = useState<IconElement[]>([]);
  
  // All available icons for different regions
  const leftRegionIcons = [
    Heart, Stethoscope, LungsIcon, Brain, Hospital, 
    Pill, Syringe, Beaker, HeartPulse, Thermometer, ShieldCheck
  ];
  
  const middleRegionIcons = [
    Dna, PlusCircle, Radiation, Microscope, Zap, 
    BadgeAlert, Scan, BarChart4
  ];
  
  const rightRegionIcons = [
    Building, Clipboard, Activity, Clock, Droplet, 
    Scissors, User, Award, Bookmark, CheckCircle, 
    FileText, VirusIcon, MaskIcon, FirstAidIcon
  ];

  // Get icon count based on density
  const getIconCount = () => {
    if (density === 'sparse') return 10;
    if (density === 'medium') return 18;
    return 25;
  };
  
  // Get animation duration based on speed
  const getAnimationDuration = () => {
    // Reduce the animation durations to make icons appear and move faster
    if (speed === 'slow') return { min: 40, max: 60 }; // Was 60-90 seconds, now 40-60 seconds
    if (speed === 'medium') return { min: 30, max: 45 }; // Was 45-70 seconds, now 30-45 seconds
    return { min: 20, max: 35 }; // Was 30-50 seconds, now 20-35 seconds
  };

  // Generate a random icon element
  const generateIconElement = (region: RegionType, index: number, verticalOffset: number = 0): IconElement => {
    // Select region-specific icons
    let iconPool: any[];
    let regionWidth: number;
    let regionStart: number;
    
    // Determine icon options based on region
    switch (region) {
      case 'left':
        iconPool = leftRegionIcons;
        regionWidth = window.innerWidth * 0.37;
        regionStart = 0;
        break;
      case 'middle':
        iconPool = middleRegionIcons;
        regionWidth = window.innerWidth * 0.26;
        regionStart = window.innerWidth * 0.37;
        break;
      default: // right
        iconPool = rightRegionIcons;
        regionWidth = window.innerWidth * 0.37;
        regionStart = window.innerWidth * 0.63;
    }
    
    // Icon index, ensuring we cycle through all available icons for the region
    const iconIndex = index % iconPool.length;
    const IconComponent = iconPool[iconIndex];
    
    // Size factor based on selected size
    const sizeFactor = size === 'small' ? 0.75 : size === 'large' ? 1.3 : 1;
    
    // Determine icon color based on region
    let color;
    if (region === 'left') color = iconColors.primary;
    else if (region === 'middle') color = iconColors.secondary;
    else color = iconColors.accent;

    // Calculate more strategic position within the region
    // Divide the region into a grid for better distribution
    const gridCells = 3; // 3x3 grid within each region
    const cellWidth = (regionWidth - 40) / gridCells; // 40px for padding (20px on each side)
    
    // Ensure paddings from edges
    const padding = 20;
    
    // Calculate which cell in the grid this icon should appear in
    const cellX = index % gridCells;
    
    // Position within the cell (add some randomness)
    const xWithinCell = Math.random() * (cellWidth * 0.8);
    const x = Math.floor(regionStart + padding + (cellX * cellWidth) + xWithinCell);
    
    // Staggered vertical starting position with the provided offset
    const y = window.innerHeight + verticalOffset + Math.floor(Math.random() * 80);
    
    // Determine animation type
    let animation: AnimationType = 'float-up';
    if (trajectory === 'zigzag') {
      animation = Math.random() > 0.5 ? 'float-left' : 'float-right';
    } else if (trajectory === 'spiral') {
      animation = Math.random() > 0.5 ? 'float-left' : 'float-right';
    } else if (trajectory === 'random') {
      const anims: AnimationType[] = ['float-up', 'float-left', 'float-right'];
      animation = anims[Math.floor(Math.random() * anims.length)];
    }
    
    // Add pulse animation for some icons if enabled
    if (pulse && Math.random() > 0.7) {
      animation = 'pulse';
    }
    
    // Duration with some variation based on position
    const { min, max } = getAnimationDuration();
    // Make icons in the center slightly slower for visual interest
    const positionFactor = region === 'middle' ? 1.1 : 1;
    const duration = Math.floor((min + Math.random() * (max - min)) * positionFactor);
    
    // Staggered delay based on region and distribution
    let delay;
    if (distribution === 'staggered') {
      // Reduce delays significantly for staggered distribution
      delay = Math.floor(Math.random() * 10) + 2 + (index % 4) * 3; // Was 15-45 seconds, now 2-15 seconds
    } else if (distribution === 'clustered') {
      // Grouped timing for clustered appearance with reduced delays
      const groupIndex = Math.floor(index / 3); // Groups of 3 icons
      delay = Math.floor(Math.random() * 8) + 1 + groupIndex * 5; // Was 10+ seconds, now 1-13 seconds
    } else {
      // Standard shorter delay
      delay = Math.floor(Math.random() * 6) + 1 + (index % 3) * 2; // Was 10-30 seconds, now 1-9 seconds
    }
    
    // Rotation (if enabled)
    const rotate = rotation ? Math.floor(Math.random() * 360) : undefined;
    
    // Create unique ID
    const uniqueId = `icon-${region}-${iconIndex}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Calculate icon size with more predictable variation
    // Icons closer to the top of their sections are slightly larger
    const sizeVariation = 0.9 + (index % 3) * 0.1; // 0.9 to 1.1 size variation
    const baseSize = Math.floor(18 + Math.random() * 7);
    const iconSize = Math.round(baseSize * sizeFactor * sizeVariation);
    
    return {
      id: uniqueId,
      Component: IconComponent,
      size: iconSize,
      x,
      y,
      delay,
      duration,
      animation,
      color,
      rotate
    };
  };

  // Generate icons based on distribution and density
  useEffect(() => {
    const iconCount = getIconCount();
    const newIcons: IconElement[] = [];
    
    // Calculate number of icons per region based on distribution
    let leftCount, middleCount, rightCount;
    
    if (distribution === 'left-heavy') {
      leftCount = Math.floor(iconCount * 0.6);
      middleCount = Math.floor(iconCount * 0.2);
      rightCount = iconCount - leftCount - middleCount;
    } else if (distribution === 'right-heavy') {
      leftCount = Math.floor(iconCount * 0.2);
      middleCount = Math.floor(iconCount * 0.2);
      rightCount = iconCount - leftCount - middleCount;
    } else if (distribution === 'clustered') {
      middleCount = Math.floor(iconCount * 0.6);
      leftCount = Math.floor(iconCount * 0.2);
      rightCount = iconCount - leftCount - middleCount;
    } else if (distribution === 'corners') {
      middleCount = Math.floor(iconCount * 0.1);
      leftCount = Math.floor(iconCount * 0.45); 
      rightCount = iconCount - leftCount - middleCount;
    } else if (distribution === 'center') {
      middleCount = Math.floor(iconCount * 0.7);
      leftCount = Math.floor(iconCount * 0.15);
      rightCount = iconCount - leftCount - middleCount;
    } else {
      // Even distribution (37% - 26% - 37%)
      leftCount = Math.floor(iconCount * 0.37);
      middleCount = Math.floor(iconCount * 0.26);
      rightCount = iconCount - leftCount - middleCount;
    }
    
    // Function to create icons with better vertical distribution
    const createIconsWithVerticalDistribution = (region: RegionType, count: number) => {
      // Divide each region into vertical sections for better distribution
      const sections = 5; // Increased from 3 to 5 sections for more vertical spread
      const iconsPerSection = Math.ceil(count / sections);
      
      for (let i = 0; i < count; i++) {
        // Calculate which vertical section this icon belongs to
        const section = Math.floor(i / iconsPerSection);
        
        // Vertical offset based on section - this creates a staggered start pattern
        // Start position is offset by section * some height value
        let verticalOffset = 0;
        
        if (distribution === 'staggered') {
          // Reduced vertical offsets for staggered distribution
          verticalOffset = section * 100 + (i % 3) * 40; // Was 300/80, now 100/40
        } else if (distribution === 'corners' && region !== 'middle') {
          // For corners distribution, use less vertical offset in left/right regions
          verticalOffset = section * 80 + (i % 3) * 25; // Was 200/50, now 80/25
        } else if (distribution === 'center' && region === 'middle') {
          // For center distribution, more staggering in the middle
          verticalOffset = section * 120 + (i % 4) * 30; // Was 250/60, now 120/30
        } else {
          // Default vertical staggering
          verticalOffset = section * 80 + (i % 3) * 30; // Was 200/70, now 80/30
        }
        
        // Create the icon with the calculated offset
        const icon = generateIconElement(region, i, verticalOffset);
        newIcons.push(icon);
      }
    };
    
    // Function to create immediate icons that appear right away
    const createImmediateIcons = () => {
      // Create a small batch of icons (3-6) that appear immediately
      const immediateIconCount = Math.floor(Math.random() * 4) + 3; // 3-6 immediate icons
      
      for (let i = 0; i < immediateIconCount; i++) {
        // Distribute evenly across regions
        const region: RegionType = i % 3 === 0 ? 'left' : i % 3 === 1 ? 'middle' : 'right';
        
        // Create icon with parameters for immediate appearance
        const icon = generateIconElement(region, i, 0);
        
        // Override delay to make it appear immediately
        icon.delay = 0.1 + (i * 0.1); // Very small staggered delay (0.1-0.6s)
        
        // Add to icons array
        newIcons.push(icon);
      }
    };
    
    // Create immediate icons first
    createImmediateIcons();
    
    // Generate icons for each region with better distribution
    createIconsWithVerticalDistribution('left', leftCount);
    createIconsWithVerticalDistribution('middle', middleCount);
    createIconsWithVerticalDistribution('right', rightCount);
    
    // Set icons
    setIcons(newIcons);
    
    // Clean up previous animations on unmount or property change
    return () => {
      setIcons([]);
    };
  }, [density, size, speed, iconColors, trajectory, rotation, distribution, pulse]);
  
  // Animation keyframes
  const animationKeyframes = {
    'float-up': `
      @keyframes float-up {
        0% {
          transform: translateY(0) ${rotation ? 'rotate(0deg)' : ''};
          opacity: 0;
        }
        2% { /* Change from 5% to 2% for faster fade-in */
          opacity: ${iconOpacity};
        }
        100% {
          transform: translateY(-${window.innerHeight + 100}px) ${rotation ? 'rotate(360deg)' : ''};
          opacity: 0;
        }
      }
    `,
    'float-left': `
      @keyframes float-left {
        0% {
          transform: translate(0, 0) ${rotation ? 'rotate(0deg)' : ''};
          opacity: 0;
        }
        2% { /* Change from 5% to 2% for faster fade-in */
          opacity: ${iconOpacity};
        }
        95% {
          opacity: ${iconOpacity};
        }
        100% {
          transform: translate(-80px, -${window.innerHeight + 100}px) ${rotation ? 'rotate(360deg)' : ''};
          opacity: 0;
        }
          }
    `,
    'float-right': `
      @keyframes float-right {
        0% {
          transform: translate(0, 0) ${rotation ? 'rotate(0deg)' : ''};
          opacity: 0;
        }
        2% { /* Change from 5% to 2% for faster fade-in */
          opacity: ${iconOpacity};
        }
        95% {
          opacity: ${iconOpacity};
        }
        100% {
          transform: translate(80px, -${window.innerHeight + 100}px) ${rotation ? 'rotate(360deg)' : ''};
          opacity: 0;
        }
          }
    `,
    'pulse': `
      @keyframes pulse {
        0% {
          transform: translateY(0) scale(1) ${rotation ? 'rotate(0deg)' : ''};
          opacity: 0;
        }
        2% { /* Change from 5% to 2% for faster fade-in */
          opacity: ${iconOpacity};
          transform: translateY(0) scale(1) ${rotation ? 'rotate(0deg)' : ''};
        }
        25% {
          transform: translateY(-${window.innerHeight * 0.25}px) scale(1.05) ${rotation ? 'rotate(90deg)' : ''};
        }
        50% {
          transform: translateY(-${window.innerHeight * 0.5}px) scale(0.95) ${rotation ? 'rotate(180deg)' : ''};
        }
        75% {
          transform: translateY(-${window.innerHeight * 0.75}px) scale(1.05) ${rotation ? 'rotate(270deg)' : ''};
        }
        95% {
          opacity: ${iconOpacity};
        }
        100% {
          transform: translateY(-${window.innerHeight + 100}px) scale(1) ${rotation ? 'rotate(360deg)' : ''};
          opacity: 0;
        }
          }
    `,
    'spin': `
      @keyframes spin {
        0% {
          transform: rotate(0deg);
          opacity: 0;
        }
        2% { /* Change from 5% to 2% for faster fade-in */
          opacity: ${iconOpacity};
        }
        100% {
          transform: rotate(360deg);
          opacity: ${iconOpacity};
        }
      }
    `
  };
  
  // Generate styles for all keyframes
  const generateKeyframeStyles = () => {
    return Object.values(animationKeyframes).join('\n');
  };
  
  return (
    <div className="floating-icons-container" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Animation keyframes */}
      <style>{generateKeyframeStyles()}</style>
      
      {/* Render all icons */}
      {icons.map(icon => {
        const { id, Component, size: iconSize, x, y, delay, duration, animation, color, rotate } = icon;
        
        // Animation style
        const animationStyle = {
          position: 'absolute' as const,
          left: `${x}px`,
          top: `${y}px`,
          animation: `${animation} ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          opacity: 0, // Start invisible to prevent flicker
          animationFillMode: 'forwards' as const,
          color: color,
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
        };
        
        return (
          <div key={id} style={animationStyle}>
            <Component
              size={iconSize}
              color={color}
              className={glow ? 'icon-glow' : ''}
            />
          </div>
        );
      })}
      
      {/* Glow effect styles */}
      {glow && (
        <style>
          {`
            .icon-glow {
              filter: drop-shadow(0 0 3px currentColor);
          }
        `}
      </style>
      )}
    </div>
  );
};

export default FloatingIcons;