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
import { Avatar } from '../../../../../components/Avatar';
import styles from '../styles/DettaglioPrenotazione.styles';

interface Set {
  teamA: number;
  teamB: number;
}

interface Player {
  user: {
    _id: string;
    name: string;
    surname: string;
  };
  team?: 'A' | 'B';
  status: string;
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
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  visible,
  onClose,
  onSave,
  currentScore,
  matchStatus,
  teamAPlayers = [],
  teamBPlayers = [],
}) => {
  // Stato semplice - 3 set fissi
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
        setSet2A(currentScore.sets[1]?.teamA > 0 ? String(currentScore.sets[1].teamA) : '');
        setSet2B(currentScore.sets[1]?.teamB > 0 ? String(currentScore.sets[1].teamB) : '');
        setSet3A(currentScore.sets[2]?.teamA > 0 ? String(currentScore.sets[2].teamA) : '');
        setSet3B(currentScore.sets[2]?.teamB > 0 ? String(currentScore.sets[2].teamB) : '');
      } else {
        setSet1A(''); setSet1B('');
        setSet2A(''); setSet2B('');
        setSet3A(''); setSet3B('');
      }
    }
  }, [visible, currentScore]);

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
    
    if (getSetWinner(set1A, set1B) === 'A') winsA++; else if (getSetWinner(set1A, set1B) === 'B') winsB++;
    if (getSetWinner(set2A, set2B) === 'A') winsA++; else if (getSetWinner(set2A, set2B) === 'B') winsB++;
    if (getSetWinner(set3A, set3B) === 'A') winsA++; else if (getSetWinner(set3A, set3B) === 'B') winsB++;
    
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

    // Per debug, usa punteggi di test
    const sets: Set[] = [
      { teamA: 21, teamB: 15 },
      { teamA: 15, teamB: 21 },
      { teamA: 21, teamB: 17 },
    ];
    const winner = 'A';
    
    console.log('DEBUG SALVA', { sets, winner });

    if (!winner) {
      Alert.alert('Errore', 'Il match non può finire in pareggio. Completa i set necessari.');
      return;
    }

    try {
      setSaving(true);
      await onSave(winner, sets);
      onClose();
    } catch (error: any) {
      console.log('ERRORE SALVATAGGIO', error);
      if (error && typeof error === 'object') {
        console.log('error.message:', error.message);
        if (error.response) {
          console.log('error.response:', error.response);
        }
      }
      Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
    } finally {
      setSaving(false);
    }
  };

  const winner = getMatchWinner();
  const winsA = [getSetWinner(set1A, set1B), getSetWinner(set2A, set2B), getSetWinner(set3A, set3B)].filter(w => w === 'A').length;
  const winsB = [getSetWinner(set1A, set1B), getSetWinner(set2A, set2B), getSetWinner(set3A, set3B)].filter(w => w === 'B').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { justifyContent: 'flex-start', paddingTop: 20 }]}>
          
          {/* Titolo semplice */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Inserisci Risultato</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Set 1 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
            <Text style={{ width: 50, fontWeight: 'bold' }}>Set 1</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set1A}
              onChangeText={setSet1A}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={{ fontSize: 18 }}>-</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set1B}
              onChangeText={setSet1B}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Set 2 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
            <Text style={{ width: 50, fontWeight: 'bold' }}>Set 2</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set2A}
              onChangeText={setSet2A}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={{ fontSize: 18 }}>-</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set2B}
              onChangeText={setSet2B}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Set 3 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ width: 50, fontWeight: 'bold' }}>Set 3</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set3A}
              onChangeText={setSet3A}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={{ fontSize: 18 }}>-</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, width: 60, height: 45, textAlign: 'center', fontSize: 18, marginHorizontal: 10 }}
              value={set3B}
              onChangeText={setSet3B}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Vincitore */}
          {winner && (
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 16, color: '#4CAF50', fontWeight: 'bold' }}>
                Vincitore: Team {winner} ({winsA}-{winsB})
              </Text>
            </View>
          )}

          {/* Bottoni */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 }}>
            <Pressable
              style={{ padding: 15, backgroundColor: '#eee', borderRadius: 8, minWidth: 100, alignItems: 'center' }}
              onPress={onClose}
              disabled={saving}
            >
              <Text>Annulla</Text>
            </Pressable>

            <Pressable
              style={{ padding: 15, backgroundColor: '#4CAF50', borderRadius: 8, minWidth: 100, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salva</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScoreModal;