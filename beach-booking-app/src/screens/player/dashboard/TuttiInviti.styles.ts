import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  statPending: {
    color: "#FF9800",
  },
  statConfirmed: {
    color: "#4CAF50",
  },
  statExpired: {
    color: "#757575",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 12,
  },

  // Filters
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "white",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
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
  },
  filterBadge: {
    backgroundColor: "#FF5252",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },

  // List
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },

  // Invite Card
  inviteCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    position: "relative",
  },
  expiredCard: {
    backgroundColor: "#fafafa",
    borderLeftColor: "#BDBDBD",
  },
  confirmedCard: {
    borderLeftColor: "#4CAF50",
  },
  declinedCard: {
    borderLeftColor: "#F44336",
  },

  // Badge Scaduto
  expiredBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#757575",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  creatorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: "#757575",
  },

  // Status Badge unificato
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // Match Info
  matchInfoSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  expiredMatchInfo: {
    backgroundColor: "#f5f5f5",
  },
  matchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },

  // Players Preview
  playersPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 12,
  },
  playersAvatars: {
    flexDirection: "row",
  },
  playerAvatarWrapper: {
    marginRight: -8,
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
  expiredPlayerAvatar: {
    opacity: 0.6,
    borderColor: "#f5f5f5",
  },
  playerAvatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  playersCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  // Actions
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  declineButton: {
    backgroundColor: "#FFEBEE",
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F44336",
  },
  acceptButton: {
    backgroundColor: "#2196F3",
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  // Messaggi
  expiredMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  expiredMessageText: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  
  respondedMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 8,
  },
  respondedMessageText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Chevron
  chevronContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});