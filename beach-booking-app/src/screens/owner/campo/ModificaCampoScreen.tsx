import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import API_URL from '../../../config/api';

export default function ModificaCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<'beach_volley' | 'volley' | ''>('');
  const [surface, setSurface] = useState<'sand' | 'cement' | 'pvc' | ''>('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [indoor, setIndoor] = useState(false);
  const [pricePerHour, setPricePerHour] = useState('');
  const [isActive, setIsActive] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadCampo(); }, []);

  useEffect(() => {
    if (sport === 'beach_volley') setSurface('sand');
    else if (sport === 'volley') setSurface(indoor ? 'pvc' : 'cement');
  }, [sport, indoor]);

  const loadCampo = async () => {
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setName(data.name);
      setSport(data.sport);
      setSurface(data.surface);
      setMaxPlayers(data.maxPlayers?.toString() || '4');
      setIndoor(data.indoor || false);
      setPricePerHour(data.pricePerHour?.toString() || '');
      setIsActive(data.isActive ?? true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Errore', 'Impossibile caricare il campo', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, sport, surface, maxPlayers: parseInt(maxPlayers) || 4, indoor, pricePerHour: parseFloat(pricePerHour), isActive }),
      });
      Alert.alert('Successo', 'Campo aggiornato', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Errore', 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.loadingContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size='large' color='white' />
            <Text style={styles.loadingText}>Caricamento campo...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const surfaceLabel = sport === 'beach_volley' ? (indoor ? 'Sabbia (Indoor)' : 'Sabbia (Outdoor)') : (indoor ? 'PVC (Indoor)' : 'Cemento (Outdoor)');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={22} color='#333' />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Campo</Text>
        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [styles.saveHeaderButton, saving && styles.saveHeaderButtonDisabled, pressed && { opacity: 0.85 }]}>
          {saving ? <ActivityIndicator size='small' color='white' /> : <Text style={styles.saveHeaderButtonText}>Salva</Text>}
        </Pressable>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='create-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Nome campo</Text>
                <Text style={styles.sectionSubtitle}>Identificativo visibile ai giocatori</Text>
              </View>
            </View>
            <View style={styles.inputCard}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder='es. Campo 1' placeholderTextColor='#aaa' />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#FF9800', '#FB8C00']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='football-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Sport</Text>
                <Text style={styles.sectionSubtitle}>Tipo di attivita praticata</Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {[{ value: 'beach_volley', label: 'Beach Volley', icon: 'sunny-outline' }, { value: 'volley', label: 'Volley', icon: 'fitness-outline' }].map((item) => (
                <Pressable key={item.value} style={[styles.chip, sport === item.value && styles.chipActive]} onPress={() => setSport(item.value as any)}>
                  {sport === item.value ? (
                    <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.chipGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name={item.icon as any} size={20} color='white' />
                      <Text style={[styles.chipText, styles.chipTextActive]}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipInner}>
                      <Ionicons name={item.icon as any} size={20} color='#999' />
                      <Text style={styles.chipText}>{item.label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={indoor ? ['#2196F3', '#1976D2'] : ['#FF9800', '#FB8C00']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={indoor ? 'home-outline' : 'sunny-outline'} size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Ambiente</Text>
                <Text style={styles.sectionSubtitle}>Coperto o all aperto</Text>
              </View>
            </View>
            <View style={styles.switchCard}>
              <View style={styles.switchCardLeft}>
                <View style={[styles.switchCardIcon, { backgroundColor: indoor ? '#E3F2FD' : '#FFF3E0' }]}>
                  <Ionicons name={indoor ? 'home-outline' : 'sunny-outline'} size={22} color={indoor ? '#2196F3' : '#FF9800'} />
                </View>
                <View>
                  <Text style={styles.switchCardTitle}>{indoor ? 'Campo coperto (Indoor)' : 'Campo scoperto (Outdoor)'}</Text>
                  <Text style={styles.switchCardSubtitle}>Superficie: {surfaceLabel}</Text>
                </View>
              </View>
              <Switch value={indoor} onValueChange={setIndoor} trackColor={{ false: '#E0E0E0', true: '#BBDEFB' }} thumbColor={indoor ? '#2196F3' : '#9E9E9E'} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#4CAF50', '#43A047']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='layers-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Superficie</Text>
                <Text style={styles.sectionSubtitle}>Determinata da sport e ambiente</Text>
              </View>
            </View>
            <View style={styles.surfaceDisplay}>
              <View style={styles.surfaceIconBox}>
                <Ionicons name={surface === 'sand' ? 'sunny-outline' : surface === 'pvc' ? 'layers-outline' : 'grid-outline'} size={22} color='#4CAF50' />
              </View>
              <Text style={styles.surfaceDisplayText}>{surfaceLabel}</Text>
              <View style={styles.surfaceAutoTag}><Text style={styles.surfaceAutoTagText}>Automatica</Text></View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#FF9800', '#FB8C00']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='pricetag-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Tariffe e Giocatori</Text>
                <Text style={styles.sectionSubtitle}>Prezzo base e capienza</Text>
              </View>
            </View>
            <View style={styles.rowCards}>
              <View style={[styles.inputCard, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.inputCardLabel}>Prezzo/ora (EUR)</Text>
                <TextInput style={styles.input} value={pricePerHour} onChangeText={setPricePerHour} keyboardType='decimal-pad' placeholder='es. 20' placeholderTextColor='#aaa' />
              </View>
              <View style={[styles.inputCard, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.inputCardLabel}>Max giocatori</Text>
                <TextInput style={styles.input} value={maxPlayers} onChangeText={setMaxPlayers} keyboardType='number-pad' placeholder='es. 4' placeholderTextColor='#aaa' />
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={isActive ? ['#4CAF50', '#43A047'] : ['#F44336', '#E53935']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={isActive ? 'checkmark-circle-outline' : 'close-circle-outline'} size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Stato campo</Text>
                <Text style={styles.sectionSubtitle}>Visibilita e prenotabilita</Text>
              </View>
            </View>
            <View style={styles.switchCard}>
              <View style={styles.switchCardLeft}>
                <View style={[styles.switchCardIcon, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Ionicons name={isActive ? 'checkmark-circle-outline' : 'close-circle-outline'} size={22} color={isActive ? '#4CAF50' : '#F44336'} />
                </View>
                <View>
                  <Text style={styles.switchCardTitle}>{isActive ? 'Campo attivo' : 'Campo disattivo'}</Text>
                  <Text style={styles.switchCardSubtitle}>{isActive ? 'Visibile e prenotabile' : 'Non prenotabile'}</Text>
                </View>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }} thumbColor={isActive ? '#4CAF50' : '#9E9E9E'} />
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center', gap: 16 },
  loadingText: { color: 'white', fontSize: 16, fontWeight: '600', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1, zIndex: 10 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  saveHeaderButton: { backgroundColor: '#2196F3', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, minWidth: 68, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  saveHeaderButtonDisabled: { opacity: 0.5 },
  saveHeaderButtonText: { color: 'white', fontSize: 14, fontWeight: '700' },
  container: { flex: 1 },
  sectionContainer: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  sectionIconContainer: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  sectionIconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sectionSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  inputCard: { backgroundColor: 'white', borderRadius: 18, padding: 14, elevation: 3 },
  inputCardLabel: { fontSize: 11, fontWeight: '600', color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', paddingVertical: 4 },
  rowCards: { flexDirection: 'row' },
  chipContainer: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: 'white', elevation: 3 },
  chipActive: {},
  chipGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 12 },
  chipInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 12 },
  chipText: { fontSize: 14, fontWeight: '700', color: '#999' },
  chipTextActive: { color: 'white' },
  switchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 18, elevation: 3 },
  switchCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  switchCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  switchCardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  switchCardSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  surfaceDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 18, elevation: 3 },
  surfaceIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  surfaceDisplayText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  surfaceAutoTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  surfaceAutoTagText: { fontSize: 10, fontWeight: '700', color: '#4CAF50', textTransform: 'uppercase', letterSpacing: 0.3 },
});
