import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 16,
  },

  // Status Card (Prenotazione)
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusConfirmed: { 
    backgroundColor: "#E8F5E9" 
  },
  statusCancelled: { 
    backgroundColor: "#FFEBEE" 
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
  },
  statusInfo: {
    gap: 12,
  },
  statusInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusInfoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // General Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  matchHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },

  // Info Section
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
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
  infoSubValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  // Details Grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "700",
  },
  priceText: {
    color: "#4CAF50",
    fontSize: 18,
  },

  // Match Section
  matchStatusCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  matchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  matchStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  matchStatusCompleted: { backgroundColor: "#E8F5E9" },
  matchStatusOpen: { backgroundColor: "#E3F2FD" },
  matchStatusFull: { backgroundColor: "#FFF3E0" },
  matchStatusDraft: { backgroundColor: "#FFF3E0" },
  matchStatusCancelled: { backgroundColor: "#FFEBEE" },
  matchStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  matchStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  creatorText: {
    fontSize: 13,
    color: "#666",
  },

  // Invite Button
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },

  // Pending Invite
  pendingInviteCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  pendingInviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pendingInviteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2196F3",
  },
  pendingInviteText: {
    fontSize: 13,
    color: "#1976D2",
    marginBottom: 12,
    lineHeight: 18,
  },
  pendingInviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  pendingDeclineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  pendingDeclineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  pendingAcceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  pendingAcceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  // Team Sections
  teamSection: {
    marginBottom: 20,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  teamAHeader: {
    backgroundColor: "#E3F2FD",
  },
  teamBHeader: {
    backgroundColor: "#FFEBEE",
  },
  teamTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  teamCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  teamHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamCountFull: {
    color: '#4CAF50',
    fontWeight: '900',
  },
  emptyTeamText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  emptyTeamCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyTeamIcon: {
    marginBottom: 8,
  },
  emptyTeamHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  playersGrid: {
    gap: 8,
  },

  // Team Management
  teamManagementActions: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  managementButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    flex: 1,
    justifyContent: 'center',
  },
  managementButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },

  // Unassigned Section
  unassignedSection: {
    marginBottom: 20,
  },
  unassignedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },

  // Pending Section
  pendingSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },

  // Player Card
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  playerCardPending: {
    backgroundColor: "#FFF3E0",
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  playerUsername: {
    fontSize: 13,
    color: "#666",
  },
  currentUserIndicator: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  playerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  playerStatusConfirmed: {
    backgroundColor: "#E8F5E9",
  },
  playerStatusPending: {
    backgroundColor: "#FFF3E0",
  },
  playerStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  removeButton: {
    marginLeft: 4,
  },

  // Team Control
  teamControlContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  teamButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamButtonActiveA: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  teamButtonActiveB: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  teamBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  teamBadgeA: {
    backgroundColor: '#E3F2FD',
  },
  teamBadgeB: {
    backgroundColor: '#FFEBEE',
  },
  teamBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333',
  },
  teamMenuOverlay: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 999,
  },
  teamMenu: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
    overflow: 'hidden',
    zIndex: 1000,
  },
  teamMenuTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  teamMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamMenuItemA: {
    backgroundColor: '#E3F2FD',
  },
  teamMenuItemB: {
    backgroundColor: '#FFEBEE',
  },
  teamMenuItemRemove: {
    backgroundColor: '#FFEBEE',
  },
  teamMenuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Result Card
  resultCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  winnerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF8E1",
    marginBottom: 16,
  },
  winnerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F57C00",
  },
  setsContainer: {
    gap: 10,
  },
  setCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
  },
  setLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  setScore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreTeam: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
  },
  scoreTeamA: {
    backgroundColor: "#E3F2FD",
  },
  scoreTeamB: {
    backgroundColor: "#FFEBEE",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: "800",
    color: "#666",
    marginHorizontal: 16,
  },

  // Match Actions
  matchActions: {
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FF9800",
  },
  resultButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  // No Match Card
  noMatchCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  noMatchText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
    marginBottom: 8,
  },
  noMatchSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  searchResults: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  noResults: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  resultUsername: {
    fontSize: 13,
    color: "#666",
  },
  // Aggiungi questi stili al tuo file DettaglioPrenotazione.styles.ts

// Team Section con slot
teamSlotsContainer: {
  gap: 8,
  marginBottom: 12,
},

// Empty Slot Card
emptySlotCard: {
  backgroundColor: "#f8f9fa",
  borderStyle: "dashed",
  borderWidth: 2,
  borderColor: "#e0e0e0",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 70,
},

emptySlotContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  paddingHorizontal: 12,
},

emptySlotIconContainer: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#f0f0f0",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

emptySlotInfo: {
  flex: 1,
},

emptySlotText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#666",
  marginBottom: 2,
},

emptySlotSubtext: {
  fontSize: 12,
  color: "#999",
},

inviteSlotButton: {
  padding: 4,
},
});

export default styles;