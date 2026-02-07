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

type SportCategory = 'set-points' | 'set-games' | 'point-based';

interface SportConfig {
  category: SportCategory;
  maxPointsPerSet?: number; // Per volley/beach volley
  maxGamesPerSet?: number; // Per tennis/padel
  setsToWin: number;
  allowsDraw?: boolean; // Per calcio/calcetto
  label: string;
}

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (winner: 'A' | 'B' | null, sets: Set[]) => Promise<void>; // null = pareggio
  currentScore?: {
    winner?: 'A' | 'B';
    sets: Set[];
  };
  matchStatus?: string;
  sportType?: string; // es: 'volley', 'beach_volley', 'tennis', 'calcio', etc.
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  visible,
  onClose,
  onSave,
  currentScore,
  matchStatus,
  sportType = 'beach_volley',
}) => {
  // Configurazione sport
  const getSportConfig = (sport: string): SportConfig => {
    const sportLower = sport.toLowerCase();
    
    // Volley e Beach Volley (set-points)
    if (sportLower === 'volley' || sportLower === 'volleyball') {
      return {
        category: 'set-points',
        maxPointsPerSet: 25,
        setsToWin: 2,
        label: 'Volley (max 25 punti/set, best of 3)',
      };
    }
    if (sportLower === 'beach_volley' || sportLower === 'beach volley' || sportLower === 'beachvolley') {
      return {
        category: 'set-points',
        maxPointsPerSet: 21,
        setsToWin: 2,
        label: 'Beach Volley (max 21 punti/set, best of 3)',
      };
    }
    
    // Tennis e Padel (set-games)
    if (sportLower === 'tennis') {
      return {
        category: 'set-games',
        maxGamesPerSet: 6,
        setsToWin: 2,
        label: 'Tennis (6 giochi/set, best of 3)',
      };
    }
    if (sportLower === 'padel') {
      return {
        category: 'set-games',
        maxGamesPerSet: 6,
        setsToWin: 2,
        label: 'Padel (6 giochi/set, best of 3)',
      };
    }
    if (sportLower === 'beach_tennis' || sportLower === 'beach tennis') {
      return {
        category: 'set-games',
        maxGamesPerSet: 7, // o 9 a seconda del format
        setsToWin: 1, // Di solito è un singolo set
        label: 'Beach Tennis (max 7-9 giochi)',
      };
    }
    
    // Sport point-based (calcio, basket, etc.)
    if (sportLower.includes('calcio') || sportLower.includes('calcetto') || sportLower.includes('calciotto')) {
      return {
        category: 'point-based',
        setsToWin: 1,
        allowsDraw: true,
        label: `${sport} (punteggio finale, pareggio consentito)`,
      };
    }
    if (sportLower === 'basket' || sportLower === 'basketball') {
      return {
        category: 'point-based',
        setsToWin: 1,
        allowsDraw: true,
        label: 'Basket (punteggio finale, pareggio consentito)',
      };
    }
    
    // Default: beach volley
    return {
      category: 'set-points',
      maxPointsPerSet: 21,
      setsToWin: 2,
      label: 'Beach Volley (max 21 punti/set, best of 3)',
    };
  };

  const sportConfig = getSportConfig(sportType);
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

    // Point-based sport: qualsiasi punteggio >= 0 è valido
    if (sportConfig.category === 'point-based') {
      if (scoreA === scoreB && !sportConfig.allowsDraw) {
        return { valid: false, message: 'Il pareggio non è consentito per questo sport' };
      }
      return { valid: true };
    }

    // Set-games (tennis/padel/beach tennis)
    if (sportConfig.category === 'set-games') {
      const maxGames = sportConfig.maxGamesPerSet || 6;
      const winner = scoreA > scoreB ? scoreA : scoreB;
      const loser = scoreA > scoreB ? scoreB : scoreA;
      const diff = Math.abs(scoreA - scoreB);

      // Deve esserci un vincitore
      if (diff === 0) {
        return { valid: false, message: 'Un set non può finire in pareggio' };
      }

      // Se uno ha meno di maxGames, il vincitore deve averne esattamente maxGames
      if (winner < maxGames) {
        return { valid: false, message: `Per vincere un set serve almeno ${maxGames} giochi` };
      }

      // Se vincitore ha esattamente maxGames, perdente deve avere < maxGames-1
      if (winner === maxGames && loser >= maxGames - 1) {
        return { 
          valid: false, 
          message: `Sul ${maxGames-1}-${maxGames-1} si va a tiebreak. Serve ${maxGames}-${maxGames-2} o superiore con +2` 
        };
      }

      // Se si va oltre maxGames (es. 7-5), serve +2
      if (winner > maxGames && diff < 2) {
        return { valid: false, message: `Oltre ${maxGames} giochi serve un vantaggio di almeno 2 giochi` };
      }

      return { valid: true };
    }

    // Set-points (volley/beach volley)
    const maxPoints = sportConfig.maxPointsPerSet || 21;
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
    // Per point-based: basta il primo "set" (punteggio finale)
    if (sportConfig.category === 'point-based') {
      const set1HasScore = (parseInt(set1A) || 0) > 0 || (parseInt(set1B) || 0) > 0;
      
      if (!set1HasScore) {
        Alert.alert('Errore', 'Inserisci il punteggio finale');
        return;
      }

      const sets: Set[] = [
        { teamA: parseInt(set1A) || 0, teamB: parseInt(set1B) || 0 },
      ];

      const validation = validateSetScore(sets[0].teamA, sets[0].teamB);
      if (!validation.valid) {
        Alert.alert('Errore', validation.message || 'Punteggio non valido');
        return;
      }

      const winner = getMatchWinner();
      if (!winner && !sportConfig.allowsDraw) {
        Alert.alert('Errore', 'Il match non può finire in pareggio');
        return;
      }

      try {
        setSaving(true);
        // Passa winner (può essere null per pareggio se allowsDraw è true)
        await onSave(winner, sets);
        onClose();
      } catch (error: any) {
        console.error('[ScoreModal] Errore salvataggio:', error);
        Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Per set-based: almeno 2 set devono avere punteggio
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
                  {sportConfig.label}
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
            {/* Point-based: solo punteggio finale */}
            {sportConfig.category === 'point-based' && (
              <>
                <View style={[styles.setRow, styles.lastSetRow]}>
                  <View style={styles.setLabelContainer}>
                    <Text style={styles.setLabel}>Punteggio Finale</Text>
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
                        maxLength={3}
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
                        maxLength={3}
                        editable={!saving}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Set-based: 3 set */}
            {sportConfig.category !== 'point-based' && (
              <>
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
            </>
            )}

            {/* Risultato Finale */}
            {(winner || (sportConfig.category === 'point-based' && sportConfig.allowsDraw && set1A && set1B && set1A === set1B)) && (
              <View style={styles.winnerContainer}>
                {winner ? (
                  <View
                    style={[
                      styles.winnerCard,
                      winner === 'A' ? styles.winnerCardTeamA : styles.winnerCardTeamB,
                    ]}
                  >
                    <Ionicons name="trophy" size={28} color="white" />
                    <Text style={styles.winnerTitle}>
                      {sportConfig.category === 'point-based' ? 'Vincitore' : 'Vincitore Match'}: Team {winner}
                    </Text>
                    {sportConfig.category !== 'point-based' && (
                      <Text style={styles.winnerScore}>
                        {winsA} - {winsB}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[styles.winnerCard, styles.winnerCardDraw]}>
                    <Ionicons name="swap-horizontal" size={28} color="white" />
                    <Text style={styles.winnerTitle}>Pareggio</Text>
                    <Text style={styles.winnerScore}>
                      {set1A} - {set1B}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpTextContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.helpText}>
                {sportConfig.category === 'point-based' 
                  ? sportConfig.allowsDraw 
                    ? 'Inserisci il punteggio finale. Il pareggio è consentito.'
                    : 'Inserisci il punteggio finale. Il pareggio non è consentito.'
                  : sportConfig.category === 'set-games'
                  ? `Max ${sportConfig.maxGamesPerSet} giochi o ad oltranza con +2 di vantaggio (es. ${(sportConfig.maxGamesPerSet || 6) + 1}-${(sportConfig.maxGamesPerSet || 6) - 1}). Vince chi conquista ${sportConfig.setsToWin} set${sportConfig.setsToWin > 1 ? ' su 3' : ''}.`
                  : `Max ${sportConfig.maxPointsPerSet} punti o ad oltranza con +2 di vantaggio (es. ${(sportConfig.maxPointsPerSet || 21) + 1}-${(sportConfig.maxPointsPerSet || 21) - 1}). Vince chi conquista 2 set su 3.`
                }
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
  winnerCardDraw: {
    backgroundColor: '#9E9E9E',
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
