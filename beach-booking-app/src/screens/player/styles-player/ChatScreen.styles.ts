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

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
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
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    maxWidth: "85%",
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
    backgroundColor: "#2196F3",
    borderBottomRightRadius: 4,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  messageBubbleTheirs: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
    color: "white",
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
    color: "rgba(255,255,255,0.75)",
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
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  input: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
    color: "#1a1a1a",
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#B0BEC5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 0,
  },

  sendButtonActive: {
    backgroundColor: "#2196F3",
    shadowOpacity: 0.3,
    elevation: 3,
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
});