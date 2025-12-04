/**
 * useKidsTheme Hook
 * 
 * Custom React hook for managing kids mode themes in components
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  KidsThemeId, 
  KidsTheme, 
  getKidsTheme, 
  applyKidsTheme,
  getEncouragementMessage 
} from './index';

interface UseKidsThemeOptions {
  defaultTheme?: KidsThemeId;
  enableAnimations?: boolean;
  autoApplyKeyframes?: boolean;
}

export const useKidsTheme = (options: UseKidsThemeOptions = {}) => {
  const {
    defaultTheme = 'jungle-adventure',
    enableAnimations = true,
    autoApplyKeyframes = true,
  } = options;

  const [currentThemeId, setCurrentThemeId] = useState<KidsThemeId>(defaultTheme);
  const [animationsEnabled, setAnimationsEnabled] = useState(enableAnimations);

  // Get current theme object
  const theme = useMemo(() => {
    return getKidsTheme(currentThemeId);
  }, [currentThemeId]);

  // Apply theme keyframes when theme changes
  useEffect(() => {
    if (autoApplyKeyframes) {
      applyKidsTheme(currentThemeId);
    }
  }, [currentThemeId, autoApplyKeyframes]);

  // Switch to a different theme
  const switchTheme = (themeId: KidsThemeId) => {
    setCurrentThemeId(themeId);
  };

  // Toggle animations
  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };

  // Get random encouragement message
  const getRandomEncouragement = () => {
    return getEncouragementMessage(currentThemeId);
  };

  // Get animation style with optional disable
  const getAnimation = (animationKey: string) => {
    if (!animationsEnabled) return {};
    
    const animation = (theme.animations as any)[animationKey];
    return {
      animation: animation?.animation || 'none',
    };
  };

  // Get component style
  const getComponentStyle = (componentKey: string) => {
    return (theme.components as any)[componentKey];
  };

  // Get themed button style
  const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => {
    const baseStyle = theme.components.button;
    
    if (variant === 'secondary') {
      return {
        ...baseStyle,
        background: theme.colors.secondary,
        hoverBackground: theme.colors.interactive,
      };
    }
    
    return baseStyle;
  };

  // Get themed card style
  const getCardStyle = (interactive: boolean = false) => {
    const baseStyle = theme.components.card;
    
    return {
      ...baseStyle,
      cursor: interactive ? 'pointer' : 'default',
      transition: interactive ? 'all 0.3s ease' : 'none',
    };
  };

  // Get character emoji
  const getCharacter = (type: string) => {
    return (theme.characters as any)[type];
  };

  // Get random decorative emoji
  const getRandomDecoration = () => {
    const decorative = theme.characters.decorative;
    return decorative[Math.floor(Math.random() * decorative.length)];
  };

  // Get feedback configuration
  const getFeedback = (type: 'correct' | 'incorrect' | 'encouragement') => {
    return theme.feedback[type];
  };

  return {
    // State
    currentThemeId,
    theme,
    animationsEnabled,
    
    // Actions
    switchTheme,
    toggleAnimations,
    
    // Getters
    getAnimation,
    getComponentStyle,
    getButtonStyle,
    getCardStyle,
    getCharacter,
    getRandomDecoration,
    getFeedback,
    getRandomEncouragement,
  };
};

// Example usage:
/*
function MyComponent() {
  const {
    theme,
    currentThemeId,
    switchTheme,
    getButtonStyle,
    getAnimation,
    getCharacter,
    getFeedback,
  } = useKidsTheme({ defaultTheme: 'jungle-adventure' });

  return (
    <div style={{ background: theme.colors.background }}>
      <h1 style={{ color: theme.colors.primary, fontFamily: theme.fonts.headings }}>
        {getCharacter('mascot')} Welcome to {theme.name}!
      </h1>
      
      <button 
        style={getButtonStyle('primary')}
        onClick={() => switchTheme('space-explorer')}
      >
        Switch Theme
      </button>
      
      <div style={getAnimation('bounce')}>
        Bouncing element!
      </div>
      
      <div style={getFeedback('correct').background}>
        {getFeedback('correct').message}
      </div>
    </div>
  );
}
*/
