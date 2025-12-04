/**
 * Space Explorer Theme
 * A light, playful space theme inspired by modern kids apps
 */

export const spaceExplorerTheme = {
  name: 'Space Explorer',
  id: 'space-explorer',
  
  colors: {
    primary: '#A8E6CF',      // Mint green
    secondary: '#FFD93D',    // Sunny yellow
    accent: '#FF6B6B',       // Coral red
    background: '#FFF5E6',   // Light peach
    backgroundPattern: `
      radial-gradient(circle at 15% 20%, rgba(255, 217, 61, 0.3) 0%, transparent 25%),
      radial-gradient(circle at 85% 80%, rgba(168, 230, 207, 0.3) 0%, transparent 25%),
      radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.15) 0%, transparent 20%),
      radial-gradient(3px 3px at 20% 30%, white, transparent),
      radial-gradient(2px 2px at 60% 70%, white, transparent),
      radial-gradient(2px 2px at 50% 50%, white, transparent),
      radial-gradient(1px 1px at 80% 10%, white, transparent),
      radial-gradient(3px 3px at 90% 60%, white, transparent),
      radial-gradient(2px 2px at 33% 75%, white, transparent),
      radial-gradient(2px 2px at 70% 35%, white, transparent),
      radial-gradient(1px 1px at 15% 90%, white, transparent),
      radial-gradient(2px 2px at 45% 15%, white, transparent),
      radial-gradient(1px 1px at 88% 45%, white, transparent),
      radial-gradient(2px 2px at 25% 60%, white, transparent),
      linear-gradient(to bottom, #FFF5E6 0%, #FFE5D9 100%)
    `,
    backgroundSize: 'auto, auto, auto, 200% 200%, 200% 200%, 300% 300%, 250% 250%, 280% 280%, 290% 290%, 310% 310%, 220% 220%, 260% 260%, 240% 240%, 270% 270%',
    surface: '#FFFFFF',
    text: {
      primary: '#2D3436',    // Dark gray
      secondary: '#636E72',
      light: '#B2BEC3'
    },
    success: '#6BCB77',
    warning: '#FFD93D',
    danger: '#FF6B6B',
    interactive: '#95E1D3'
  },

  fonts: {
    primary: "'Orbitron', 'Exo 2', 'Roboto', sans-serif",
    headings: "'Audiowide', 'Orbitron', sans-serif",
    body: "'Exo 2', 'Segoe UI', sans-serif"
  },

  animations: {
    float: {
      keyframes: `
        @keyframes space-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          75% { transform: translateY(15px) rotate(-5deg); }
        }
      `,
      animation: 'space-float 4s ease-in-out infinite'
    },
    orbit: {
      keyframes: `
        @keyframes space-orbit {
          0% { transform: rotate(0deg) translateX(30px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(30px) rotate(-360deg); }
        }
      `,
      animation: 'space-orbit 8s linear infinite'
    },
    twinkle: {
      keyframes: `
        @keyframes space-twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `,
      animation: 'space-twinkle 2s ease-in-out infinite'
    },
    rocket: {
      keyframes: `
        @keyframes space-rocket {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
          100% { transform: translateY(0px); }
        }
      `,
      animation: 'space-rocket 2s ease-in-out infinite'
    },
    pulse: {
      keyframes: `
        @keyframes space-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 64, 0.6); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 64, 0.9); }
        }
      `,
      animation: 'space-pulse 2s ease-in-out infinite'
    }
  },

  characters: {
    mascot: '🚀',           // Rocket
    success: '⭐',          // Star
    encouragement: '🌟',    // Glowing star
    thinking: '🛸',         // UFO
    celebration: '🎆',      // Fireworks
    decorative: ['🌕', '🪐', '🌠', '☄️', '🌌', '👽', '🛰️', '🌙']
  },

  sounds: {
    correct: 'space-success',
    incorrect: 'space-retry',
    click: 'space-beep',
    complete: 'space-victory'
  },

  components: {
    button: {
      background: 'linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)',
      hoverBackground: 'linear-gradient(135deg, #7986CB 0%, #9575CD 100%)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(92, 107, 192, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
      hoverBoxShadow: '0 6px 28px rgba(126, 87, 194, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.2)',
      padding: '16px 32px',
      fontSize: '1.15rem',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      border: '2px solid rgba(255, 215, 64, 0.3)',
      color: '#FFFFFF',
      letterSpacing: '1px',
      transition: 'all 0.3s ease'
    },
    card: {
      background: 'linear-gradient(135deg, #283593 0%, #3949AB 100%)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 4px rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(92, 107, 192, 0.4)',
      padding: '24px',
      hoverTransform: 'translateY(-10px) scale(1.03)',
      hoverBoxShadow: '0 12px 40px rgba(126, 87, 194, 0.5), inset 0 1px 4px rgba(255, 255, 255, 0.2)'
    },
    input: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '2px solid rgba(197, 202, 233, 0.3)',
      focusBorder: '2px solid #FFD740',
      padding: '14px 20px',
      fontSize: '1.1rem',
      color: '#FFFFFF',
      boxShadow: '0 2px 12px rgba(92, 107, 192, 0.2)'
    },
    header: {
      background: 'linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%)',
      color: '#FFFFFF',
      borderRadius: '0 0 20px 20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      padding: '20px'
    }
  },

  layouts: {
    backgroundPattern: `
      background-image: 
        radial-gradient(2px 2px at 20% 30%, white, transparent),
        radial-gradient(2px 2px at 60% 70%, white, transparent),
        radial-gradient(1px 1px at 50% 50%, white, transparent),
        radial-gradient(1px 1px at 80% 10%, white, transparent),
        radial-gradient(2px 2px at 90% 60%, white, transparent),
        radial-gradient(1px 1px at 33% 80%, white, transparent),
        radial-gradient(1px 1px at 15% 65%, white, transparent),
        linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%);
      background-size: 200% 200%;
      background-position: 0% 0%, 100% 100%, 50% 50%, 80% 10%, 90% 60%, 33% 80%, 15% 65%, 100% 100%;
      animation: space-stars 20s ease-in-out infinite;
      
      @keyframes space-stars {
        0%, 100% { background-position: 0% 0%, 100% 100%, 50% 50%, 80% 10%, 90% 60%, 33% 80%, 15% 65%, 100% 100%; }
        50% { background-position: 100% 100%, 0% 0%, 60% 40%, 70% 20%, 80% 70%, 43% 90%, 25% 55%, 0% 0%; }
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
      background: 'linear-gradient(135deg, #FFD740 0%, #FFA726 100%)',
      color: '#1A237E',
      icon: '🌟',
      message: 'Stellar work, Space Explorer! You\'re a true star! ⭐'
    },
    incorrect: {
      background: 'linear-gradient(135deg, #7986CB 0%, #5C6BC0 100%)',
      color: '#FFFFFF',
      icon: '🛸',
      message: 'Oops! Let\'s recalibrate and try again! 🚀'
    },
    encouragement: {
      background: 'linear-gradient(135deg, #7E57C2 0%, #9575CD 100%)',
      color: '#FFFFFF',
      icon: '💫',
      messages: [
        'Keep exploring, astronaut! 🚀',
        'You\'re out of this world! 🪐',
        'The galaxy believes in you! 🌌',
        'Shoot for the stars! ⭐'
      ]
    }
  }
};
