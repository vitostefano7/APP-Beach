import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
