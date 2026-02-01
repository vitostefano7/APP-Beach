/**
 * Community Design System
 * Colors, spacing, and style constants for the new Community UI
 */

export const CommunityTheme = {
  colors: {
    // Background
    background: '#F5F7FA',
    cardBackground: '#FFFFFF',
    
    // Primary
    primary: '#2196F3',
    primaryLight: '#E3F2FD',
    primaryDark: '#1976D2',
    
    // Text
    textPrimary: '#212121',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textPlaceholder: '#CCCCCC',
    
    // Borders
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    
    // Interactive
    like: '#FF5252',
    comment: '#666666',
    share: '#666666',
    
    // Status
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    
    // Badge colors
    proBadge: '#2196F3',
    intermediateBadge: '#4CAF50',
    beginnerBadge: '#FF9800',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 999,
  },
  
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    input: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  
  typography: {
    headerTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: '#212121',
    },
    headerSubtitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#666666',
    },
    postAuthor: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#212121',
    },
    postContent: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#212121',
      lineHeight: 22,
    },
    postTime: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: '#999999',
    },
    commentText: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#212121',
      lineHeight: 20,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600' as const,
    },
    placeholder: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#999999',
    },
  },
  
  sizes: {
    headerHeight: 60,
    tabBarHeight: 48,
    quickInputHeight: 56,
    avatarSmall: 32,
    avatarMedium: 40,
    avatarLarge: 48,
    iconSmall: 20,
    iconMedium: 24,
    iconLarge: 28,
  },
};

export type CommunityThemeType = typeof CommunityTheme;
