import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // ==================== LAYOUT ====================
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
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

  // ==================== HEADER ====================
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRightCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Avatar
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
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 20,
  },
  statusDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },

  // Testi header
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

  // Bottoni header
  chatButtonAnimatedContainer: {
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatToggleButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e1f0ff",
  },
  chatButtonPressed: {
    backgroundColor: "#e1f0ff",
    transform: [{ scale: 0.95 }],
  },
  notificationButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // ==================== MODAL CHAT ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    flex: 1,
    marginTop: 60,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  chatModalHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  chatModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  chatContentContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
    // Stile per bottone chat con messaggi non letti
  chatButtonUnread: {
    backgroundColor: "#FFEBEE", // Rosso chiaro
    borderColor: "#FFCDD2",
  },

  // Badge per chat (messaggi non letti)
  chatUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    zIndex: 10,
  },
  
  chatUnreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },

  // ==================== STATS ====================
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

  // ==================== SECTIONS ====================
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

  // ==================== NEXT MATCH ====================
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

  // ==================== INVITES ====================
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

  // ==================== MATCH HISTORY ====================
  matchHistoryCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    height: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchHistoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  matchResultBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  matchWin: {
    backgroundColor: "#FFF8E1",
  },
  matchLoss: {
    backgroundColor: "#FFEBEE",
  },
  matchHistoryInfo: {
    flex: 1,
    marginLeft: 12,
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
    marginTop: 4,
  },
  matchScoreWin: {
    color: "#4CAF50",
  },
  matchScoreLoss: {
    color: "#F44336",
  },

  // ==================== CAROUSEL ====================
  carouselSection: {
    marginBottom: 32,
    paddingBottom: 16,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carouselContent: {
    paddingHorizontal: 12,
  },
  carouselCard: {
    width: '100%',
    marginBottom: 0,
  },
  carouselCounter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 12,
  },
  carouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#2196F3',
  },
  inactiveDot: {
    backgroundColor: '#ddd',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: '#2196F3',
    width: 12,
  },
  carouselIndicatorInactive: {
    backgroundColor: '#ddd',
  },
  moreDotsText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
  },
  emptyCarouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  emptyCarouselText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptyCarouselSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
  noCompletedMatches: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  noCompletedMatchesText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },

  // ==================== SUGGESTED FRIENDS ====================
  friendsCountBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  friendsCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
  },
  suggestedFriendCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 140,
    width: '100%',
  },
  suggestedFriendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  suggestedFriendAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestedFriendInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  suggestedFriendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestedFriendName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  friendScoreBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2196F3",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  usernameText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  suggestedFriendStats: {
    fontSize: 13,
    color: "#666",
  },

  // ==================== BADGES ====================
  // Badge di priorità
  priorityBadgeHigh: {
    backgroundColor: '#2196F3',
  },
  priorityBadgeMedium: {
    backgroundColor: '#FF9800',
  },
  priorityBadgeLow: {
    backgroundColor: '#9C27B0',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },

  // Stato amicizia
  friendshipStatusPending: {
    backgroundColor: '#FF9800',
  },
  friendshipStatusAccepted: {
    backgroundColor: '#4CAF50',
  },
  friendshipStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },

  // Sport preferiti
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  sportBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7B1FA2',
  },

  // ==================== FRIEND ACTIONS ====================
  friendActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#BBDEFB",
    minWidth: 80,
    justifyContent: 'center',
  },
  friendActionButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
  },
  friendActionButtonSuccess: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  friendActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  friendActionTextDisabled: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  friendActionTextSuccess: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },

  // ==================== PRIORITY METRICS ====================
  priorityMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  priorityMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityMetricText: {
    fontSize: 11,
    color: "#666",
    fontWeight: '600',
  },

  // Legenda priorità
  priorityLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  priorityLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityDotHigh: {
    backgroundColor: '#2196F3',
  },
  priorityDotMedium: {
    backgroundColor: '#FF9800',
  },
  priorityDotLow: {
    backgroundColor: '#9C27B0',
  },
  priorityLegendText: {
    fontSize: 11,
    color: "#666",
  },

  // ==================== LOADING & ERROR ====================
  loadingContainerSmall: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  loadingTextSmall: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // ==================== FAB ====================
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

  // ==================== DEBUG ====================
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