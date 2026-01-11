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
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 18,
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
  notificationButtonUnread: {
    backgroundColor: "#fff0f0",
    borderColor: "#ffcccc",
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%', // Occupa solo il 70% dell'altezza dello schermo
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

  // ==================== QUICK ACTIONS ====================
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  quickActionButtonDisabled: {
    flex: 0,
    width: 50,
    paddingHorizontal: 0,
    backgroundColor: '#f8f9fa',
    borderColor: '#f0f0f0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },

  // ==================== SECTIONS ====================
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#333",
  },
  sectionLink: {
    fontSize: 13,
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
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  matchImageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  emptyMatchSubtitle: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  matchImage: {
    width: "100%",
    height: "100%",
  },
  matchOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  matchContent: {
    padding: 16,
    gap: 12,
  },
  matchInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchInfoLeft: {
    flex: 1,
    gap: 8,
  },
  matchTimeBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 152, 0, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  matchTimeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  matchInfo: {
    padding: 20,
    paddingBottom: 8,
  },
  matchInfoSection: {
    gap: 4,
  },
  matchDay: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  matchTime: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  matchDetails: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  matchDetailsSection: {
    gap: 6,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  matchLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchLocationText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  playersAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  playerAvatar: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  morePlayersAvatar: {
    backgroundColor: "#E0E0E0",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  morePlayersText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
  },
  matchActions: {
    flexDirection: "row",
    gap: 10,
  },
  matchActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chatButton: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  matchActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },

  // ==================== OPEN MATCHES ====================
  openMatchCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  openMatchHeader: {
    marginBottom: 10,
  },
  openMatchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  openMatchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  openMatchSubtitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  openMatchBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openMatchBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  openMatchInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  openMatchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openMatchInfoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  openMatchTeams: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openMatchTeamContainer: {
    flex: 1,
  },
  openMatchTeamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  teamAHeaderSmall: {
    backgroundColor: "#2196F3",
  },
  teamBHeaderSmall: {
    backgroundColor: "#FF5722",
  },
  openMatchTeamTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  openMatchTeamSlots: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  openMatchTeamSlot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  openMatchSlotFilled: {
    backgroundColor: "transparent",
  },
  openMatchSlotEmpty: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  openMatchDivider: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  openMatchVs: {
    fontSize: 10,
    fontWeight: "800",
    color: "#999",
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
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  emptyInviteSubtitle: {
    fontSize: 13,
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
    fontSize: 14,
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
    fontSize: 12,
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
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  matchGradientBorder: {
    padding: 3,
    borderRadius: 20,
    height: '100%',
  },
  matchCardInner: {
    backgroundColor: 'white',
    borderRadius: 17,
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  matchResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchDateSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  matchHistoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  matchResultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  matchWin: {
    backgroundColor: "#E8F5E9",
  },
  matchLoss: {
    backgroundColor: "#FFEBEE",
  },
  matchResultText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  matchWinText: {
    color: '#4CAF50',
  },
  matchLossText: {
    color: '#F44336',
  },
  matchSportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  matchSportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2196F3',
  },
  matchTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  matchTeamSection: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  matchTeamLabelContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  matchTeamLabelContainerMy: {
    backgroundColor: '#E3F2FD',
  },
  matchTeamLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 0.5,
  },
  matchTeamLabelMy: {
    color: '#2196F3',
  },
  matchTeamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  matchAvatarA: {
    backgroundColor: '#E3F2FD',
  },
  matchAvatarB: {
    backgroundColor: '#FFEBEE',
  },
  matchAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#333',
  },
  matchPlayerNames: {
    alignItems: 'center',
    gap: 2,
  },
  matchPlayerName: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  matchPlayerNameMy: {
    color: '#2196F3',
    fontWeight: '700',
  },
  matchScoreMainContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 10,
  },
  matchScoreLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#333',
  },
  matchScoreSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ccc',
  },
  matchSetsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  matchSetScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  matchLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  matchLocationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  matchTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchTimeText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
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
    fontSize: 10,
    color: '#999',
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
    marginBottom: 24,
    paddingBottom: 12,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 8,
  },
  carouselCard: {
    width: '100%',
    marginBottom: 0,
  },
  carouselCounter: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  friendsCarouselFooter: {
    alignItems: 'center',
    marginTop: 12,
  },
  carouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#2196F3',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0',
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
    paddingVertical: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyCarouselText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
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

// Container carta amico suggerito
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

// Container avatar
suggestedFriendAvatarContainer: {
  position: "relative",
},

// Avatar
suggestedFriendAvatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
},

// Placeholder avatar con iniziali
suggestedFriendAvatarPlaceholder: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#E5E7EB",
  alignItems: "center",
  justifyContent: "center",
},

// Iniziali nel placeholder
suggestedFriendAvatarInitials: {
  color: "#374151",
  fontWeight: "600",
  fontSize: 18,
},

// Status dot piccolo (opzionale)
statusDotSmall: {
  position: "absolute",
  bottom: 1,
  right: 1,
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "#4CAF50",
  borderWidth: 1.5,
  borderColor: "white",
},

// Container info amico
suggestedFriendInfo: {
  flex: 1,
  justifyContent: "center",
  gap: 4,
},

// Nome e badge
suggestedFriendHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 2,
},

suggestedFriendName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  flex: 1,
},

// Username
suggestedFriendUsername: {
  fontSize: 12,
  color: "#666",
  marginBottom: 2,
},

// Statistiche
suggestedFriendStats: {
  fontSize: 13,
  color: "#666",
  marginBottom: 4,
},

// Amici in comune
commonFriendsBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 4,
},

commonFriendsText: {
  fontSize: 11,
  color: "#666",
},

// Sport preferiti
sportsContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 4,
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

moreSportsText: {
  fontSize: 10,
  color: '#999',
  marginLeft: 2,
},

// Bottone invita
inviteFriendButton: {
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
  alignSelf: 'flex-start',
},

inviteFriendText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#2196F3",
},

// Score badge (opzionale)
friendScoreBadge: {
  fontSize: 11,
  fontWeight: "700",
  color: "#2196F3",
  backgroundColor: "#E3F2FD",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 8,
  marginLeft: 8,
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

  // ==================== SUGGESTED FRIEND CARD (COMPATTO) ====================
  suggestedFriendCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  friendCardAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f0f0f0',
  },
  friendCardAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E5E7EB",
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendCardAvatarInitials: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 18,
  },
  friendCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  friendBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendCardUsername: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  friendCardStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  friendStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendStatText: {
    fontSize: 11,
    color: '#666',
  },
  friendCardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  friendCardButtonDisabled: {
    backgroundColor: '#e0e0e0',
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