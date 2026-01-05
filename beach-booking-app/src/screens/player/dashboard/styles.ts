import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
  showMoreButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderTopWidth: 1,
  borderTopColor: '#f0f0f0',
  marginTop: 8,
  gap: 6,
},
showMoreText: {
  fontSize: 14,
  color: '#2196F3',
  fontWeight: '500',
},

  // Debug Section
  debugSection: {
    backgroundColor: "#fff3cd",
    margin: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#856404",
    marginBottom: 6,
  },
  debugText: {
    fontSize: 11,
    color: "#856404",
    marginBottom: 2,
  },
  debugButton: {
    backgroundColor: "#856404",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },

  // Header
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  greeting: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2196F3",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2196F3",
  },
  inviteCountBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviteCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
  },

  // Next Match Card
  nextMatchCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#2196F3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyNextMatchCard: {
    backgroundColor: "white",
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMatchContent: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  emptyMatchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  emptyMatchSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  matchImage: {
    width: "100%",
    height: 200,
    position: "absolute",
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  matchTimeBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchTimeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
  },
  matchInfo: {
    padding: 24,
    paddingBottom: 16,
  },
  matchDay: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
  },
  matchTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginTop: 4,
  },
  matchDetails: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  matchLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchLocationText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  matchActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  matchActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  matchActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },

  // Invite Card
  inviteCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Aggiungi questi stili alla sezione Invite Card:
expiredBadge: {
  position: "absolute",
  top: 12,
  right: 12,
  backgroundColor: "#F5F5F5",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E0E0E0",
},
expiredBadgeText: {
  fontSize: 10,
  fontWeight: "700",
  color: "#999",
},
expiredText: {
  fontSize: 12,
  fontStyle: "italic",
  color: "#999",
  textAlign: "center",
  width: "100%",
},  
  emptyInviteCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    borderLeftColor: "#e0e0e0",
  },
  emptyInviteContent: {
    alignItems: "center",
    gap: 8,
  },
  emptyInviteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  emptyInviteSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inviteLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  inviteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  inviteAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteInfo: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  inviteDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inviteDetailText: {
    fontSize: 13,
    color: "#666",
  },
  inviteDateTime: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  inviteDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteDateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2196F3",
  },
  inviteTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  inviteActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  inviteDecline: {
    backgroundColor: "#f8f9fa",
  },
  inviteDeclineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  inviteAccept: {
    backgroundColor: "#2196F3",
  },
  inviteAcceptText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  // Match History
  matchHistoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  matchResultBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  matchWin: {
    backgroundColor: "#FFF8E1",
  },
  matchLoss: {
    backgroundColor: "#FFEBEE",
  },
  matchHistoryInfo: {
    flex: 1,
  },
  matchHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  matchHistoryDate: {
    fontSize: 13,
    color: "#666",
    textTransform: "capitalize",
  },
  matchScore: {
    fontSize: 16,
    fontWeight: "800",
    marginRight: 12,
  },
  matchScoreWin: {
    color: "#4CAF50",
  },
  matchScoreLoss: {
    color: "#F44336",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Additional styles for debug
  debugContainer: {
    maxHeight: 200,
    marginTop: 8,
  },
  debugItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff8e1',
    borderRadius: 4,
  },
  debugItemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  debugItemText: {
    fontSize: 9,
    color: '#666',
  },
});