import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  galleryContainer: {
    position: "relative",
  },
  gallery: {
    height: 300,
  },
  galleryImage: {
    width: width,
    height: 300,
    backgroundColor: "#e9ecef",
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
  },
  
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  infoSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  address: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginTop: 8,
  },

  chatSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  chatButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: "45%",
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },

  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    fontWeight: "500",
  },

  campoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  campoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sportIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  campoMainInfo: {
    flex: 1,
    gap: 6,
  },
  campoName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  campoMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sportBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2196F3",
  },
  surfaceBadge: {
    backgroundColor: "#FFF3E0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  surfaceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F57C00",
  },
  indoorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F5F5F5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  indoorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  campoDetailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  priceText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "700",
  },

  calendarContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  monthBtn: {
    padding: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  loadingBox: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  calendar: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCol: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },

  dayCellInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 10,
    backgroundColor: "white",
  },

  dayCellSelected: {
    backgroundColor: "#2196F3",
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  dayCellPast: {
    opacity: 0.3,
  },

  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dayNumberSelected: {
    color: "white",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: "#2196F3",
    fontWeight: "700",
  },
  dayNumberPast: {
    color: "#999",
  },

  dayIndicator: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorAvailable: { backgroundColor: "#4CAF50" },
  indicatorPartial: { backgroundColor: "#FF9800" },
  indicatorFull: { backgroundColor: "#F44336" },
  indicatorClosed: { backgroundColor: "#999" },

  dayDetail: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dayDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dayDetailHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
    color: "#1a1a1a",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  selectSlotHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },

  closedBox: {
    padding: 24,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  closedText: {
    color: "#F44336",
    fontWeight: "700",
    fontSize: 15,
  },

  // === DURATION SELECTION ===
  durationSelection: {
    padding: 12,
  },
  durationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  durationSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  durationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  durationCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  durationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  durationBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2196F3",
  },
  durationCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  durationCardSubtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  durationCardPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  durationCardPriceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4CAF50",
  },
  durationCardPriceLabel: {
    fontSize: 12,
    color: "#999",
    marginLeft: 3,
  },
  durationCardFooter: {
    alignItems: "flex-end",
  },

  // === SELECTED DURATION BANNER ===
  selectedDurationBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  selectedDurationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  selectedDurationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1565C0",
    flex: 1,
  },
  changeDurationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  changeDurationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },

  // === NO SLOTS AVAILABLE ===
  noSlotsBox: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    marginTop: 12,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F57C00",
    marginTop: 12,
    marginBottom: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: "#E65100",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  changeDurationBtn2: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  changeDurationText2: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  // === SLOTS HORIZONTAL SCROLL ===
  slotsScroll: {
    marginVertical: 8,
  },
  slotsScrollContent: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  slotChip: {
    flexDirection: "column",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  slotMainContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  slotAvailable: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  slotUnavailable: {
    backgroundColor: "#F5F5F5",
    borderColor: "#e9ecef",
  },
  slotPast: {
    opacity: 0.4,
  },
  slotSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
    shadowColor: "#2196F3",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  slotTimeContainer: {
    alignItems: "center",
    gap: 1,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF50",
  },
  slotTimeDisabled: {
    color: "#999",
  },
  slotTimeSelected: {
    color: "white",
  },
  slotEndTime: {
    fontSize: 10,
    color: "#999",
    fontWeight: "600",
  },
  slotEndTimeSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4CAF50",
    textAlign: "center",
    marginTop: 2,
  },
  slotPriceSelected: {
    color: "white",
  },

  prenotaBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  prenotaBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prenotaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  prenotaBtnTime: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  prenotaBtnPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
  },

  map: {
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  openMapsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2196F3",
  },
});