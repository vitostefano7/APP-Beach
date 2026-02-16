import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // Nuovo Header Design
  newHeader: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },

  newSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  newSearchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },

  newSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#FF5252",
    borderWidth: 1,
    borderColor: "white",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
    gap: 8,
  },

  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  locationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  showMapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    marginLeft: "auto",
  },

  showMapText: {
    fontSize: 13,
    color: "#2979ff",
    fontWeight: "600",
  },

  sportChipsContainer: {
    marginBottom: 6,
  },

  sportChipsContent: {
    gap: 10,
    paddingVertical: 2,
  },

  sportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },

  sportChipActive: {
    backgroundColor: "#2979ff",
    borderColor: "#2979ff",
  },

  sportChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  sportChipTextActive: {
    color: "white",
  },

  newResultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  newResultsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 0.5,
  },

  // Inline Results Row (senza barra separata)
  inlineResultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FAFAFA",
  },

  inlineResultsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  resultsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.8,
  },

  inlineSortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
  },

  inlineSortText: {
    fontSize: 13,
    color: "#2979ff",
    fontWeight: "600",
  },

  recommendedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  recommendedText: {
    fontSize: 14,
    color: "#2979ff",
    fontWeight: "600",
  },

  // Sort Menu Styles
  sortMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
    justifyContent: "flex-end",
  },

  sortMenuContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  anchoredSortMenu: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  sortMenuCaret: {
    position: "absolute",
    top: -6,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "white",
  },

  sortMenuTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    textAlign: "center",
  },

  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },

  sortMenuItemActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2979ff",
  },

  sortMenuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  sortMenuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  sortMenuItemTextActive: {
    color: "#2979ff",
  },

  sortMenuItemSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  sortMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sortMenuHeaderClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },

  sortMenuHeaderCloseText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "700",
  },

  // Vecchi stili (mantenuti per retrocompatibilità)
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
    marginHorizontal: -16,
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
    marginHorizontal: -16,
    marginBottom: 8,
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
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 24,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 80,
  },

  badgeIndoor: {
    backgroundColor: "rgba(41,121,255,0.95)",
  },

  badgeOutdoor: {
    backgroundColor: "rgba(76,175,80,0.95)",
  },

  badgeSplitPayment: {
    backgroundColor: "rgba(255,152,0,0.95)",
  },

  badgeOpenGames: {
    backgroundColor: "rgba(76,175,80,0.95)",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
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

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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

  // Italian alias
  distanza: {
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
    fontSize: 18,
    fontWeight: "900",
    color: "#2979ff",
    textAlign: "right",
  },

  // New: compact container for price + unit
  pricePill: {
    alignItems: 'flex-end',
  },

  priceUnit: {
    fontSize: 11,
    color: "#666",
    marginLeft: 6,
    marginBottom: 2,
    fontWeight: '700',
  },

  // Backwards-compatible Italian aliases
  prezzoLabel: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
    textAlign: "right",
  },

  prezzo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2979ff",
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
    top: 30,
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
    backgroundColor: "transparent",
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

  mapModalPriceUnit: {
    fontSize: 14,
    color: "#2979ff",
    marginLeft: 8,
    marginBottom: 4,
    fontWeight: '700',
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
    backgroundColor: "transparent",
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    display: "flex",
    flexDirection: "column",
    /* Soft shadow to replace hard border */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    /* removed hard border to use soft shadow instead */
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
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
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
    padding: 16,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
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
    gap: 8,
  },

  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  optionActive: {
    backgroundColor: "#2979ff",
    borderColor: "#2979ff",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  optionTextActive: {
    color: "white",
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
    gap: 8,
  },

  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  timeSlotActive: {
    backgroundColor: "#2979ff",
    borderColor: "#2979ff",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  timeSlotTextActive: {
    color: "white",
    fontWeight: "700",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "white",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  resetModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  resetModalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#495057",
  },

  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#2979ff",
    alignItems: "center",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  fab: {
    position: "absolute",
    right: 15,
    bottom: 20,
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
    bottom: 14,
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

  geolocationFab: {
    position: "absolute",
    right: 15,
    bottom: 75,
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
    gap: 8,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
  },

  datePickerButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  datePickerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
  },

  datePickerTextActive: {
    color: "#2196F3",
    fontWeight: "700",
  },

  // Modal Filtri Avanzati
  modalBody: {
    flex: 1,
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  dateText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  // FAB Filtri
  fabFilters: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2979ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fabBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5252",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  fabBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  // Marker e Cluster
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  clusterMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2979ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "white",
  },

  clusterText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  // Pulsanti Mappa
  mapBackButton: {
    position: "absolute",
    top: 74,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  mapBackText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  mapFilterButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  mapFilterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF5252",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  mapFilterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  mapLocationButton: {
    position: "absolute",
    bottom: 90,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  clearDateButton: {
    padding: 4,
  },

  // City Selection Modal Styles (Nuovo Design)
  citySelectionFixedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1000,
  },

  citySelectionContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 0,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
    overflow: "hidden",
  },

  citySelectionHeader: {
    backgroundColor: "#2979ff",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  citySelectionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  citySelectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  citySelectionSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  gpsButton: {
    backgroundColor: "white",
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E3F2FD",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  gpsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  gpsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  gpsButtonTextContainer: {
    flex: 1,
  },

  gpsButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },

  gpsButtonSubtext: {
    fontSize: 13,
    color: "#666",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  manualInputWrapper: {
    marginHorizontal: 24,
  },

  manualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    height: 56,
  },

  manualInputValid: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8F4",
  },

  manualInputIconContainer: {
    marginRight: 12,
  },

  manualCityInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },

  cityValidationFeedback: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  citySuggestionsContainer: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250,
  },

  citySuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  citySuggestionText: {
    flex: 1,
  },

  citySuggestionCity: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  citySuggestionRegion: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  cityCoordinatesInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },

  cityCoordinatesText: {
    flex: 1,
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "500",
  },

  confirmCityButton: {
    backgroundColor: "#2979ff",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  confirmCityButtonDisabled: {
    backgroundColor: "#BDBDBD",
    shadowOpacity: 0,
    elevation: 0,
  },

  confirmCityButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },

  // Permission Modal Styles
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  permissionModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  permissionModalIcon: {
    marginBottom: 16,
  },

  permissionModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },

  permissionModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  permissionModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 0,
  },

  permissionModalCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  permissionModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },

  permissionModalSettingsButton: {
    flex: 1,
    backgroundColor: "#2979ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 50,
  },

  permissionModalSettingsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },

  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});