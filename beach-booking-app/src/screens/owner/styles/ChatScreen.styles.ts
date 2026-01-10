import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  /* =========================
     HEADER
  ========================= */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  headerInfo: {
    flex: 1,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
    flex: 1,
  },

  headerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },

  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },

  onlineText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },

  /* =========================
     MESSAGES
  ========================= */
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageContainer: {
    flexDirection: "row",
    marginBottom: 10,
    maxWidth: "82%",
  },

  messageContainerMine: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },

  messageContainerTheirs: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },

  messageContainerConsecutive: {
    marginTop: -8,
  },

  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatarContainerMine: {
    marginLeft: 8,
    alignSelf: "flex-end",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarSpacer: {
    width: 40,
  },

  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "100%",
  },

  messageBubbleMine: {
    backgroundColor: "#E3F2FD",
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: "#BBDDFB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  messageBubbleTheirs: {
    backgroundColor: "white",
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  bubbleConsecutiveMine: {
    borderTopRightRadius: 18,
  },

  bubbleConsecutiveTheirs: {
    borderTopLeftRadius: 18,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  messageTextMine: {
    color: "#1a1a1a",
  },

  messageTextTheirs: {
    color: "#1a1a1a",
  },

  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },

  messageTimeMine: {
    color: "#666",
  },

  messageTimeTheirs: {
    color: "#999",
  },

  /* =========================
     INPUT
  ========================= */
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "#F1F3F5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
    color: "#1a1a1a",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  sendButtonActive: {
    backgroundColor: "#1976D2",
    shadowOpacity: 0.3,
    elevation: 5,
  },

  /* =========================
     EMPTY STATE
  ========================= */
  emptyState: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  /* =========================
     LOADING
  ========================= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  loadingText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  /* =========================
     MODAL PROFILO UTENTE
  ========================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  modalLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },

  modalLoadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  modalError: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },

  modalErrorText: {
    fontSize: 14,
    color: "#666",
  },

  modalErrorSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  profileContent: {
    paddingHorizontal: 24,
  },

  profileAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  profileInfo: {
    gap: 16,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },

  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  profileRowContent: {
    flex: 1,
    gap: 2,
  },

  profileLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  profileValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "600",
  },

  ownerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
});
