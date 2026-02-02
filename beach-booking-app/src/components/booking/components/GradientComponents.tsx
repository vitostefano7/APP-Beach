import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ==================== GRADIENT BACKGROUNDS ====================

// Team A Gradient (Blue)
export const TeamAGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#2196F3', '#1976D2', '#1565C0']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Team B Gradient (Red)
export const TeamBGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#F44336', '#E53935', '#D32F2F']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Winner Gradient (Gold)
export const WinnerGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#FFD700', '#FFC107', '#FF9800']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Success Gradient (Green)
export const SuccessGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#4CAF50', '#43A047', '#388E3C']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Warning Gradient (Orange)
export const WarningGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#FF9800', '#FB8C00', '#F57C00']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Subtle Background Gradient
export const SubtleGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['#ffffff', '#f8f9fa', '#f0f0f0']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// Dark Gradient (for overlays)
export const DarkOverlayGradient: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ 
  style, 
  children 
}) => (
  <LinearGradient
    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={style}
  >
    {children}
  </LinearGradient>
);

// ==================== SHIMMER EFFECT ====================
export const ShimmerPlaceholder: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#E0E0E0' }, style]}>
      <LinearGradient
        colors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </View>
  );
};

// ==================== GLASS MORPHISM CARD ====================
export const GlassMorphismCard: React.FC<{ 
  style?: ViewStyle; 
  children?: React.ReactNode;
  blur?: number;
}> = ({ style, children, blur = 10 }) => (
  <View
    style={[
      {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ==================== ADVANCED BUTTON STYLES ====================
export const gradientButtonStyles = {
  teamAButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  teamBButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  winnerButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  successButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
};
