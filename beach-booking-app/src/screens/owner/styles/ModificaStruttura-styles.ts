import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800",
    color: "#1a1a1a",
  },

  saveHeaderButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },

  saveHeaderButtonDisabled: {
    opacity: 0.5,
  },

  saveHeaderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  
  container: { 
    flex: 1, 
    padding: 16,
  },

  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  statusIconActive: {
    backgroundColor: "#E8F5E9",
  },

  statusIconInactive: {
    backgroundColor: "#FFEBEE",
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  statusSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#E65100",
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 16,
    color: "#1a1a1a",
  },
  
  section: { 
    marginBottom: 16,
  },
  
  label: { 
    fontSize: 14, 
    fontWeight: "700", 
    marginBottom: 8, 
    color: "#1a1a1a",
  },
  
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
  },
  
  textArea: { 
    minHeight: 100, 
    textAlignVertical: "top",
  },
  
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  
  infoText: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "600",
    marginBottom: 4,
  },
  
  infoAddress: {
    fontSize: 13,
    color: "#666",
  },

  dayRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  dayLabel: { 
    fontSize: 16, 
    fontWeight: "700",
    color: "#1a1a1a",
  },

  dayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dayToggleLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  
  timeRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 12,
    gap: 12,
  },

  timeInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  
  timeSeparator: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#2196F3",
  },

  amenityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  amenityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  amenityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },

  amenityIconActive: {
    backgroundColor: "#E3F2FD",
  },
  
  amenityLabel: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },

  customBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  customBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF9800",
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
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },

  addCustomButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },

  customInputContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
  },

  customInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 12,
  },

  customInputActions: {
    flexDirection: "row",
    gap: 12,
  },

  customInputCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  customInputCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },

  customInputAdd: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },

  customInputAddDisabled: {
    opacity: 0.5,
  },

  customInputAddText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  saveButtonDisabled: { 
    opacity: 0.5,
  },
  
  saveButtonText: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "700",
  },

  // ✅ MODAL
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#2196F3",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },

  modalAddButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },

  modalAddButtonDisabled: {
    opacity: 0.5,
  },

  modalAddText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});