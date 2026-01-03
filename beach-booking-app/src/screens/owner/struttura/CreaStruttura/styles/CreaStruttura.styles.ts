import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },

  /* =======================
     HEADER
  ======================= */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  title: { fontSize: 20, fontWeight: "800" },
  stepIndicator: { fontSize: 13, color: "#007AFF", fontWeight: "600" },

  /* =======================
     LAYOUT
  ======================= */
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },

  /* =======================
     INPUTS
  ======================= */
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#333" },
  miniLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4, color: "#666" },
  inputWrapper: { position: "relative" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  inputDisabled: { backgroundColor: "#f5f5f5", color: "#666" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  loadingContainer: { position: "absolute", right: 12, top: 12 },

  /* =======================
     AUTOCOMPLETE
  ======================= */
  suggestionsContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: { fontSize: 13, color: "#333" },

  /* =======================
     INFO BOX
  ======================= */
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1565C0",
    marginBottom: 4,
  },
  infoSubtext: { fontSize: 12, color: "#1976D2" },

  /* =======================
     IMMAGINI
  ======================= */
  addImagesButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  addImagesButtonDisabled: { backgroundColor: "#E0E0E0" },
  addImagesText: { color: "white", fontSize: 16, fontWeight: "700" },
  addImagesTextDisabled: { color: "#999" },

  emptyImagesState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  emptyImagesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyImagesSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },

  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageCard: {
    width: "48%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e9ecef",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%" },

  mainBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFB800",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mainBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },

  imageActions: { 
    position: "absolute", 
    top: 8, 
    right: 8, 
    gap: 6,
  },
  imageActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageActionButtonDanger: {
    backgroundColor: "rgba(244,67,54,0.9)",
  },

  imageHint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },

  /* =======================
     ORARI
  ======================= */
  dayRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: { fontSize: 14, fontWeight: "600" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    fontSize: 14,
  },
  timeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
  },

  /* =======================
     SERVIZI/AMENITIES
  ======================= */
  amenityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amenityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  amenityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityIconActive: {
    backgroundColor: "#E3F2FD",
  },
  amenityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  customBadge: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E65100",
  },
  amenityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },
  addCustomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },

  /* =======================
     CAMPI - STEP 5
  ======================= */
  campoCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  sportRow: {
    flexDirection: "row",
    gap: 10,
  },

  sportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },

  sportButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  sportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  sportButtonTextActive: {
    color: "#2196F3",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  playersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  playerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    minWidth: 50,
    alignItems: "center",
  },

  playerButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  playerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  playerButtonTextActive: {
    color: "#2196F3",
  },

  pricingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  pricingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },

  removeCampoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },

  removeCampoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },

  addCampoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },

  addCampoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  /* =======================
     FOOTER BUTTONS
  ======================= */
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: { backgroundColor: "#007AFF" },
  buttonSecondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPrimaryText: { color: "white", fontSize: 16, fontWeight: "700" },
  buttonSecondaryText: { color: "#333", fontSize: 16, fontWeight: "600" },

  /* =======================
     MODAL BASE
  ======================= */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalContentBottom: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleBottom: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  modalAddButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: { color: "white", fontSize: 16, fontWeight: "700" },

  /* =======================
     MODAL PRICING
  ======================= */
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalHeaderSave: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  radioOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  radioDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: 90,
  },
  euroSign: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
    color: "#666",
  },
  priceInputField: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeSlotCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeSlotLabelInput: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  timeSlotTimeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  timeInputWrapper: { flex: 1 },
  timeLabel: { fontSize: 11, color: "#666", marginBottom: 4, fontWeight: "600" },
  timeInputModal: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    fontWeight: "600",
  },
  daysSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  daysSelectorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  slotPriceRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotPriceLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
    marginTop: 6,
  },
  addButtonText: { fontSize: 13, fontWeight: "600", color: "#2196F3" },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  dayChipSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  dayChipTextSelected: {
    color: "#2196F3",
  },
  dateInputPressable: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  periodDatesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  calendarMonthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  calendarMonthBtn: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  calendarGrid: {
    marginBottom: 20,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
  },
  calendarDays: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  calendarDayInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});