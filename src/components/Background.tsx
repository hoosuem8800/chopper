import React from 'react';
import FloatingIcons, { IconColorTheme } from './FloatingIcons';

export type PatternType = 'grid' | 'dots' | 'waves' | 'circles' | 'hexagons' | 'diamonds' | 'triangles';
export type DensityOption = 'sparse' | 'medium' | 'dense';
export type SizeOption = 'small' | 'medium' | 'large';
export type SpeedOption = 'slow' | 'medium' | 'fast';
export type TrajectoryType = 'upward' | 'zigzag' | 'spiral' | 'random';
export type DistributionType = 'even' | 'clustered' | 'corners' | 'center';

interface BackgroundProps {
  children?: React.ReactNode;
  className?: string;
  
  // Visibility options
  showFloatingIcons?: boolean;
  showPattern?: boolean;
  
  // Pattern options
  patternOpacity?: number;
  patternType?: PatternType;
  patternSize?: SizeOption;
  patternAnimation?: boolean;
  patternSpeed?: SpeedOption;
  
  // Icon options
  iconDensity?: DensityOption;
  iconSize?: SizeOption;
  iconSpeed?: SpeedOption;
  iconGlow?: boolean;
  iconColors?: IconColorTheme;
  
  // Advanced icon options
  iconOpacity?: number;
  iconTrajectory?: TrajectoryType;
  iconRotation?: boolean;
  iconDistribution?: DistributionType;
  iconPulse?: boolean;
  
  // Background options
  backgroundColor?: string;
}

const Background = ({ 
  children, 
  className = '', 
  
  // Visibility options
  showFloatingIcons = true,
  showPattern = true,
  
  // Pattern options
  patternOpacity = 0.15,
  patternType = 'grid',
  patternSize = 'medium',
  patternAnimation = true,
  patternSpeed = 'medium',
  
  // Icon options
  iconDensity = 'medium',
  iconSize = 'medium',
  iconSpeed = 'medium',
  iconGlow = true,
  iconColors,
  
  // Advanced icon options
  iconOpacity = 0.8,
  iconTrajectory = 'upward',
  iconRotation = true,
  iconDistribution = 'even',
  iconPulse = false,
  
  // Background options
  backgroundColor = 'gradient-bg'
}: BackgroundProps) => {
  
  // Determine pattern class
  let patternClass = 'background-pattern';
  
  // Pattern type classes
  if (patternType === 'dots') {
    patternClass += ' pattern-dots';
  } else if (patternType === 'waves') {
    patternClass += ' pattern-waves';
  } else if (patternType === 'circles') {
    patternClass += ' pattern-circles';
  } else if (patternType === 'hexagons') {
    patternClass += ' pattern-hexagons';
  } else if (patternType === 'diamonds') {
    patternClass += ' pattern-diamonds';
  } else if (patternType === 'triangles') {
    patternClass += ' pattern-triangles';
  } else {
    patternClass += ' pattern-grid';
  }
  
  // Apply pattern size class to the container rather than to individual patterns
  if (patternSize === 'small') {
    patternClass += ' pattern-size-small';
  } else if (patternSize === 'large') {
    patternClass += ' pattern-size-large';
  } else {
    patternClass += ' pattern-size-medium';
  }
  
  // Apply animation and speed classes
  if (patternAnimation) {
    if (patternSpeed === 'slow') {
      patternClass += ' pattern-speed-slow';
    } else if (patternSpeed === 'fast') {
      patternClass += ' pattern-speed-fast';
    } else {
      patternClass += ' pattern-speed-medium';
    }
  } else {
    patternClass += ' pattern-no-animation';
  }

  // Determine opacity class
  let opacityClass = '';
  if (patternOpacity <= 0.1) {
    opacityClass = 'opacity-10';
  } else if (patternOpacity <= 0.2) {
    opacityClass = 'opacity-20';
  } else if (patternOpacity <= 0.3) {
    opacityClass = 'opacity-30';
  } else {
    opacityClass = 'opacity-40';
  }

  return (
    <div className={`min-h-screen flex flex-col relative ${backgroundColor} ${className}`}>
      {/* Base Layer (z-index: -10 to 0) */}
      <div className="relative">
        {/* Floating icons at the bottom layer */}
        {showFloatingIcons && (
          <FloatingIcons 
            density={iconDensity} 
            size={iconSize} 
            speed={iconSpeed} 
            glow={iconGlow} 
            iconColors={iconColors}
            iconOpacity={iconOpacity}
            trajectory={iconTrajectory}
            rotation={iconRotation}
            distribution={iconDistribution}
            pulse={iconPulse}
          />
        )}
        
        {/* Background pattern above floating icons */}
        {showPattern && (
          <div className={`${patternClass} ${opacityClass} z-0`}></div>
        )}
        
        {/* Light effect overlay for depth */}
        <div className="absolute inset-0 pointer-events-none radial-overlay z-0"></div>
      </div>
      
      {/* Content layer (z-index: 10) */}
      <div className="relative z-10 flex-grow flex flex-col">
      {children}
      </div>
    </div>
  );
};

export default Background; 