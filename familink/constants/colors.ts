export const Colors = {
  primary: '#FF6B9D',
  primaryLight: '#FFB3CE',
  primaryDark: '#E05580',

  secondary: '#4ECDC4',
  secondaryLight: '#A8E6E1',
  secondaryDark: '#3AB0A8',

  accent: '#FFE66D',
  accentLight: '#FFF3B0',

  background: '#FFF8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F9F4F1',

  text: '#2D2D2D',
  textSecondary: '#7A7A7A',
  textLight: '#ADADAD',
  textWhite: '#FFFFFF',

  border: '#EEE8E5',
  borderLight: '#F5F0ED',

  success: '#6BCB77',
  successLight: '#C1EEC6',
  warning: '#FFD93D',
  warningLight: '#FFF0A0',
  error: '#FF6B6B',
  errorLight: '#FFCECE',
  info: '#4D96FF',
  infoLight: '#C2D9FF',

  // Child colors (up to 6 children)
  child: [
    '#FF6B9D', // pink
    '#4ECDC4', // teal
    '#FFE66D', // yellow
    '#A8E6CF', // mint
    '#FF8B94', // salmon
    '#B4A7D6', // lavender
  ],

  // Transparent overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',

  shadow: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
