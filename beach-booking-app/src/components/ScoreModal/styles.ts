import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 18,
    backgroundColor: '#667eea',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },

  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  modalCloseButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Body
  modalBody: {
    padding: 20,
  },

  setRow: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  lastSetRow: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },

  setLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  setLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  setWinnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  teamABadge: {
    backgroundColor: '#4CAF50',
  },

  teamBBadge: {
    backgroundColor: '#FF9800',
  },

  setInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  teamInputWrapper: {
    alignItems: 'center',
    gap: 6,
  },

  teamInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  scoreInput: {
    width: 70,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#F5F5F5',
  },

  scoreInputWinner: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },

  scoreSeparator: {
    fontSize: 28,
    fontWeight: '300',
    color: '#999',
    marginTop: 20,
  },

  // Winner Section
  winnerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },

  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  winnerCardTeamA: {
    backgroundColor: '#4CAF50',
  },

  winnerCardTeamB: {
    backgroundColor: '#FF9800',
  },

  winnerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },

  winnerScore: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Help Text
  helpTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
  },

  helpText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },

  // Footer
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },

  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },

  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  saveButton: {
    backgroundColor: '#667eea',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
