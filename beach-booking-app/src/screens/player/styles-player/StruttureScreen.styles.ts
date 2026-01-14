import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  header: {
    backgroundColor: "#2979ff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    height: 42,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  viewToggle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },

  favoritesSection: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  favoritesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  favoritesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  favoritesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  favoritesCount: {
    backgroundColor: "#FFB800",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  favoritesCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "white",
  },

  favoritesScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  favoriteCard: {
    width: 140,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFB800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  favoriteImageContainer: {
    position: "relative",
  },

  favoriteImage: {
    width: "100%",
    height: 80,
    backgroundColor: "#F5F5F5",
  },

  favoriteImageIndicators: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },

  favoriteIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  favoriteIndicatorActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
    width: 14,
  },

  favoriteContent: {
    padding: 8,
  },

  favoriteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },

  favoriteCity: {
    fontSize: 11,
    color: "#666",
  },

  resultsBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultsText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  locationBadgeText: {
    fontSize: 11,
    color: "#2979ff",
    fontWeight: "700",
  },

  locationBadgeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  locationBadgeTextAll: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "700",
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
  },

  image: {
    height: 120,
    width: "100%",
    backgroundColor: "#F5F5F5",
  },

  imageIndicators: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  indicatorActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
    width: 20,
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  badgeIndoor: {
    backgroundColor: "rgba(41,121,255,0.95)",
  },

  badgeOutdoor: {
    backgroundColor: "rgba(76,175,80,0.95)",
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  favoriteButton: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    padding: 10,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  address: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },

  distance: {
    color: "#2979ff",
    fontSize: 11,
    fontWeight: "700",
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },

  sportTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  sportTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
  },

  moreText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },

  priceLabel: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
    textAlign: "right",
  },

  price: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "right",
  },

  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#2979ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "stretch",
    marginTop: 2,
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  bookButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  mapContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  map: {
    flex: 1,
  },

  // ✅ NUOVI STILI PER CONTROLLI MAPPA
  mapControlsContainer: {
    position: "absolute",
    bottom: 100,
    right: 16,
    gap: 12,
    alignItems: "flex-end",
  },

  mapControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  mapControlButtonPrimary: {
    flexDirection: "row",
    bottom: 650,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "#2979ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  mapControlButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  mapCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 200,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  mapCardClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  mapCardHeader: {
    marginBottom: 10,
    paddingRight: 30,
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },

  mapAddress: {
    fontSize: 11,
    color: "#666",
    marginBottom: 6,
  },

  mapPriceBox: {
    alignItems: "flex-start",
    marginBottom: 10,
  },

  mapPriceLabel: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
  },

  mapPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2979ff",
  },

  mapRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  mapRatingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  mapBookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2979ff",
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  mapBookButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  // Map Modal Popup Styles
  mapModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  mapModalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  mapModalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  mapModalImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F5F5F5",
  },

  mapModalContent: {
    padding: 16,
  },

  mapModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  mapModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
  },

  mapModalLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  mapModalAddress: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  mapModalPriceBox: {
    alignItems: "flex-end",
  },

  mapModalPriceLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },

  mapModalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2979ff",
  },

  mapModalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2979ff",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  mapModalButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    display: "flex",
    flexDirection: "column",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  modalScrollView: {
    flex: 1,
  },

  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  cityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  cityInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  geolocationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  searchBoxModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  inputModal: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  cityHint: {
    fontSize: 12,
    color: "#2979ff",
    marginTop: 8,
    fontWeight: "600",
  },

  cityHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  clearCityButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
  },

  clearCityText: {
    fontSize: 12,
    color: "#FF5252",
    fontWeight: "700",
  },

  allStructuresHint: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 8,
    fontWeight: "600",
    fontStyle: "italic",
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  optionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },

  optionTextActive: {
    color: "#2196F3",
    fontWeight: "700",
  },

  dateRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  dateOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2979ff",
  },

  dateOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  dateOptionTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  timeSlots: {
    gap: 10,
  },

  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  timeSlotActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },

  timeSlotTextActive: {
    color: "white",
    fontWeight: "700",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  resetModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  resetModalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#495057",
  },

  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  fab: {
    position: "absolute",
    right: 15,
    bottom: 80,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2979ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fabList: {
    bottom: 74,
  },

  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "white",
  },

  fabBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },

  // Calendar Modal Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  calendarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  datePickerButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  datePickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },

  datePickerTextActive: {
    color: "#2196F3",
    fontWeight: "700",
  },

  clearDateButton: {
    padding: 4,
  },
});