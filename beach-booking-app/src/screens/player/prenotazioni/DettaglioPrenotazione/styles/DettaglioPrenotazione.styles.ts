import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  // ==================== CONTAINER ====================
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Più chiaro per contrasto
  },
  container: {
    flex: 1,
  },

  // ==================== HEADER ====================
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  headerCancelButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
  },

  // ==================== LOADING & ERROR ====================
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ==================== MODERN STATUS CARD ====================
  modernStatusCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modernStatusIconContainer: {
    flexShrink: 0,
  },
  modernStatusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modernStatusContent: {
    flex: 1,
    gap: 3,
  },
  modernStatusLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modernStatusText: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modernStatusSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  // ==================== STATUS CARD (OLD - KEEP FOR COMPATIBILITY) ====================
  statusCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusConfirmed: {
    backgroundColor: "#E8F5E9",
  },
  statusCancelled: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statusInfo: {
    gap: 14,
  },
  statusInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusInfoText: {
    fontSize: 15,
    color: "#4a4a4a",
    fontWeight: "500",
    lineHeight: 21,
  },

  // ==================== CARD GENERALE ====================
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },

  // ==================== INFO SECTION (MIGLIORATA) ====================
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 3,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "600",
    lineHeight: 21,
  },
  infoSubValue: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
    lineHeight: 18,
  },

  // ==================== FIELD INFO CARD (VERSIONE COMPATTA) ====================
  fieldInfoCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  fieldInfoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  fieldInfoList: {
    gap: 0,
  },
  fieldInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  fieldInfoDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginVertical: 4,
  },
  fieldIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fieldInfoContent: {
    flex: 1,
    gap: 3,
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fieldInfoLabel: {
    fontSize: 9,
    color: "#999",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  fieldInfoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  fieldInfoSubValue: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sportCampoGrid: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
  },
  sportCampoColumn: {
    flex: 1,
  },
  sportCampoBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 10,
  },
  sportCampoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  campoTag: {
    backgroundColor: "#FFF3E0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  campoTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF9800",
    letterSpacing: 0.2,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F3E5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1BEE7",
  },
  mapButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9C27B0",
    letterSpacing: 0.2,
  },

  // ==================== DETAILS GRID (OTTIMIZZATO) ====================
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "700",
    lineHeight: 20,
  },
  priceText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // ==================== MATCH SECTION ====================
  matchHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inviteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  joinButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  groupChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  groupChatButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ==================== MATCH STATUS ====================
  matchStatusCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  matchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  matchStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  matchStatusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  matchStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  matchStatusCompleted: {
    backgroundColor: "#4CAF50",
  },
  matchStatusOpen: {
    backgroundColor: "#2196F3",
  },
  matchStatusFull: {
    backgroundColor: "#FF9800",
  },
  matchStatusCancelled: {
    backgroundColor: "#F44336",
  },
  matchStatusInProgress: {
    backgroundColor: "#FF5722",
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  matchStatsCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  matchStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  matchStatText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  // ==================== SCORE ACTIONS ====================
  scoreActionsContainer: {
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  submitScoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF9800",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#FF9800",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  viewScoreButton: {
    backgroundColor: "#2196F3",
  },
  submitScoreButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ==================== PENDING INVITE (MIGLIORATA) ====================
  pendingInviteCard: {
    backgroundColor: "#FFF8E1", // Più vivace
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD54F", // Bordo dorato
    ...Platform.select({
      ios: {
        shadowColor: "#FFB300",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pendingInviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  pendingInviteTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F57F17",
    letterSpacing: -0.2,
  },
  pendingInviteText: {
    fontSize: 14,
    color: "#5D4037",
    marginBottom: 14,
    lineHeight: 20,
  },
  pendingInviteActions: {
    flexDirection: "row",
    gap: 10,
  },
  pendingAcceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pendingAcceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pendingDeclineButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  pendingDeclineButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
  },

  // ==================== TEAM SELECTION INFO ====================
  teamSelectionInfo: {
    marginBottom: 14,
  },
  teamSelectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  teamSelectionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  teamSelectionButton: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "white",
  },
  teamASelection: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  teamBSelection: {
    borderColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  teamSelectionText: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: -0.2,
  },
  teamSelectionCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },

  // ==================== DECLINED CARD ====================
  declinedCard: {
    backgroundColor: "#FFEBEE",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#EF5350",
  },
  declinedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  declinedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#D32F2F",
    letterSpacing: -0.2,
  },
  declinedText: {
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 14,
    lineHeight: 20,
  },
  changeResponseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  changeResponseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ==================== TEAMS ====================
  teamsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  teamSection: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 14,
    backgroundColor: "white",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  teamAHeader: {
    backgroundColor: "#2196F3",
  },
  teamBHeader: {
    backgroundColor: "#F44336",
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.2,
  },
  teamHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamCountContainer: {
    alignItems: "flex-end",
  },
  teamCount: {
    fontSize: 14,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.2,
  },
  teamPendingCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  teamSlotsContainer: {
    padding: 12,
    gap: 10,
  },

  // ==================== PLAYERS ====================
  playersSection: {
    marginBottom: 16,
  },
  playersSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  playersGrid: {
    gap: 10,
  },

  // ==================== UNASSIGNED & PENDING ====================
  unassignedSection: {
    backgroundColor: "#FFF8E1",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  unassignedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  unassignedSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 14,
    lineHeight: 18,
  },
  pendingSection: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  // ==================== BALANCE TEAMS ====================
  balanceTeamsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  balanceTeamsButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ==================== CANCEL BOOKING BUTTON ====================
  cancelBookingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F44336",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#F44336",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cancelBookingButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ==================== NO MATCH ====================
  noMatchCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noMatchText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 14,
    letterSpacing: -0.2,
  },
  noMatchSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },

  // ==================== PLAYER CARD (OTTIMIZZATA) ====================
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    position: "relative",
    zIndex: 1,
  },
  playerCardPending: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFD54F",
    borderWidth: 2,
  },
  currentUserCard: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  declinedUserCard: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
    opacity: 0.7,
  },
  // SLOT VUOTI MIGLIORATI
  emptySlotCard: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "solid", // Non più dashed!
    borderRadius: 12,
  },

  // Leave Button
  leaveButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#F44336",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#F44336",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Player Card Components
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarTeamA: {
    backgroundColor: "#2196F3",
  },
  avatarTeamB: {
    backgroundColor: "#F44336",
  },
  avatarNoTeam: {
    backgroundColor: "#9E9E9E",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  currentUserIndicator: {
    color: "#4CAF50",
    fontWeight: "800",
  },
  organizerIndicator: {
    color: "#FF9800",
    fontWeight: "800",
  },
  playerUsername: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },

  playerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  // Team Badge (CON GRADIENT) - Mantenuto per compatibilità
  teamBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  teamBadgeA: {
    backgroundColor: "#2196F3",
  },
  teamBadgeB: {
    backgroundColor: "#F44336",
  },
  teamBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  // Player Status Icon - Versione compatta
  playerStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  playerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playerStatusConfirmed: {
    backgroundColor: "#E8F5E9",
  },
  playerStatusPending: {
    backgroundColor: "#FFF3E0",
  },
  playerStatusDeclined: {
    backgroundColor: "#FFEBEE",
  },
  playerStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },

  // Drag Indicator (sostituisce il menu)
  dragIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },

  // Remove Button
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
  },

  // Leave Button Inline
  leaveButtonInline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
  },

  // Empty Slot (MIGLIORATO)
  emptySlotContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  emptySlotIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  emptySlotInfo: {
    flex: 1,
  },
  emptySlotText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },
  emptySlotSubtext: {
    fontSize: 11,
    color: "#999",
    marginTop: 1,
  },
  inviteSlotButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
  },

  // Empty Team
  emptyTeamCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emptyTeamIcon: {
    marginBottom: 10,
  },
  emptyTeamText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  emptyTeamHint: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
  },

  // ==================== MODAL ====================
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  centeredModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: "75%",
    marginHorizontal: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "#667eea",
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8f0fe",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
    paddingVertical: 0,
  },

  // Search Results
  searchResults: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#fafbfc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f2f5",
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#e8f0fe",
  },
  resultAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e8f0fe",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.1,
  },
  resultUsername: {
    fontSize: 14,
    color: "#667eea", // Questo sarà sovrascritto dinamicamente
    marginTop: 2,
    fontWeight: "500",
  },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 40,
    fontWeight: "500",
    paddingVertical: 20,
  },

  // ==================== TEAM SELECTION MODAL ====================
  teamSelectionModal: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  teamModalHeader: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#f8f9fa",
  },
  teamModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 14,
    letterSpacing: -0.4,
  },
  teamModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  teamModalContent: {
    padding: 20,
    gap: 12,
  },
  teamModalOption: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e8e8e8",
  },
  teamModalOptionA: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  teamModalOptionB: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  teamModalOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  teamModalOptionInfo: {
    gap: 3,
  },
  teamModalOptionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  teamModalOptionCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  teamFullText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "700",
    textAlign: "center",
    paddingBottom: 14,
    letterSpacing: 0.3,
  },

  teamModalCancel: {
    padding: 18,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  teamModalCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },

  // Leave Confirm Modal
  leaveConfirmModal: {
    backgroundColor: "white",
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 40,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  leaveConfirmHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  leaveConfirmTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 12,
    letterSpacing: -0.5,
  },
  leaveConfirmMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  leaveConfirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  leaveConfirmCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  leaveConfirmCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  leaveConfirmConfirmButton: {
    flex: 1,
    backgroundColor: "#F44336",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  leaveConfirmConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // ==================== SCORE DISPLAY ====================
  scoreContainer: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  scoreContent: {
    gap: 10,
  },
  scoreText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  setScore: {
    fontSize: 13,
    color: "#666",
    marginLeft: 10,
    fontWeight: "500",
  },

  // ==================== SCORE MODAL ====================
  scoreModalContent: {
    maxHeight: "75%",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scoreModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  scoreModalHeaderText: {
    flex: 1,
  },
  scoreModalSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 16,
  },

  // Teams Players Section
  teamsPlayersSection: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  teamPlayersColumn: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  teamPlayersBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  teamPlayersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  teamPlayerName: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },

  // Score Summary
  scoreSummaryCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  scoreSummaryTeam: {
    alignItems: "center",
    gap: 8,
  },
  scoreSummaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreSummaryTeamText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  scoreSummaryScore: {
    fontSize: 28,
    fontWeight: "900",
    color: "#666",
    letterSpacing: -1,
  },
  scoreSummaryWinner: {
    color: "#FFD700",
  },
  scoreSummaryDivider: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreTeamAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -4,
  },
  scoreAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    marginLeft: -4,
  },
  avatarTeamA: {
    backgroundColor: "#2196F3",
  },
  avatarTeamB: {
    backgroundColor: "#F44336",
  },
  scoreAvatarText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },

  // Winner Indicator
  winnerIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  winnerIndicatorText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F57C00",
    letterSpacing: 0.2,
  },

  // Sets
  setsScrollView: {
    maxHeight: 350,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  setCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  setHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 0.3,
  },
  removeSetButton: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: "#FFEBEE",
  },

  // Set Inputs
  setInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamScoreInput: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamScoreLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 0.5,
  },
  scoreInput: {
    width: 60,
    height: 56,
    fontSize: 26,
    fontWeight: "900",
    color: "#1a1a1a",
    textAlign: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  scoreInputWinner: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  scoreInputDivider: {
    marginHorizontal: 12,
  },
  scoreInputDividerText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#CCC",
  },

  // Set Winner
  setWinnerIndicator: {
    alignItems: "center",
    paddingTop: 8,
  },
  setWinnerText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  setTieText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Add Set Button
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
    marginBottom: 16,
    backgroundColor: "#E3F2FD",
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2196F3",
    letterSpacing: 0.2,
  },

  // Score Modal Actions
  scoreModalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  scoreModalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  scoreModalButtonCancel: {
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  scoreModalButtonSave: {
    backgroundColor: "#4CAF50",
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scoreModalButtonTextCancel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 0.2,
  },
  scoreModalButtonTextSave: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },

  // ==================== SCORE DISPLAY CARD ====================
  scoreDisplayCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scoreDisplayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scoreDisplayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreDisplayTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  scoreDisplaySubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  scoreEditButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
  },

  scoreMainDisplay: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    marginBottom: 20,
  },
  scoreTeamDisplay: {
    alignItems: "center",
    gap: 12,
  },
  scoreTeamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scoreTeamAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -6,
  },
  scoreAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    marginLeft: -6,
  },
  scoreAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  scoreTeamBadgeWinner: {
    backgroundColor: "#FFF8E1",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  scoreTeamName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.4,
  },
  scoreTeamScore: {
    fontSize: 48,
    fontWeight: "900",
    color: "#666",
    letterSpacing: -1.5,
  },
  scoreTeamScoreWinner: {
    color: "#FFD700",
  },
  scoreWinnerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFD700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scoreDivider: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Sets Detail
  setsDetailContainer: {
    backgroundColor: "#FFF",
  },
  setsDetailTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  setsDetailList: {
    gap: 8,
  },
  setDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  setDetailNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    width: 50,
    letterSpacing: 0.2,
  },
  setDetailScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  setDetailTeamScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#999",
    letterSpacing: -0.4,
  },
  setDetailTeamScoreWinner: {
    color: "#4CAF50",
  },
  setDetailDivider: {
    fontSize: 18,
    color: "#CCC",
    fontWeight: "700",
  },
  setDetailWinner: {
    width: 40,
    alignItems: "flex-end",
  },
  setDetailWinnerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  setDetailWinnerBadgeA: {
    backgroundColor: "#E3F2FD",
  },
  setDetailWinnerBadgeB: {
    backgroundColor: "#FFEBEE",
  },
  setDetailWinnerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFF",
  },
  setDetailTieText: {
    fontSize: 13,
    color: "#CCC",
    fontWeight: "700",
  },

  // ==================== JOIN MATCH CTA ====================
  joinMatchCTA: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  joinMatchCTAContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  joinMatchCTAIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  joinMatchCTATextContainer: {
    flex: 1,
  },
  joinMatchCTATitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  joinMatchCTASubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  // ==================== CUSTOM ALERT MODAL ====================
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertModal: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 32,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  customAlertHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  customAlertContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  customAlertMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  customAlertButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  customAlertButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  customAlertButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  customAlertButtonDestructive: {
    // Stesso stile base
  },
  customAlertButtonTextDestructive: {
    color: "#F44336",
  },
  customAlertButtonCancel: {
    // Stesso stile base
  },
  customAlertButtonTextCancel: {
    color: "#666",
    fontWeight: "500",
  },
  teamModalOptionCost: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
});

export default styles;