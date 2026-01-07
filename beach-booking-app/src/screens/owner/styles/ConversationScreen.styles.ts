import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  totalUnreadBadge: {
    backgroundColor: "#FF5252",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  totalUnreadText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  filterContainer: {
    flexDirection: "row",
    gap: 10,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 0,
  },

  filterButtonActive: {
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  filterButtonTextActive: {
    color: "white",
    fontWeight: "800",
  },

  filterBadge: {
    backgroundColor: "#FF5252",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  filterBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  listContent: {
    padding: 16,
  },

  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },

  conversationCardUnread: {
    borderLeftColor: "#2196F3",
    backgroundColor: "#FAFFFE",
    shadowColor: "#2196F3",
    shadowOpacity: 0.12,
  },

  conversationLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF5252",
    borderWidth: 3,
    borderColor: "white",
  },

  conversationInfo: {
    flex: 1,
    gap: 4,
  },

  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },

  conversationTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },

  conversationTitleUnread: {
    fontWeight: "800",
    color: "#000",
  },

  conversationTime: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginLeft: 8,
  },

  strutturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },

  strutturaName: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },

  conversationLastMessage: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },

  conversationLastMessageUnread: {
    fontWeight: "600",
    color: "#333",
  },

  unreadBadge: {
    backgroundColor: "#FF5252",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginLeft: 8,
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },

  unreadBadgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
});