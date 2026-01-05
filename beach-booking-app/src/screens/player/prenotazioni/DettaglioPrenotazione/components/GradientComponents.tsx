import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

// ==================== USAGE EXAMPLES ====================

/*
// 1. TEAM BADGE CON GRADIENT
<TeamAGradient style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
  <Text style={{ color: 'white', fontWeight: '800' }}>Team A</Text>
</TeamAGradient>

// 2. WINNER BUTTON
<WinnerGradient style={styles.submitScoreButton}>
  <Ionicons name="trophy" size={20} color="#FFF" />
  <Text style={styles.submitScoreButtonText}>Inserisci Risultato</Text>
</WinnerGradient>

// 3. SUCCESS BUTTON
<SuccessGradient style={styles.joinButton}>
  <Ionicons name="enter" size={18} color="white" />
  <Text style={styles.joinButtonText}>Unisciti</Text>
</SuccessGradient>

// 4. TEAM HEADER CON GRADIENT
<TeamAGradient style={[styles.teamHeader, { borderTopLeftRadius: 16, borderTopRightRadius: 16 }]}>
  <Ionicons name="people-circle" size={20} color="white" />
  <Text style={{ color: 'white', fontWeight: '800' }}>Team A</Text>
  <Text style={{ color: 'white' }}>2/2</Text>
</TeamAGradient>

// 5. STATUS BADGE CON GRADIENT
<SuccessGradient style={styles.statusBadge}>
  <Text style={[styles.statusText, { color: 'white' }]}>CONFERMATO</Text>
</SuccessGradient>

// 6. GLASS MORPHISM CARD (per effetto vetro)
<GlassMorphismCard style={{ padding: 20, margin: 20 }}>
  <Text style={{ fontSize: 18, fontWeight: '700' }}>Glass Effect</Text>
  <Text style={{ marginTop: 8 }}>Beautiful translucent card</Text>
</GlassMorphismCard>

// 7. SHIMMER PLACEHOLDER (loading state)
<ShimmerPlaceholder style={{ width: 100, height: 20, borderRadius: 10, marginBottom: 8 }} />

// 8. DARK OVERLAY (per modal backgrounds)
<DarkOverlayGradient style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: 'white' }}>Content on dark overlay</Text>
  </View>
</DarkOverlayGradient>
*/

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

// ==================== COMPLETE EXAMPLE COMPONENT ====================
export const GradientExample = () => {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f8f9fa' }}>
      {/* Team A Button */}
      <TeamAGradient style={gradientButtonStyles.teamAButton}>
        <Ionicons name="shield" size={20} color="white" />
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
          Team A
        </Text>
      </TeamAGradient>

      {/* Team B Button */}
      <TeamBGradient style={[gradientButtonStyles.teamBButton, { marginTop: 12 }]}>
        <Ionicons name="shield" size={20} color="white" />
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
          Team B
        </Text>
      </TeamBGradient>

      {/* Winner Button */}
      <WinnerGradient style={[gradientButtonStyles.winnerButton, { marginTop: 12 }]}>
        <Ionicons name="trophy" size={24} color="white" />
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>
          Inserisci Risultato
        </Text>
      </WinnerGradient>

      {/* Success Button */}
      <SuccessGradient style={[gradientButtonStyles.successButton, { marginTop: 12 }]}>
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
          Conferma
        </Text>
      </SuccessGradient>

      {/* Glass Morphism Card */}
      <GlassMorphismCard style={{ padding: 24, marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Glass Effect Card
        </Text>
        <Text style={{ color: '#666' }}>
          Beautiful translucent design with blur effect
        </Text>
      </GlassMorphismCard>
    </View>
  );
};