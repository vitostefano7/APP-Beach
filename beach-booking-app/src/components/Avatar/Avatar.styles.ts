import { StyleSheet } from 'react-native';

export const SIZE_MAP = {
  small: 40,
  medium: 50,
  large: 80,
  xlarge: 100,
} as const;

export const TEAM_COLOR_MAP = {
  A: '#2196F3',      // Blue
  B: '#F44336',      // Red
  none: '#ef8f00',   // Orange (default)
} as const;

export const getAvatarStyles = (size: number, bgColor: string) => {
  const borderRadius = size / 2;
  const fontSize = Math.round(size * 0.32); // Scale text relative to avatar size
  const statusDotSize = Math.round(size * 0.2);

  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius,
      overflow: 'hidden',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize,
      fontWeight: '700',
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: statusDotSize,
      height: statusDotSize,
      borderRadius: statusDotSize / 2,
      borderWidth: 2,
      borderColor: '#fff',
    },
  });
};
