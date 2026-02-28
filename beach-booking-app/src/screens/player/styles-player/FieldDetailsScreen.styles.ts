import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  galleryContainer: {
    position: "relative",
  },
  gallery: {
    height: 250,
  },
  galleryImage: {
    width: width,
    height: 250,
    backgroundColor: "#e9ecef",
  },

  // Indicatori immagini
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    transition: "all 0.3s ease",
  },
  paginationDotActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
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

  communityButton: {
    position: "absolute",
    top: 76,
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
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  chatButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: 28,
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  chatSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2196F3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  chatButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
  },

  section: {
    padding: 16,
    marginTop: -16,
  },

  infoCardsContainer: {
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  
  // DROPDOWN HEADER
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // OPENING HOURS
  openingHoursContainer: {
    marginTop: 8,
    gap: 2,
  },
  openingHourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 6,
  },
  dayName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  slotsContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  hoursLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF50",
  },
  closedLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F44336",
  },

  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flex: 1,
    minWidth: "49%",
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
    color: "#1a1a1a",
    flex: 1,
  },

  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  priceText: {
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  loadingBox: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
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
    fontSize: 11,
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

  // Colored backgrounds for day states
  dayCellAvailable: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
  },
  dayCellPartial: {
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
  },
  dayCellFull: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
  },
  dayCellClosed: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
  },

  dayNumber: {
    fontSize: 12,
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
  dayNumberOnColored: {
    color: "#333",
    fontWeight: "700",
  },

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
    fontSize: 13,
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
    fontSize: 12,
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
    fontSize: 13,
  },

  // === DURATION SELECTION ===
  durationSelection: {
    padding: 12,
  },
  durationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  durationSubtitle: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  durationCardSubtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 8,
  },
  durationCardPrice: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  durationCardPriceAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4CAF50",
  },
  durationCardPriceSecondary: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "600",
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 15,
    fontWeight: "700",
    color: "#F57C00",
    marginTop: 12,
    marginBottom: 8,
  },
  noSlotsText: {
    fontSize: 12,
    color: "#E65100",
    textAlign: "center",
    lineHeight: 18,
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
    fontSize: 13,
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
    fontSize: 12,
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
    fontSize: 9,
    color: "#999",
    fontWeight: "600",
  },
  slotEndTimeSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  // 🆕 Container per prezzo e label
  slotPriceContainer: {
    alignItems: "center",
    gap: 2,
  },
  slotPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4CAF50",
    textAlign: "center",
  },
  slotPriceSelected: {
    color: "white",
  },
  // 🆕 Label fascia di prezzo
  slotPricingLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  slotPricingLabelSelected: {
    color: "rgba(255, 255, 255, 0.8)",
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
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  prenotaBtnTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  prenotaBtnPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  map: {
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E3F2FD",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.2)",
  },
  openMapsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },

  // Navigation chips
  chipsContainer: {
    paddingVertical: 12,
    marginTop: 8, // reduced to bring chips closer to profile card
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#90CAF9",
  },
  chipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1976D2",
  },
  chipTextActive: {
    color: "white",
  },

  // Sport filters
  sportFiltersContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  sportFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  sportFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sportFilterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  sportFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "inherit",
  },
  sportFilterTextActive: {
    color: "white",
  },

  // Empty states
  emptySubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
});