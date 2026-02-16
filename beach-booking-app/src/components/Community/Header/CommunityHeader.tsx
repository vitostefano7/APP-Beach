import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityTheme } from '../communityTheme';
import { Struttura } from '../../../types/community.types';

interface CommunityHeaderProps {
  title?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onBackPress?: () => void;
  isOwner?: boolean;
  // Owner-specific props
  selectedStructure?: Struttura | null;
  onStructurePress?: () => void;
  // Player-specific props
  showNotification?: boolean;
  showSearch?: boolean;
  showBackButton?: boolean;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  title = 'Community',
  onMenuPress,
  onNotificationPress,
  onSearchPress,
  onBackPress,
  isOwner = false,
  selectedStructure,
  onStructurePress,
  showNotification = true,
  showSearch = false,
  showBackButton = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
      {/* Left side - Back button */}
      <View style={styles.leftActions}>
        {showBackButton && (
          <Pressable 
            style={styles.iconButton}
            onPress={onBackPress}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={CommunityTheme.colors.textPrimary} 
            />
          </Pressable>
        )}
      </View>

      {/* Center - Title and optional structure selector */}
        <View style={styles.centerContent}>
          <Text style={styles.title}>{title}</Text>
          {selectedStructure && (
            <Pressable 
              style={styles.structureSelector}
              onPress={onStructurePress}
            >
              <Image
                source={{ uri: selectedStructure.images[0] }}
                style={styles.structureAvatar}
              />
              <Text 
                style={styles.structureName}
                numberOfLines={1}
              >
                {selectedStructure.name}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={16} 
                color={CommunityTheme.colors.textSecondary} 
              />
            </Pressable>
          )}
        </View>

        {/* Right side - Notification / Search */}
        <View style={styles.rightActions}>
          {showNotification && (
            <Pressable 
              style={styles.iconButton}
              onPress={onNotificationPress}
            >
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={CommunityTheme.colors.textPrimary} 
              />
            </Pressable>
          )}
          {showSearch && (
            <Pressable 
              style={[styles.iconButton, styles.searchButton]}
              onPress={onSearchPress}
            >
              <Ionicons 
                name="search" 
                size={24} 
                color={CommunityTheme.colors.primary} 
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: CommunityTheme.colors.border,
    ...CommunityTheme.shadows.header,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CommunityTheme.spacing.lg,
    paddingVertical: CommunityTheme.spacing.md,
    minHeight: CommunityTheme.sizes.headerHeight,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: CommunityTheme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  menuLine: {
    width: 24,
    height: 2.5,
    backgroundColor: CommunityTheme.colors.textPrimary,
    borderRadius: 2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: CommunityTheme.spacing.md,
  },
  title: {
    ...CommunityTheme.typography.headerTitle,
  },
  structureSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CommunityTheme.colors.background,
    paddingHorizontal: CommunityTheme.spacing.md,
    paddingVertical: 6,
    borderRadius: CommunityTheme.borderRadius.xl,
    marginTop: 4,
    maxWidth: 200,
  },
  structureAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: CommunityTheme.spacing.xs,
  },
  structureName: {
    ...CommunityTheme.typography.headerSubtitle,
    flex: 1,
    marginRight: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CommunityTheme.spacing.xs,
  },
  searchButton: {
    backgroundColor: CommunityTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: CommunityTheme.colors.primary,
  },
});
