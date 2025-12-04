/**
 * Kids Mode Design Themes
 * 
 * Three unique, fun, and responsive themes designed to keep children engaged
 * during speech-language pathology assessment sessions.
 * 
 * Each theme includes:
 * - Unique color palettes
 * - Custom fonts
 * - Engaging animations
 * - Character mascots and emojis
 * - Themed feedback messages
 * - Responsive layouts
 */

import { jungleAdventureTheme } from './jungle-adventure';
import { spaceExplorerTheme } from './space-explorer';
import { oceanFriendsTheme } from './ocean-friends';

export type KidsTheme = typeof jungleAdventureTheme | typeof spaceExplorerTheme | typeof oceanFriendsTheme;

export const kidsThemes = {
  'jungle-adventure': jungleAdventureTheme,
  'space-explorer': spaceExplorerTheme,
  'ocean-friends': oceanFriendsTheme,
} as const;

export type KidsThemeId = keyof typeof kidsThemes;

export const kidsThemesList = [
  jungleAdventureTheme,
  spaceExplorerTheme,
  oceanFriendsTheme,
] as const;

// Helper function to get a theme by ID
export const getKidsTheme = (themeId: KidsThemeId): KidsTheme => {
  return kidsThemes[themeId];
};

// Helper function to get random encouragement message
export const getEncouragementMessage = (themeId: KidsThemeId): string => {
  const theme = getKidsTheme(themeId);
  const messages = theme.feedback.encouragement.messages;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to apply theme to a component
export const applyKidsTheme = (themeId: KidsThemeId) => {
  const theme = getKidsTheme(themeId);
  
  // Inject keyframes
  if (!document.getElementById(`kids-theme-${themeId}-keyframes`)) {
    const style = document.createElement('style');
    style.id = `kids-theme-${themeId}-keyframes`;
    
    let keyframesCSS = '';
    Object.values(theme.animations).forEach(anim => {
      if (anim.keyframes) {
        keyframesCSS += anim.keyframes;
      }
    });
    
    style.textContent = keyframesCSS;
    document.head.appendChild(style);
  }
  
  return theme;
};

export {
  jungleAdventureTheme,
  spaceExplorerTheme,
  oceanFriendsTheme,
};
