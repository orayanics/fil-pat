/**
 * Jungle Adventure Theme
 * A fun, vibrant jungle theme with animal characters and nature elements
 */

export const jungleAdventureTheme = {
  name: 'Jungle Adventure',
  id: 'jungle-adventure',
  
  colors: {
    primary: '#4CAF50',      // Jungle green
    secondary: '#FFA726',    // Sunset orange
    accent: '#FFD54F',       // Banana yellow
    background: '#E8F5E9',   // Light green background
    surface: '#FFFFFF',
    text: {
      primary: '#2E7D32',    // Dark green
      secondary: '#558B2F',
      light: '#81C784'
    },
    success: '#66BB6A',
    warning: '#FFA726',
    danger: '#EF5350',
    interactive: '#8BC34A'
  },

  fonts: {
    primary: "'Fredoka', 'Comic Sans MS', cursive",
    headings: "'Baloo 2', 'Fredoka', cursive",
    body: "'Nunito', 'Arial', sans-serif"
  },

  animations: {
    bounce: {
      keyframes: `
        @keyframes jungle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `,
      animation: 'jungle-bounce 1.5s ease-in-out infinite'
    },
    swing: {
      keyframes: `
        @keyframes jungle-swing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `,
      animation: 'jungle-swing 2s ease-in-out infinite'
    },
    grow: {
      keyframes: `
        @keyframes jungle-grow {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `,
      animation: 'jungle-grow 2s ease-in-out infinite'
    },
    shake: {
      keyframes: `
        @keyframes jungle-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `,
      animation: 'jungle-shake 0.5s ease-in-out'
    }
  },

  characters: {
    mascot: '🦁',           // Lion
    success: '🐵',          // Monkey
    encouragement: '🦜',    // Parrot
    thinking: '🐘',         // Elephant
    celebration: '🦒',      // Giraffe
    decorative: ['🌴', '🌺', '🦋', '🐛', '🍃', '🌿', '🥥', '🍌']
  },

  sounds: {
    correct: 'jungle-cheer',
    incorrect: 'jungle-oops',
    click: 'jungle-tap',
    complete: 'jungle-celebrate'
  },

  components: {
    button: {
      background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
      hoverBackground: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
      borderRadius: '20px',
      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
      hoverBoxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
      padding: '16px 32px',
      fontSize: '1.2rem',
      fontWeight: '700',
      textTransform: 'none' as const,
      border: '3px solid #2E7D32',
      transition: 'all 0.3s ease'
    },
    card: {
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F8E9 100%)',
      borderRadius: '24px',
      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
      border: '4px solid #4CAF50',
      padding: '24px',
      hoverTransform: 'translateY(-8px) scale(1.02)',
      hoverBoxShadow: '0 12px 32px rgba(76, 175, 80, 0.25)'
    },
    input: {
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '3px solid #81C784',
      focusBorder: '3px solid #4CAF50',
      padding: '14px 20px',
      fontSize: '1.1rem',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)'
    },
    header: {
      background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #8BC34A 100%)',
      color: '#FFFFFF',
      borderRadius: '0 0 24px 24px',
      boxShadow: '0 4px 16px rgba(46, 125, 50, 0.2)',
      padding: '20px'
    }
  },

  layouts: {
    backgroundPattern: `
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(129, 199, 132, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 213, 79, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(255, 167, 38, 0.1) 0%, transparent 50%);
      background-color: #E8F5E9;
    `,
    containerStyle: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      position: 'relative' as const
    }
  },

  feedback: {
    correct: {
      background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
      color: '#FFFFFF',
      icon: '🎉',
      message: 'Amazing! The jungle animals are so proud of you! 🦁'
    },
    incorrect: {
      background: 'linear-gradient(135deg, #FFE082 0%, #FFD54F 100%)',
      color: '#F57F17',
      icon: '🌟',
      message: 'Good try! Let\'s swing back and try again! 🐵'
    },
    encouragement: {
      background: 'linear-gradient(135deg, #81C784 0%, #AED581 100%)',
      color: '#2E7D32',
      icon: '💪',
      messages: [
        'You\'re doing great! 🦜',
        'Keep going, jungle explorer! 🐘',
        'The animals believe in you! 🦒',
        'You\'re as strong as a lion! 🦁'
      ]
    }
  }
};

export type KidsTheme = typeof jungleAdventureTheme;
