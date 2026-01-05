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

  // ==================== STATUS CARD ====================
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

  // ==================== MATCH STATUS ====================
  matchStatusCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  matchStatusRow: {
    gap: 12,
  },
  matchStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
  },
  matchStatusCompleted: {
    backgroundColor: "#E8F5E9",
  },
  matchStatusOpen: {
    backgroundColor: "#E3F2FD",
  },
  matchStatusFull: {
    backgroundColor: "#FFF8E1",
  },
  matchStatusDraft: {
    backgroundColor: "#F5F5F5",
  },
  matchStatusCancelled: {
    backgroundColor: "#FFEBEE",
  },
  matchStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  matchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  matchInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchInfoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFE082",
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
    overflow: "hidden",
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
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.1,
  },
  currentUserIndicator: {
    color: "#4CAF50",
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
    gap: 6,
  },

  // Team Badge (CON GRADIENT)
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

  // Player Status Badge
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

  // Team Control
  teamControlContainer: {
    position: "relative",
  },
  teamButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  teamButtonActiveA: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  teamButtonActiveB: {
    borderColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },

  teamMenuOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  teamMenu: {
    position: "absolute",
    top: 38,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 6,
    minWidth: 160,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  teamMenuTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teamMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
  },
  teamMenuItemA: {
    backgroundColor: "#E3F2FD",
  },
  teamMenuItemB: {
    backgroundColor: "#FFEBEE",
  },
  teamMenuItemRemove: {
    backgroundColor: "#FFEBEE",
  },
  teamMenuText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  // Search Results
  searchResults: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  resultAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.1,
  },
  resultUsername: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  noResults: {
    textAlign: "center",
    fontSize: 15,
    color: "#999",
    marginTop: 28,
    fontWeight: "500",
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
    maxHeight: "90%",
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  scoreModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  scoreModalHeaderText: {
    flex: 1,
  },
  scoreModalSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
    lineHeight: 18,
  },

  // Score Summary
  scoreSummaryCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 16,
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
    gap: 12,
  },
  scoreSummaryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scoreSummaryTeamText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.4,
  },
  scoreSummaryScore: {
    fontSize: 48,
    fontWeight: "900",
    color: "#666",
    letterSpacing: -1.5,
  },
  scoreSummaryWinner: {
    color: "#FFD700",
  },
  scoreSummaryDivider: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Winner Indicator
  winnerIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  winnerIndicatorText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F57C00",
    letterSpacing: 0.2,
  },

  // Sets
  setsScrollView: {
    maxHeight: 300,
  },
  setsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  setCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
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
    width: 68,
    height: 64,
    fontSize: 30,
    fontWeight: "900",
    color: "#1a1a1a",
    textAlign: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
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
    padding: 16,
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
});

export default styles;