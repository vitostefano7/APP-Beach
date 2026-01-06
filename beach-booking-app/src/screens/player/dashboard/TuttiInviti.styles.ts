import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statPending: {
    color: "#FF9800",
  },
  statConfirmed: {
    color: "#4CAF50",
  },
  statDeclined: {
    color: "#F44336",
  },
  statExpired: {
    color: "#757575",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#eee",
  },

  // Filters
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  filterChipTextActive: {
    color: "white",
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginLeft: 2,
  },
  filterBadge: {
    backgroundColor: "#FF5252",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    paddingHorizontal: 4,
  },

  // List Container
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  // Invite Card
  inviteCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
    overflow: "hidden",
  },
  expiredCard: {
    backgroundColor: "#fafafa",
    borderColor: "#e0e0e0",
    opacity: 0.9,
  },
  confirmedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  declinedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },

  // Expired Badge
  expiredBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#757575",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  expiredBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  creatorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  inviteText: {
    fontSize: 13,
    color: "#666",
  },
  expiredText: {
    color: "#999",
  },
  declinedText: {
    color: "#F44336",
    opacity: 0.8,
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // Match Info Section
  matchInfoSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  expiredMatchInfo: {
    backgroundColor: "#f5f5f5",
  },
  matchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  pageHeader: {
  backgroundColor: "white",
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},
pageTitle: {
  fontSize: 28,
  fontWeight: "800",
  color: "#333",
  marginBottom: 4,
},
pageSubtitle: {
  fontSize: 14,
  color: "#666",
  fontWeight: "500",
},

  // Players Preview
  playersPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playersAvatars: {
    flexDirection: "row",
  },
  playerAvatarWrapper: {
    position: "relative",
  },
  playerAvatarOverlap: {
    marginLeft: -12,
  },
  playerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "white",
  },
  playerAvatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  expiredPlayerAvatar: {
    opacity: 0.7,
    borderColor: "#e0e0e0",
  },
  playersCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  // Quick Actions in Card
  cardQuickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickDeclineButton: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  quickAcceptButton: {
    backgroundColor: "#2196F3",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickAcceptText: {
    color: "white",
  },

  // Response Messages
  respondedMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  confirmedMessage: {
    backgroundColor: "#E8F5E9",
  },
  declinedMessage: {
    backgroundColor: "#FFEBEE",
  },
  expiredMessage: {
    backgroundColor: "#F5F5F5",
  },
  respondedMessageText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Chevron
  chevronContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default styles;