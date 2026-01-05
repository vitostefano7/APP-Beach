import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/DettaglioPrenotazione.styles';

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
  matchStatus: string;
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  visible,
  onClose,
  onSave,
  currentScore,
  matchStatus,
}) => {
  const [sets, setSets] = useState<Set[]>([{ teamA: 0, teamB: 0 }]);
  const [saving, setSaving] = useState(false);

  // Inizializza con il punteggio corrente se esiste
  useEffect(() => {
    if (currentScore && currentScore.sets.length > 0) {
      setSets(currentScore.sets);
    } else {
      // Reset se non c'è punteggio
      setSets([{ teamA: 0, teamB: 0 }]);
    }
  }, [currentScore, visible]);

  const addSet = () => {
    if (sets.length < 5) {
      setSets([...sets, { teamA: 0, teamB: 0 }]);
    }
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, i) => i !== index);
      setSets(newSets);
    }
  };

  const updateSet = (index: number, team: 'A' | 'B', value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0 || numValue > 99) return;

    const newSets = [...sets];
    if (team === 'A') {
      newSets[index].teamA = numValue;
    } else {
      newSets[index].teamB = numValue;
    }
    setSets(newSets);
  };

  const calculateWinner = (): 'A' | 'B' | null => {
    let teamAWins = 0;
    let teamBWins = 0;

    sets.forEach(set => {
      if (set.teamA > set.teamB) teamAWins++;
      else if (set.teamB > set.teamA) teamBWins++;
    });

    if (teamAWins > teamBWins) return 'A';
    if (teamBWins > teamAWins) return 'B';
    return null;
  };

  const handleSave = async () => {
    // Validazione: almeno un set deve avere un punteggio
    const hasScore = sets.some(set => set.teamA > 0 || set.teamB > 0);
    if (!hasScore) {
      Alert.alert('Errore', 'Inserisci almeno un punteggio');
      return;
    }

    // Calcola il vincitore automaticamente
    const calculatedWinner = calculateWinner();
    if (!calculatedWinner) {
      Alert.alert('Errore', 'Il match non può finire in pareggio. Assicurati che ci sia un vincitore.');
      return;
    }

    try {
      setSaving(true);
      await onSave(calculatedWinner, sets);
      onClose();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
    } finally {
      setSaving(false);
    }
  };

  const getSetSummary = () => {
    let teamAWins = 0;
    let teamBWins = 0;

    sets.forEach(set => {
      if (set.teamA > set.teamB) teamAWins++;
      else if (set.teamB > set.teamA) teamBWins++;
    });

    return { teamAWins, teamBWins };
  };

  const { teamAWins, teamBWins } = getSetSummary();
  const calculatedWinner = calculateWinner();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.scoreModalContent]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.scoreModalHeaderContent}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
              <View style={styles.scoreModalHeaderText}>
                <Text style={styles.modalTitle}>
                  {currentScore?.sets.length > 0 ? 'Modifica Risultato' : 'Inserisci Risultato'}
                </Text>
                <Text style={styles.scoreModalSubtitle}>
                  Registra il punteggio del match
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Score Summary */}
          <View style={styles.scoreSummaryCard}>
            <View style={styles.scoreSummaryTeam}>
              <View style={[styles.scoreSummaryBadge, styles.teamBadgeA]}>
                <Text style={styles.scoreSummaryTeamText}>Team A</Text>
              </View>
              <Text style={[
                styles.scoreSummaryScore,
                calculatedWinner === 'A' && styles.scoreSummaryWinner
              ]}>
                {teamAWins}
              </Text>
            </View>

            <View style={styles.scoreSummaryDivider}>
              <Ionicons name="remove" size={24} color="#999" />
            </View>

            <View style={styles.scoreSummaryTeam}>
              <View style={[styles.scoreSummaryBadge, styles.teamBadgeB]}>
                <Text style={styles.scoreSummaryTeamText}>Team B</Text>
              </View>
              <Text style={[
                styles.scoreSummaryScore,
                calculatedWinner === 'B' && styles.scoreSummaryWinner
              ]}>
                {teamBWins}
              </Text>
            </View>
          </View>

          {calculatedWinner && (
            <View style={styles.winnerIndicator}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.winnerIndicatorText}>
                Vincitore: Team {calculatedWinner}
              </Text>
            </View>
          )}

          {/* Sets List */}
          <ScrollView style={styles.setsScrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.setsTitle}>Punteggi per Set</Text>
            
            {sets.map((set, index) => (
              <View key={index} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text style={styles.setNumber}>Set {index + 1}</Text>
                  {sets.length > 1 && (
                    <Pressable
                      onPress={() => removeSet(index)}
                      style={styles.removeSetButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </Pressable>
                  )}
                </View>

                <View style={styles.setInputs}>
                  {/* Team A Input */}
                  <View style={styles.teamScoreInput}>
                    <Text style={styles.teamScoreLabel}>Team A</Text>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        set.teamA > set.teamB && styles.scoreInputWinner
                      ]}
                      value={set.teamA.toString()}
                      onChangeText={(text) => updateSet(index, 'A', text)}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                  </View>

                  <View style={styles.scoreInputDivider}>
                    <Text style={styles.scoreInputDividerText}>-</Text>
                  </View>

                  {/* Team B Input */}
                  <View style={styles.teamScoreInput}>
                    <Text style={styles.teamScoreLabel}>Team B</Text>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        set.teamB > set.teamA && styles.scoreInputWinner
                      ]}
                      value={set.teamB.toString()}
                      onChangeText={(text) => updateSet(index, 'B', text)}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                  </View>
                </View>

                {/* Set Winner Indicator */}
                {(set.teamA > 0 || set.teamB > 0) && (
                  <View style={styles.setWinnerIndicator}>
                    {set.teamA > set.teamB ? (
                      <Text style={styles.setWinnerText}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        {' '}Team A vince questo set
                      </Text>
                    ) : set.teamB > set.teamA ? (
                      <Text style={styles.setWinnerText}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        {' '}Team B vince questo set
                      </Text>
                    ) : (
                      <Text style={styles.setTieText}>
                        <Ionicons name="alert-circle" size={14} color="#FF9800" />
                        {' '}Pareggio
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}

            {/* Add Set Button */}
            {sets.length < 5 && (
              <Pressable style={styles.addSetButton} onPress={addSet}>
                <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
                <Text style={styles.addSetButtonText}>Aggiungi Set</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.scoreModalActions}>
            <Pressable
              style={[styles.scoreModalButton, styles.scoreModalButtonCancel]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.scoreModalButtonTextCancel}>Annulla</Text>
            </Pressable>

            <Pressable
              style={[
                styles.scoreModalButton, 
                styles.scoreModalButtonSave,
                saving && { opacity: 0.6 }
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.scoreModalButtonTextSave}>
                    {currentScore?.sets.length > 0 ? 'Aggiorna' : 'Salva'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScoreModal;