import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { CommunityTheme } from '../communityTheme';
import { CommunityTab } from '../../../types/community.types';

interface Tab {
  id: CommunityTab;
  label: string;
}

interface CommunityTabBarProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  tabs?: Tab[];
}

const DEFAULT_TABS: Tab[] = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'post', label: 'Post' },
];

export const CommunityTabBar: React.FC<CommunityTabBarProps> = ({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CommunityTheme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: CommunityTheme.colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: CommunityTheme.spacing.lg,
  },
  tab: {
    paddingVertical: CommunityTheme.spacing.md,
    paddingHorizontal: CommunityTheme.spacing.lg,
    position: 'relative',
  },
  tabText: {
    ...CommunityTheme.typography.tabText,
    color: CommunityTheme.colors.textTertiary,
  },
  tabTextActive: {
    color: CommunityTheme.colors.textPrimary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: CommunityTheme.spacing.lg,
    right: CommunityTheme.spacing.lg,
    height: 3,
    backgroundColor: CommunityTheme.colors.primary,
    borderRadius: 2,
  },
});
