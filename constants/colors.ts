/**
 * Apple Watch-inspired Color System
 * Based on watchOS design principles with enhanced contrast and accessibility
 */
const Colors = {
  // Primary color scheme (Dark theme inspired by Apple Watch)
  primary: {
    bg: "#000000",           // Pure black background like Apple Watch
    bgSecondary: "#1C1C1E", // Secondary dark background
    bgTertiary: "#2C2C2E",  // Tertiary background for cards
    text: "#FFFFFF",         // Primary white text
    textSecondary: "#EBEBF5", // Secondary text with 60% opacity
    textTertiary: "#EBEBF599", // Tertiary text with 40% opacity
    accent: "#007AFF",       // Apple blue
    accentSecondary: "#5AC8FA", // Light blue
    success: "#30D158",     // Apple green
    warning: "#FF9F0A",     // Apple orange
    danger: "#FF453A",      // Apple red
    purple: "#BF5AF2",      // Apple purple
    pink: "#FF2D92",        // Apple pink
    indigo: "#5856D6",      // Apple indigo
    teal: "#40C8E0",        // Apple teal
    mint: "#00C7BE",        // Apple mint
  },

  // Secondary backgrounds and surfaces
  surface: {
    primary: "#1C1C1E",     // Primary surface
    secondary: "#2C2C2E",   // Secondary surface
    tertiary: "#3A3A3C",    // Tertiary surface
    quaternary: "#48484A",  // Quaternary surface
    overlay: "rgba(0, 0, 0, 0.4)", // Modal overlay
  },

  // Card and component backgrounds
  card: {
    bg: "#1C1C1E",
    bgSecondary: "#2C2C2E",
    border: "#38383A",      // Subtle border
    borderSecondary: "#48484A", // More prominent border
    shadow: "rgba(0, 0, 0, 0.3)", // Card shadow
  },

  // Accent colors for different contexts
  accent: {
    primary: "#007AFF",     // Main accent (Apple blue)
    secondary: "#5AC8FA",   // Secondary accent
    success: "#30D158",     // Success states
    warning: "#FF9F0A",     // Warning states
    danger: "#FF453A",      // Error/danger states
    info: "#5856D6",        // Info states
    // Gradient combinations
    gradient: {
      blue: ["#007AFF", "#5AC8FA"],
      green: ["#30D158", "#40C8E0"],
      purple: ["#BF5AF2", "#5856D6"],
      pink: ["#FF2D92", "#BF5AF2"],
      orange: ["#FF9F0A", "#FF453A"],
    },
  },

  // Semantic colors
  semantic: {
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
    info: "#007AFF",
  },

  // Interactive states
  interactive: {
    pressed: "rgba(255, 255, 255, 0.1)",
    hover: "rgba(255, 255, 255, 0.05)",
    disabled: "rgba(255, 255, 255, 0.3)",
    focus: "#007AFF",
  },

  // Apple Watch specific colors
  watch: {
    digitalCrown: "#8E8E93",
    complication: "#FF9F0A",
    activity: {
      move: "#FF453A",      // Red ring
      exercise: "#30D158",  // Green ring
      stand: "#5AC8FA",     // Blue ring
    },
  },

  // Legacy support (for gradual migration)
  // TODO: Remove these after full migration
  secondary: {
    bg: "#1C1C1E", // Maps to surface.primary
  },
  success: "#30D158",
  warning: "#FF9F0A",
  danger: "#FF453A",
};

export default Colors;