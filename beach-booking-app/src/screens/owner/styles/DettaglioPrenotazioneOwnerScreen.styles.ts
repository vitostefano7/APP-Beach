import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  container: {
    flex: 1,
  },

  imageContainer: {
    height: 280,
    position: "relative",
  },
  
  // ✅ NUOVO: ScrollView per carousel
  headerImageScroll: {
    width: "100%",
    height: "100%",
  },
  
  headerImage: {
    width: width,
    height: 280,
  },
  
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  
  // ✅ NUOVO: Indicatori carousel
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: "white",
    width: 24,
  },
  
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 10,
  },
  statusConfirmed: {
    backgroundColor: "#4CAF50",
  },
  statusCancelled: {
    backgroundColor: "#F44336",
  },
  statusPast: {
    backgroundColor: "#757575",
  },
  statusBadgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    marginTop: -32,
    paddingHorizontal: 16,
  },

  mainCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },

  strutturaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sportIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  strutturaInfo: {
    flex: 1,
  },
  strutturaName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  campoName: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 13,
    color: "#666",
  },

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
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 13,
    color: "#666",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  dateTimeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  dateBox: {
    width: 64,
    height: 64,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  dateDetails: {
    flex: 1,
    justifyContent: "center",
  },
  dateFullText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  matchResult: {
    gap: 16,
  },
  resultBadge: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  winBadge: {
    backgroundColor: "#E8F5E9",
  },
  loseBadge: {
    backgroundColor: "#FFEBEE",
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#333",
  },

  setsContainer: {
    gap: 10,
  },
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  setScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setScoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#999",
    minWidth: 28,
    textAlign: "center",
  },
  setScoreWin: {
    color: "#4CAF50",
    fontSize: 20,
  },
  setScoreSeparator: {
    fontSize: 16,
    color: "#ccc",
  },

  insertResultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },
  insertResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  insertResultContent: {
    flex: 1,
  },
  insertResultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2196F3",
    marginBottom: 2,
  },
  insertResultSubtitle: {
    fontSize: 13,
    color: "#1976D2",
  },

  noResultBox: {
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  noResultText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },

  incassoBox: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  incassoLabel: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginBottom: 8,
  },
  incassoAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4CAF50",
  },

  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F44336",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});