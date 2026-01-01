import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    gap: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
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

  ownerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },

  // MESSAGES
  messagesList: {
    padding: 16,
    gap: 8,
  },

  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },

  messageContainerMine: {
    justifyContent: "flex-end",
  },

  messageContainerTheirs: {
    justifyContent: "flex-start",
  },

  messageContainerConsecutive: {
    marginBottom: 2,
  },

  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarSpacer: {
    width: 40,
  },

  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },

  messageBubbleMine: {
    backgroundColor: "#2196F3",
    borderBottomRightRadius: 4,
  },

  messageBubbleTheirs: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  bubbleConsecutiveMine: {
    borderTopRightRadius: 4,
  },

  bubbleConsecutiveTheirs: {
    borderTopLeftRadius: 4,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },

  messageTextMine: {
    color: "white",
  },

  messageTextTheirs: {
    color: "#1a1a1a",
  },

  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },

  messageTimeMine: {
    color: "rgba(255,255,255,0.8)",
    alignSelf: "flex-end",
  },

  messageTimeTheirs: {
    color: "#999",
    alignSelf: "flex-end",
  },

  // INPUT
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 8,
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },

  input: {
    fontSize: 15,
    color: "#1a1a1a",
    maxHeight: 84,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonActive: {
    backgroundColor: "#2196F3",
  },

  // EMPTY STATE
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // ✅ MODAL PROFILO
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

  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // ✅ MODAL PROFILO UTENTE
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
});