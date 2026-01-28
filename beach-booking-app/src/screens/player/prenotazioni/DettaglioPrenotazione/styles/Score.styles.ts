import { StyleSheet } from "react-native";

// Stili aggiuntivi da aggiungere al file DettaglioPrenotazione.styles.ts
export const scoreStyles = StyleSheet.create({
  // Score Modal Content
  scoreModalContent: {
    maxHeight: '90%',
    width: '95%',
  },

  scoreModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  scoreModalHeaderText: {
    flex: 1,
  },

  scoreModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  modalCloseButton: {
    padding: 8,
  },

  // Score Summary Card
  scoreSummaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },

  scoreSummaryTeam: {
    alignItems: 'center',
    gap: 12,
  },

  scoreSummaryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  scoreSummaryTeamText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  scoreSummaryScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#666',
  },

  scoreSummaryWinner: {
    color: '#FFD700',
  },

  scoreSummaryDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  winnerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    marginBottom: 16,
  },

  winnerIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
  },

  // Sets List
  setsScrollView: {
    maxHeight: 300,
  },

  setsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  setCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  setNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },

  removeSetButton: {
    padding: 4,
  },

  setInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  teamScoreInput: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },

  teamScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  scoreInput: {
    width: 70,
    height: 60,
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },

  scoreInputWinner: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },

  scoreInputDivider: {
    marginHorizontal: 12,
  },

  scoreInputDividerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#CCC',
  },

  setWinnerIndicator: {
    alignItems: 'center',
    paddingTop: 8,
  },

  setWinnerText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },

  setTieText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },

  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    marginBottom: 16,
  },

  addSetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },

  // Modal Actions
  scoreModalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },

  scoreModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },

  scoreModalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },

  scoreModalButtonSave: {
    backgroundColor: '#4CAF50',
  },

  scoreModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },

  scoreModalButtonTextSave: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Score Display Card (per visualizzare il risultato)
  scoreDisplayCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  scoreDisplayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  scoreDisplayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  scoreDisplayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  scoreDisplaySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  scoreEditButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },

  scoreMainDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 20,
  },

  scoreTeamDisplay: {
    alignItems: 'center',
    gap: 12,
  },

  scoreTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  scoreTeamBadgeWinner: {
    backgroundColor: '#FFF8E1',
  },

  scoreTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  scoreTeamScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#666',
  },

  scoreTeamScoreWinner: {
    color: '#FFD700',
  },

  scoreWinnerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
  },

  scoreDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sets Detail
  setsDetailContainer: {
    backgroundColor: '#FFF',
  },

  setsDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  setsDetailList: {
    gap: 8,
  },

  setDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },

  setDetailNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 50,
  },

  setDetailScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },

  setDetailTeamScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#999',
  },

  setDetailTeamScoreWinner: {
    color: '#4CAF50',
  },

  setDetailDivider: {
    fontSize: 18,
    color: '#CCC',
  },

  setDetailWinner: {
    width: 40,
    alignItems: 'flex-end',
  },

  setDetailWinnerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  setDetailWinnerBadgeA: {
    backgroundColor: '#E3F2FD',
  },

  setDetailWinnerBadgeB: {
    backgroundColor: '#FFEBEE',
  },

  setDetailWinnerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },

  setDetailTieText: {
    fontSize: 14,
    color: '#CCC',
  },

  // Pulsante per inserire il risultato (nella sezione match)
  submitScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    marginTop: 16,
  },

  submitScoreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default scoreStyles;