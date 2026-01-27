import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Set {
  teamA: number;
  teamB: number;
}

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (winner: 'A' | 'B', sets: Set[]) => Promise<void>;
  currentScore?: {
    winner?: 'A' | 'B';
    sets: Set[];
  };
  matchStatus?: string;
  sportType?: 'beachvolley' | 'volleyball'; // Default: beachvolley
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  visible,
  onClose,
  onSave,
  currentScore,
  matchStatus,
  sportType = 'beachvolley',
}) => {
  // Stato - 3 set fissi
  const [set1A, setSet1A] = useState('');
  const [set1B, setSet1B] = useState('');
  const [set2A, setSet2A] = useState('');
  const [set2B, setSet2B] = useState('');
  const [set3A, setSet3A] = useState('');
  const [set3B, setSet3B] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset quando si apre
  useEffect(() => {
    if (visible) {
      if (currentScore && currentScore.sets.length > 0) {
        setSet1A(currentScore.sets[0]?.teamA > 0 ? String(currentScore.sets[0].teamA) : '');
        setSet1B(currentScore.sets[0]?.teamB > 0 ? String(currentScore.sets[0].teamB) : '');
        setSet2A(currentScore.sets[1]?.teamA > 0 ? String(currentScore.sets[1]?.teamA) : '');
        setSet2B(currentScore.sets[1]?.teamB > 0 ? String(currentScore.sets[1]?.teamB) : '');
        setSet3A(currentScore.sets[2]?.teamA > 0 ? String(currentScore.sets[2]?.teamA) : '');
        setSet3B(currentScore.sets[2]?.teamB > 0 ? String(currentScore.sets[2]?.teamB) : '');
      } else {
        setSet1A('');
        setSet1B('');
        setSet2A('');
        setSet2B('');
        setSet3A('');
        setSet3B('');
      }
    }
  }, [visible, currentScore]);

  // Validazione punteggio per un set
  const validateSetScore = (scoreA: number, scoreB: number): { valid: boolean; message?: string } => {
    if (scoreA === 0 && scoreB === 0) {
      return { valid: true }; // Set non giocato
    }

    const maxPoints = sportType === 'volleyball' ? 25 : 21;
    const winner = scoreA > scoreB ? scoreA : scoreB;
    const loser = scoreA > scoreB ? scoreB : scoreA;
    const diff = Math.abs(scoreA - scoreB);

    // Deve esserci un vincitore chiaro
    if (diff === 0) {
      return { valid: false, message: 'Un set non può finire in pareggio' };
    }

    // Se entrambi hanno meno del massimo, il vincitore deve aver raggiunto il max
    if (winner < maxPoints) {
      return { valid: false, message: `Per vincere un set serve almeno ${maxPoints} punti` };
    }

    // Se il vincitore ha esattamente maxPoints, il perdente deve avere al massimo maxPoints-2
    // Questo perché sul (maxPoints-1)-(maxPoints-1) si va ad oltranza
    if (winner === maxPoints && loser >= maxPoints - 1) {
      return { 
        valid: false, 
        message: `Sul ${maxPoints-1}-${maxPoints-1} si va ad oltranza. Serve ${maxPoints+1}-${maxPoints-1} o superiore con +2` 
      };
    }

    // Se si va oltre il maxPoints, serve un vantaggio di almeno 2 punti
    if (winner > maxPoints && diff < 2) {
      return { valid: false, message: 'Oltre i ' + maxPoints + ' punti serve un vantaggio di almeno 2 punti' };
    }

    return { valid: true };
  };

  // Calcola vincitore di ogni set
  const getSetWinner = (a: string, b: string): 'A' | 'B' | null => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    if (numA > numB) return 'A';
    if (numB > numA) return 'B';
    return null;
  };

  // Calcola vincitore match (2 set su 3)
  const getMatchWinner = (): 'A' | 'B' | null => {
    let winsA = 0;
    let winsB = 0;

    if (getSetWinner(set1A, set1B) === 'A') winsA++;
    else if (getSetWinner(set1A, set1B) === 'B') winsB++;
    if (getSetWinner(set2A, set2B) === 'A') winsA++;
    else if (getSetWinner(set2A, set2B) === 'B') winsB++;
    if (getSetWinner(set3A, set3B) === 'A') winsA++;
    else if (getSetWinner(set3A, set3B) === 'B') winsB++;

    if (winsA >= 2) return 'A';
    if (winsB >= 2) return 'B';
    return null;
  };

  const handleSave = async () => {
    // Almeno 2 set devono avere punteggio
    const set1HasScore = (parseInt(set1A) || 0) > 0 || (parseInt(set1B) || 0) > 0;
    const set2HasScore = (parseInt(set2A) || 0) > 0 || (parseInt(set2B) || 0) > 0;

    if (!set1HasScore || !set2HasScore) {
      Alert.alert('Errore', 'Inserisci almeno i primi 2 set');
      return;
    }

    // Costruisci i set con i valori effettivi inseriti
    const sets: Set[] = [
      { teamA: parseInt(set1A) || 0, teamB: parseInt(set1B) || 0 },
      { teamA: parseInt(set2A) || 0, teamB: parseInt(set2B) || 0 },
      { teamA: parseInt(set3A) || 0, teamB: parseInt(set3B) || 0 },
    ];

    // Valida i punteggi di ogni set giocato
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      if (set.teamA > 0 || set.teamB > 0) {
        const validation = validateSetScore(set.teamA, set.teamB);
        if (!validation.valid) {
          Alert.alert('Errore Set ' + (i + 1), validation.message || 'Punteggio non valido');
          return;
        }
      }
    }

    const winner = getMatchWinner();

    if (!winner) {
      Alert.alert(
        'Errore',
        'Il match non può finire in pareggio. Completa i set necessari per avere un vincitore.'
      );
      return;
    }

    try {
      setSaving(true);
      await onSave(winner, sets);
      onClose();
    } catch (error: any) {
      console.error('[ScoreModal] Errore salvataggio:', error);
      Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
    } finally {
      setSaving(false);
    }
  };

  const winner = getMatchWinner();
  const set1Winner = getSetWinner(set1A, set1B);
  const set2Winner = getSetWinner(set2A, set2B);
  const set3Winner = getSetWinner(set3A, set3B);
  const winsA = [set1Winner, set2Winner, set3Winner].filter((w) => w === 'A').length;
  const winsB = [set1Winner, set2Winner, set3Winner].filter((w) => w === 'B').length;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="trophy" size={28} color="white" />
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Inserisci Risultato</Text>
                <Text style={styles.modalSubtitle}>
                  {sportType === 'volleyball' ? 'Pallavolo' : 'Beach Volley'} - Max {sportType === 'volleyball' ? '25' : '21'} punti/set
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.modalCloseButton}
              disabled={saving}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>

          {/* Body - Scrollable */}
          <ScrollView 
            style={styles.modalBodyScroll}
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Set 1 */}
            <View style={styles.setRow}>
              <View style={styles.setLabelContainer}>
                <Text style={styles.setLabel}>Set 1</Text>
                {set1Winner && (
                  <View
                    style={[
                      styles.setWinnerBadge,
                      set1Winner === 'A' ? styles.teamABadge : styles.teamBBadge,
                    ]}
                  >
                    <Ionicons name="trophy" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.setInputsContainer}>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team A</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set1Winner === 'A' && styles.scoreInputWinner,
                    ]}
                    value={set1A}
                    onChangeText={setSet1A}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
                <Text style={styles.scoreSeparator}>-</Text>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team B</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set1Winner === 'B' && styles.scoreInputWinner,
                    ]}
                    value={set1B}
                    onChangeText={setSet1B}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
              </View>
            </View>

            {/* Set 2 */}
            <View style={styles.setRow}>
              <View style={styles.setLabelContainer}>
                <Text style={styles.setLabel}>Set 2</Text>
                {set2Winner && (
                  <View
                    style={[
                      styles.setWinnerBadge,
                      set2Winner === 'A' ? styles.teamABadge : styles.teamBBadge,
                    ]}
                  >
                    <Ionicons name="trophy" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.setInputsContainer}>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team A</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set2Winner === 'A' && styles.scoreInputWinner,
                    ]}
                    value={set2A}
                    onChangeText={setSet2A}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
                <Text style={styles.scoreSeparator}>-</Text>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team B</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set2Winner === 'B' && styles.scoreInputWinner,
                    ]}
                    value={set2B}
                    onChangeText={setSet2B}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
              </View>
            </View>

            {/* Set 3 */}
            <View style={[styles.setRow, styles.lastSetRow]}>
              <View style={styles.setLabelContainer}>
                <Text style={styles.setLabel}>Set 3</Text>
                {set3Winner && (
                  <View
                    style={[
                      styles.setWinnerBadge,
                      set3Winner === 'A' ? styles.teamABadge : styles.teamBBadge,
                    ]}
                  >
                    <Ionicons name="trophy" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.setInputsContainer}>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team A</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set3Winner === 'A' && styles.scoreInputWinner,
                    ]}
                    value={set3A}
                    onChangeText={setSet3A}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
                <Text style={styles.scoreSeparator}>-</Text>
                <View style={styles.teamInputWrapper}>
                  <Text style={styles.teamInputLabel}>Team B</Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      set3Winner === 'B' && styles.scoreInputWinner,
                    ]}
                    value={set3B}
                    onChangeText={setSet3B}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
              </View>
            </View>

            {/* Risultato Finale */}
            {winner && (
              <View style={styles.winnerContainer}>
                <View
                  style={[
                    styles.winnerCard,
                    winner === 'A' ? styles.winnerCardTeamA : styles.winnerCardTeamB,
                  ]}
                >
                  <Ionicons name="trophy" size={28} color="white" />
                  <Text style={styles.winnerTitle}>Vincitore: Team {winner}</Text>
                  <Text style={styles.winnerScore}>
                    {winsA} - {winsB}
                  </Text>
                </View>
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpTextContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.helpText}>
                {sportType === 'volleyball' 
                  ? 'Max 25 punti o ad oltranza con +2 di vantaggio (26-24, 27-25...). Vince chi conquista 2 set su 3.' 
                  : 'Max 21 punti o ad oltranza con +2 di vantaggio (22-20, 23-21...). Vince chi conquista 2 set su 3.'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Annulla</Text>
            </Pressable>

            <Pressable
              style={[
                styles.footerButton,
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Salva Risultato</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 18,
    backgroundColor: '#2196F3',
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
  modalBodyScroll: {
    maxHeight: '60%',
  },
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
    backgroundColor: '#2196F3',
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
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

export default ScoreModal;
