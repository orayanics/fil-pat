# Kids Mode Design Themes

This folder contains three unique, fun, and responsive design themes specifically created for children participating in speech-language pathology assessment sessions.

## Available Themes

### 🦁 Jungle Adventure
**Theme ID:** `jungle-adventure`

A vibrant jungle theme featuring:
- **Colors:** Bright greens, oranges, and yellows
- **Characters:** Lion 🦁, Monkey 🐵, Parrot 🦜, Elephant 🐘, Giraffe 🦒
- **Vibe:** Energetic, playful, nature-focused
- **Best for:** Active, energetic children who love animals

**Key Features:**
- Bouncing and swinging animations
- Nature-inspired decorative elements (palm trees, flowers, butterflies)
- Warm, encouraging feedback messages
- Rounded, friendly UI components

---

### 🚀 Space Explorer
**Theme ID:** `space-explorer`

An exciting cosmic adventure theme featuring:
- **Colors:** Deep blues, purples, and golden stars
- **Characters:** Rocket 🚀, Stars ⭐, UFO 🛸, Planets 🪐
- **Vibe:** Futuristic, adventurous, cosmic
- **Best for:** Children interested in space, science, and technology

**Key Features:**
- Floating and orbiting animations
- Twinkling stars and space background
- High-tech, futuristic UI elements
- Motivational space-themed messages

---

### 🐠 Ocean Friends
**Theme ID:** `ocean-friends`

A calming underwater adventure theme featuring:
- **Colors:** Blues, cyans, and coral accents
- **Characters:** Tropical Fish 🐠, Dolphin 🐬, Octopus 🐙, Turtle 🐢
- **Vibe:** Calm, soothing, aquatic
- **Best for:** Children who need a calmer environment or love the ocean

**Key Features:**
- Gentle wave and bubble animations
- Flowing, organic UI shapes
- Soothing water-themed colors
- Encouraging ocean-themed feedback

---

## Usage

### Importing a Theme

\`\`\`typescript
import { jungleAdventureTheme, spaceExplorerTheme, oceanFriendsTheme } from '@/styles/kids-themes';
// Or import all themes
import { kidsThemes, getKidsTheme } from '@/styles/kids-themes';
\`\`\`

### Applying a Theme

\`\`\`typescript
import { applyKidsTheme } from '@/styles/kids-themes';

// Apply theme and inject animations
const theme = applyKidsTheme('jungle-adventure');

// Use theme colors
const buttonStyle = {
  background: theme.colors.primary,
  color: theme.colors.text.primary,
};
\`\`\`

### Using Theme Components

\`\`\`typescript
import { getKidsTheme } from '@/styles/kids-themes';

const theme = getKidsTheme('space-explorer');

const buttonStyle = {
  ...theme.components.button,
  // Override or extend as needed
};
\`\`\`

### Getting Random Encouragement

\`\`\`typescript
import { getEncouragementMessage } from '@/styles/kids-themes';

const message = getEncouragementMessage('ocean-friends');
// Returns a random encouragement message from the theme
\`\`\`

---

## Theme Structure

Each theme includes:

### Colors
- Primary, secondary, and accent colors
- Background and surface colors
- Text color variants
- Status colors (success, warning, danger)

### Fonts
- Primary font family
- Heading font family
- Body font family

### Animations
- Custom keyframe animations
- Animation properties
- Theme-specific motion effects

### Characters
- Mascot emoji
- Success/encouragement emojis
- Decorative emoji set

### Components
- Pre-styled button configurations
- Card component styles
- Input field styles
- Header styles

### Layouts
- Background patterns
- Container styles
- Responsive configurations

### Feedback
- Correct answer feedback
- Incorrect answer feedback
- Encouragement messages
- Icons and colors for each state

---

## Design Principles

All themes follow these principles:

1. **High Contrast:** Ensures readability for all children
2. **Large Touch Targets:** Buttons and interactive elements are sized for small hands
3. **Clear Feedback:** Visual and textual feedback for every interaction
4. **Playful but Professional:** Fun without being distracting
5. **Responsive:** Works on all device sizes
6. **Accessible:** Considers various abilities and needs
7. **Age-Appropriate:** Designed for children aged 3-12

---

## Customization

Themes can be customized by:

1. Extending the base theme object
2. Overriding specific properties
3. Creating theme variants
4. Mixing elements from different themes

Example:
\`\`\`typescript
const customTheme = {
  ...jungleAdventureTheme,
  colors: {
    ...jungleAdventureTheme.colors,
    primary: '#FF6B6B', // Custom primary color
  },
};
\`\`\`

---

## Future Enhancements

Potential additions:
- Sound effect integration
- Additional themes (Dinosaur Park, Candy Land, Superhero City)
- Theme customization UI
- Seasonal theme variants
- Accessibility mode enhancements
