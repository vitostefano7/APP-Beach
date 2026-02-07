import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ==================== ANIMATED CARD ====================
interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0,
  style 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ==================== ANIMATED BUTTON ====================
interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  style,
  onPress,
  disabled,
  ...props 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[style, disabled && { opacity: 0.6 }]}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// ==================== FADE IN VIEW ====================
interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}

export const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0,
  duration = 400,
  style 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

// ==================== SLIDE IN VIEW ====================
interface SlideInViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: 'left' | 'right' | 'top' | 'bottom';
  style?: ViewStyle | ViewStyle[];
}

export const SlideInView: React.FC<SlideInViewProps> = ({ 
  children, 
  delay = 0,
  from = 'bottom',
  style 
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, []);

  const getTransform = () => {
    switch (from) {
      case 'left':
        return { translateX: slideAnim };
      case 'right':
        return { translateX: Animated.multiply(slideAnim, -1) };
      case 'top':
        return { translateY: slideAnim };
      case 'bottom':
      default:
        return { translateY: slideAnim };
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [getTransform()],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ==================== SCALE IN VIEW ====================
interface ScaleInViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({ 
  children, 
  delay = 0,
  style 
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ==================== PULSE VIEW ====================
interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const PulseView: React.FC<PulseViewProps> = ({ children, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ==================== SHAKE VIEW ====================
interface ShakeViewProps {
  children: React.ReactNode;
  trigger: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const ShakeView: React.FC<ShakeViewProps> = ({ 
  children, 
  trigger,
  style 
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

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
