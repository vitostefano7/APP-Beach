import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityTheme } from '../communityTheme';
import Avatar from '../../Avatar/Avatar';

interface QuickInputBarProps {
  avatarUrl?: string;
  userName?: string;
  placeholder?: string;
  onPress: () => void;
  // For structure avatar (owner mode)
  showStructureAvatar?: boolean;
  structureImageUrl?: string;
}

export const QuickInputBar: React.FC<QuickInputBarProps> = ({
  avatarUrl,
  userName = 'Tu',
  placeholder = 'Cosa stai organizzando?',
  onPress,
  showStructureAvatar = false,
  structureImageUrl,
}) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {/* Avatar */}
        {showStructureAvatar && structureImageUrl ? (
          <Image
            source={{ uri: structureImageUrl }}
            style={styles.structureAvatar}
          />
        ) : (
          <Avatar
            avatarUrl={avatarUrl}
            name={userName}
            size={40}
          />
        )}

        {/* Placeholder text */}
        <View style={styles.inputPlaceholder}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>

        {/* Plus button */}
        <View style={styles.addButton}>
          <Ionicons 
            name="add" 
            size={24} 
            color={CommunityTheme.colors.cardBackground} 
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: CommunityTheme.spacing.lg,
    marginVertical: CommunityTheme.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderRadius: CommunityTheme.borderRadius.xl,
    padding: CommunityTheme.spacing.md,
    borderWidth: 1,
    borderColor: CommunityTheme.colors.border,
    ...CommunityTheme.shadows.input,
  },
  structureAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  inputPlaceholder: {
    flex: 1,
    marginLeft: CommunityTheme.spacing.md,
    marginRight: CommunityTheme.spacing.md,
  },
  placeholderText: {
    ...CommunityTheme.typography.placeholder,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CommunityTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
