import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  
  headerTitle: { 
    fontSize: 17, 
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2196F3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 75,
    justifyContent: "center",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  
  container: { 
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  // STATUS CARD
  statusCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  statusCardInactive: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
    shadowColor: "#F44336",
  },

  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  statusIconContainerInactive: {
    backgroundColor: "white",
  },

  statusTextContainer: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  statusSubtitle: {
    fontSize: 12,
    color: "#666",
  },

  // CARD
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },

  // 📸 IMMAGINI
  emptyImagesBox: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },

  emptyImagesIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyImagesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },

  emptyImagesSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  addImagesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#9C27B0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  addImagesButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  imagesScroll: {
    paddingBottom: 16,
  },

  imagePreviewCard: {
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  mainImageBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFB800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  mainImageBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },

  manageImagesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3E5F5",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#9C27B0",
  },

  manageImagesIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  manageImagesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#9C27B0",
  },

  // INPUTS
  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1a1a1a",
  },
  
  textArea: { 
    minHeight: 90, 
    textAlignVertical: "top",
  },
  
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  
  infoBoxTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 2,
  },
  
  infoBoxText: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  // DAYS
  dayCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  
  dayLabel: { 
    fontSize: 14, 
    fontWeight: "600",
    color: "#1a1a1a",
  },

  dayStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dayStatus: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "700",
  },

  dayStatusClosed: {
    color: "#999",
  },
  
  timeContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 12,
    gap: 8,
  },

  timeBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  
  timeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  
  timeDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  timeDividerLine: {
    width: 12,
    height: 1,
    backgroundColor: "#e9ecef",
  },

  // SLOT CARDS
  slotCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },

  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  slotBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  slotBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  deleteSlotBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },

  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
    backgroundColor: "#F3F9FF",
  },

  addSlotBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
  },

  // AMENITIES
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    position: "relative",
  },

  amenityChipActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  amenityChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  amenityChipTextActive: {
    color: "#2196F3",
  },

  amenityCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  // CUSTOM AMENITIES
  customAmenityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  customAmenityContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    position: "relative",
  },

  customAmenityContentActive: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },

  customIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  customIconActive: {
    backgroundColor: "#FFE0B2",
  },

  customAmenityText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },

  customAmenityTextActive: {
    color: "#E65100",
  },

  customBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  customBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "white",
  },

  deleteCustomButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },

  addServiceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  addServiceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#2196F3",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },

  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },

  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },

  modalInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  modalAddButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  modalAddButtonDisabled: {
    opacity: 0.5,
  },

  modalAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
});