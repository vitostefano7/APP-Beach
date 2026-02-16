import { StyleSheet } from 'react-native';

export const searchScreenStyles = StyleSheet.create({
  // Container
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerSearchBar: {
    flex: 1,
  },

  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  tabButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabButtonTextActive: {
    color: '#2196F3',
  },

  // Sections
  section: {
    marginTop: 16,
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
  },
  clearText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 4,
  },

  // Recent Searches
  recentSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },

  // Search Results
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
    gap: 4,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#666',
  },
  commonMatchesText: {
    fontSize: 13,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '500',
  },
  searchResultRight: {
    marginLeft: 12,
  },

  // Badges
  youBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  friendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
