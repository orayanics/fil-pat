/**
 * Ocean Friends Theme
 * A calming underwater adventure theme with sea creatures and ocean elements
 */

export const oceanFriendsTheme = {
  name: 'Ocean Friends',
  id: 'ocean-friends',
  
  colors: {
    primary: '#0288D1',      // Ocean blue
    secondary: '#00ACC1',    // Cyan wave
    accent: '#FF7043',       // Coral orange
    background: '#E1F5FE',   // Light ocean
    surface: '#B3E5FC',      // Water surface
    text: {
      primary: '#01579B',    // Deep ocean
      secondary: '#0277BD',
      light: '#4FC3F7'
    },
    success: '#26A69A',
    warning: '#FFA726',
    danger: '#EF5350',
    interactive: '#29B6F6'
  },

  fonts: {
    primary: "'Quicksand', 'Varela Round', sans-serif",
    headings: "'Pacifico', 'Quicksand', cursive",
    body: "'Poppins', 'Arial', sans-serif"
  },

  animations: {
    wave: {
      keyframes: `
        @keyframes ocean-wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          75% { transform: translateX(-10px) translateY(5px); }
        }
      `,
      animation: 'ocean-wave 3s ease-in-out infinite'
    },
    swim: {
      keyframes: `
        @keyframes ocean-swim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
      `,
      animation: 'ocean-swim 15s linear infinite'
    },
    bubble: {
      keyframes: `
        @keyframes ocean-bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.5; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
      `,
      animation: 'ocean-bubble 3s ease-in-out infinite'
    },
    ripple: {
      keyframes: `
        @keyframes ocean-ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `,
      animation: 'ocean-ripple 1.5s ease-out'
    },
    float: {
      keyframes: `
        @keyframes ocean-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `,
      animation: 'ocean-float 3s ease-in-out infinite'
    }
  },

  characters: {
    mascot: '🐠',           // Tropical fish
    success: '🐙',          // Octopus
    encouragement: '🐬',    // Dolphin
    thinking: '🐢',         // Turtle
    celebration: '🦈',      // Shark
    decorative: ['🐡', '🦀', '🦞', '🐚', '⭐', '🪸', '🌊', '🫧']
  },

  sounds: {
    correct: 'ocean-splash',
    incorrect: 'ocean-bubble',
    click: 'ocean-pop',
    complete: 'ocean-cheer'
  },

  components: {
    button: {
      background: 'linear-gradient(135deg, #29B6F6 0%, #0288D1 100%)',
      hoverBackground: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
      borderRadius: '24px',
      boxShadow: '0 4px 16px rgba(2, 136, 209, 0.3)',
      hoverBoxShadow: '0 6px 24px rgba(41, 182, 246, 0.4)',
      padding: '16px 32px',
      fontSize: '1.2rem',
      fontWeight: '600',
      textTransform: 'none' as const,
      border: '3px solid rgba(255, 255, 255, 0.5)',
      color: '#FFFFFF',
      transition: 'all 0.3s ease'
    },
    card: {
      background: 'linear-gradient(135deg, #FFFFFF 0%, #E1F5FE 100%)',
      borderRadius: '28px',
      boxShadow: '0 8px 28px rgba(2, 136, 209, 0.2)',
      border: '4px solid #4FC3F7',
      padding: '24px',
      hoverTransform: 'translateY(-8px) rotate(1deg)',
      hoverBoxShadow: '0 12px 36px rgba(41, 182, 246, 0.3)'
    },
    input: {
      background: '#FFFFFF',
      borderRadius: '18px',
      border: '3px solid #4FC3F7',
      focusBorder: '3px solid #0288D1',
      padding: '14px 20px',
      fontSize: '1.1rem',
      boxShadow: '0 2px 10px rgba(2, 136, 209, 0.1)'
    },
    header: {
      background: 'linear-gradient(135deg, #0288D1 0%, #29B6F6 50%, #4FC3F7 100%)',
      color: '#FFFFFF',
      borderRadius: '0 0 28px 28px',
      boxShadow: '0 4px 20px rgba(2, 136, 209, 0.3)',
      padding: '20px'
    }
  },

  layouts: {
    backgroundPattern: `
      background-image: 
        radial-gradient(circle at 15% 25%, rgba(79, 195, 247, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 85% 75%, rgba(41, 182, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(2, 136, 209, 0.1) 0%, transparent 60%),
        linear-gradient(180deg, #E1F5FE 0%, #B3E5FC 100%);
      background-size: 100% 100%;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: 
          repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.05) 0px,
            transparent 2px,
            transparent 4px,
            rgba(255, 255, 255, 0.05) 6px
          );
        animation: ocean-wave-pattern 10s linear infinite;
        pointer-events: none;
      }
      
      @keyframes ocean-wave-pattern {
        0% { transform: translateY(0); }
        100% { transform: translateY(20px); }
      }
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
      background: 'linear-gradient(135deg, #26A69A 0%, #00ACC1 100%)',
      color: '#FFFFFF',
      icon: '🎉',
      message: 'Fantastic! The ocean friends are celebrating with you! 🐬'
    },
    incorrect: {
      background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)',
      color: '#01579B',
      icon: '🫧',
      message: 'No worries! Let\'s swim back and try again! 🐠'
    },
    encouragement: {
      background: 'linear-gradient(135deg, #29B6F6 0%, #4FC3F7 100%)',
      color: '#01579B',
      icon: '⭐',
      messages: [
        'You\'re swimming along great! 🐠',
        'Keep diving deeper, ocean explorer! 🐢',
        'The sea creatures are cheering for you! 🐙',
        'You\'re making waves! 🌊'
      ]
    }
  }
};
