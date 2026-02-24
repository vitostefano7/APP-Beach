import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
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
import { Ionicons, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { sportIcons } from '../../../utils/sportIcons';
import { useAlert } from '../../../context/AlertContext';

import API_URL from '../../../config/api';

interface SportData {
  _id: string;
  name: string;
  code: string;
  minPlayers: number;
  maxPlayers: number;
  allowsIndoor: boolean;
  allowsOutdoor: boolean;
  recommendedSurfaces?: {
    indoor?: string[];
    outdoor?: string[];
    any?: string[];
  };
  isActive: boolean;
}

type SurfaceType = 'sand' | 'cement' | 'pvc' | 'synthetic' | 'clay' | 'grass' | 'resin' | 'parquet' | 'tartan' | '';

const SURFACE_LABELS: Record<string, string> = {
  sand: 'Sabbia',
  cement: 'Cemento',
  pvc: 'PVC',
  synthetic: 'Sintetico',
  clay: 'Terra Battuta',
  grass: 'Erba',
  resin: 'Resina',
  parquet: 'Parquet',
  tartan: 'Tartan',
};

export default function ModificaCampoScreen() {
  const { token } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [loadingSports, setLoadingSports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<string>('');
  const [sports, setSports] = useState<SportData[]>([]);
  const [surface, setSurface] = useState<SurfaceType>('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [indoor, setIndoor] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCampo();
    fetchSports();
  }, []);

  useEffect(() => {
    const selectedSport = sports.find((item) => item.code === sport);
    if (!selectedSport) return;

    if (indoor && !selectedSport.allowsIndoor && selectedSport.allowsOutdoor) {
      setIndoor(false);
      return;
    }

    if (!indoor && !selectedSport.allowsOutdoor && selectedSport.allowsIndoor) {
      setIndoor(true);
      return;
    }

    const newSurface = getSurfaceBySportAndEnvironment(selectedSport, indoor, surface);
    if (newSurface) {
      setSurface(newSurface as SurfaceType);
    }

    if (selectedSport.maxPlayers) {
      setMaxPlayers(selectedSport.maxPlayers.toString());
    }
  }, [sport, indoor, sports]);

  const fetchSports = async () => {
    try {
      const response = await fetch(`${API_URL}/sports`);
      const data = await response.json();

      if (data.success) {
        setSports(data.data || []);
      } else {
        showAlert({ title: 'Errore', message: 'Impossibile caricare gli sport disponibili', type: 'error' });
      }
    } catch {
      showAlert({ title: 'Errore', message: 'Impossibile caricare gli sport disponibili', type: 'error' });
    } finally {
      setLoadingSports(false);
    }
  };

  const getSurfaceBySportAndEnvironment = (sportData: SportData, isIndoor: boolean, currentSurface: string): string => {
    const recommended =
      sportData.recommendedSurfaces?.any?.length
        ? sportData.recommendedSurfaces.any
        : isIndoor
          ? (sportData.recommendedSurfaces?.indoor || [])
          : (sportData.recommendedSurfaces?.outdoor || []);

    if (!recommended.length) {
      return currentSurface;
    }

    if (currentSurface && recommended.includes(currentSurface)) {
      return currentSurface;
    }

    return recommended[0];
  };

  const getSurfaceLabel = () => {
    const surfaceLabel = SURFACE_LABELS[surface] || (surface ? surface.charAt(0).toUpperCase() + surface.slice(1) : 'Superficie');
    return surfaceLabel;
  };

  const getSurfaceIconName = (surfaceCode: string) => {
    if (surfaceCode === 'sand') return 'sunny-outline';
    if (surfaceCode === 'pvc' || surfaceCode === 'parquet' || surfaceCode === 'tartan') return 'layers-outline';
    if (surfaceCode === 'grass' || surfaceCode === 'synthetic') return 'leaf-outline';
    return 'grid-outline';
  };

  const renderSurfaceIcon = (surfaceCode: string, isSelected: boolean) => {
    const iconColor = isSelected ? '#fff' : '#2196F3';
    if (surfaceCode === 'grass' || surfaceCode === 'synthetic') {
      return <MaterialIcons name='grass' size={18} color={iconColor} />;
    }

    return <Ionicons name={getSurfaceIconName(surfaceCode) as any} size={18} color={iconColor} />;
  };

  const getAvailableSurfaces = (sportData?: SportData, isIndoorEnvironment?: boolean): string[] => {
    if (!sportData) return [];
    if (sportData.recommendedSurfaces?.any?.length) return sportData.recommendedSurfaces.any;
    if (isIndoorEnvironment) return sportData.recommendedSurfaces?.indoor || [];
    return sportData.recommendedSurfaces?.outdoor || [];
  };

  const selectedSportData = sports.find((item) => item.code === sport);
  const canSelectIndoor = !selectedSportData || selectedSportData.allowsIndoor;
  const canSelectOutdoor = !selectedSportData || selectedSportData.allowsOutdoor;
  const availableSurfaces = getAvailableSurfaces(selectedSportData, indoor);
  const canChooseSurface = availableSurfaces.length > 1;

  const renderSportIcon = (sportCode: string, isSelected: boolean) => {
    const iconConfig = sportIcons[sportCode];
    if (!iconConfig) {
      return <Ionicons name='fitness-outline' size={16} color={isSelected ? 'white' : '#999'} />;
    }

    const IconComponent =
      iconConfig.library === 'FontAwesome5'
        ? FontAwesome5
        : iconConfig.library === 'FontAwesome6'
          ? FontAwesome6
          : Ionicons;

    return <IconComponent name={iconConfig.name as any} size={16} color={isSelected ? 'white' : '#999'} />;
  };

  const loadCampo = async () => {
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setName(data.name);
      setSport(typeof data.sport === 'string' ? data.sport : data.sport?.code || '');
      setSurface(data.surface);
      setMaxPlayers(data.maxPlayers?.toString() || '4');
      setIndoor(data.indoor || false);
      setIsActive(data.isActive ?? true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      showAlert({
        title: 'Errore',
        message: 'Impossibile caricare il campo',
        type: 'error',
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loadingSports) {
      showAlert({ title: 'Attendi', message: 'Caricamento sport in corso', type: 'info' });
      return;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      showAlert({ title: 'Errore', message: 'Inserisci il nome del campo', type: 'error' });
      return;
    }

    if (!selectedSportData) {
      showAlert({ title: 'Errore', message: 'Seleziona uno sport valido', type: 'error' });
      return;
    }

    if (!surface) {
      showAlert({ title: 'Errore', message: 'Seleziona una superficie', type: 'error' });
      return;
    }

    if (availableSurfaces.length > 0 && !availableSurfaces.includes(surface)) {
      showAlert({ title: 'Errore', message: 'La superficie selezionata non è valida per sport e ambiente scelti', type: 'error' });
      return;
    }

    const parsedMaxPlayers = parseInt(maxPlayers, 10);
    if (Number.isNaN(parsedMaxPlayers)) {
      showAlert({ title: 'Errore', message: 'Numero massimo giocatori non valido', type: 'error' });
      return;
    }

    if (parsedMaxPlayers < selectedSportData.minPlayers || parsedMaxPlayers > selectedSportData.maxPlayers) {
      showAlert({
        title: 'Errore',
        message: `I giocatori devono essere tra ${selectedSportData.minPlayers} e ${selectedSportData.maxPlayers}`,
        type: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: normalizedName, sport: selectedSportData._id, surface, maxPlayers: parsedMaxPlayers, indoor, isActive }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || result?.success === false) {
        showAlert({ title: 'Errore', message: result?.message || 'Errore nel salvataggio', type: 'error' });
        return;
      }

      showAlert({ title: 'Successo', message: 'Campo aggiornato', type: 'success', onConfirm: () => navigation.goBack() });
    } catch {
      showAlert({ title: 'Errore', message: 'Errore nel salvataggio', type: 'error' });
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

  const surfaceLabel = getSurfaceLabel();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={22} color='#333' />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Campo</Text>
        <Pressable onPress={handleSave} disabled={saving || loadingSports} style={({ pressed }) => [styles.saveHeaderButton, (saving || loadingSports) && styles.saveHeaderButtonDisabled, pressed && { opacity: 0.85 }]}> 
          {saving ? <ActivityIndicator size='small' color='white' /> : <Text style={styles.saveHeaderButtonText}>Salva</Text>}
        </Pressable>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={isActive ? ['#2196F3', '#1976D2'] : ['#F44336', '#E53935']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='football-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Sport</Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {loadingSports ? (
                <View style={styles.sportsLoadingContainer}>
                  <ActivityIndicator size='small' color='#2196F3' />
                  <Text style={styles.sportsLoadingText}>Caricamento sport...</Text>
                </View>
              ) : (
                sports.map((item) => (
                <Pressable key={item.code} style={[styles.chip, sport === item.code && styles.chipActive]} onPress={() => setSport(item.code)}>
                  {sport === item.code ? (
                    <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.chipGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      {renderSportIcon(item.code, true)}
                      <Text style={[styles.chipText, styles.chipTextActive]}>{item.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipInner}>
                      {renderSportIcon(item.code, false)}
                      <Text style={styles.chipText}>{item.name}</Text>
                    </View>
                  )}
                </Pressable>
              ))
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={indoor ? 'home-outline' : 'sunny-outline'} size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Ambiente</Text>
                <Text style={styles.sectionSubtitle}>Coperto/Scoperto</Text>
              </View>
            </View>
            <View style={styles.environmentChipsContainer}>
              <Pressable
                onPress={() => canSelectIndoor && setIndoor(true)}
                disabled={!canSelectIndoor}
                style={[styles.environmentChip, indoor && styles.environmentChipSelected, !canSelectIndoor && styles.environmentChipDisabled]}
              >
                <Ionicons name='home-outline' size={16} color={indoor ? '#fff' : '#2196F3'} />
                <Text style={[styles.environmentChipText, indoor && styles.environmentChipTextSelected]}>Indoor</Text>
              </Pressable>

              <Pressable
                onPress={() => canSelectOutdoor && setIndoor(false)}
                disabled={!canSelectOutdoor}
                style={[styles.environmentChip, !indoor && styles.environmentChipSelected, !canSelectOutdoor && styles.environmentChipDisabled]}
              >
                <Ionicons name='sunny-outline' size={16} color={!indoor ? '#fff' : '#2196F3'} />
                <Text style={[styles.environmentChipText, !indoor && styles.environmentChipTextSelected]}>Outdoor</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.sectionIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name='layers-outline' size={18} color='white' />
                </LinearGradient>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Superficie</Text>
                <Text style={styles.sectionSubtitle}>Scegli tra le superfici disponibili</Text>
              </View>
            </View>
            {availableSurfaces.length > 0 && (
              <View style={styles.surfaceChoicesContainer}>
                {availableSurfaces.map((surfaceCode) => {
                  const isSelected = surface === surfaceCode;
                  return (
                    <Pressable
                      key={surfaceCode}
                      onPress={() => canChooseSurface && setSurface(surfaceCode as SurfaceType)}
                      style={[styles.surfaceChoiceChip, isSelected && styles.surfaceChoiceChipSelected]}
                    >
                      {renderSurfaceIcon(surfaceCode, isSelected)}
                      <Text style={[styles.surfaceChoiceChipText, isSelected && styles.surfaceChoiceChipTextSelected]}>
                        {SURFACE_LABELS[surfaceCode] || surfaceCode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {availableSurfaces.length === 0 && (
              <View style={styles.noSurfaceContainer}>
                <Text style={styles.noSurfaceText}>Superficie corrente: {surfaceLabel}</Text>
              </View>
            )}
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
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  chip: { width: '48.5%', borderRadius: 14, overflow: 'hidden', backgroundColor: 'white', elevation: 3, marginBottom: 10 },
  chipActive: {},
  chipGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, paddingVertical: 8, paddingHorizontal: 8 },
  chipInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, paddingVertical: 8, paddingHorizontal: 8 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#999', flexShrink: 1, textAlign: 'center' },
  chipTextActive: { color: 'white' },
  sportsLoadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, elevation: 3 },
  sportsLoadingText: { fontSize: 13, color: '#666', fontWeight: '600' },
  switchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 18, elevation: 3 },
  switchCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  switchCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  switchCardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  switchCardSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  environmentChipsContainer: { flexDirection: 'row', gap: 10 },
  environmentChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 2,
  },
  environmentChipSelected: { backgroundColor: '#2196F3', borderColor: '#1976D2' },
  environmentChipDisabled: { opacity: 0.45 },
  environmentChipText: { fontSize: 13, fontWeight: '700', color: '#1976D2' },
  environmentChipTextSelected: { color: '#fff' },
  surfaceDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 18, elevation: 3 },
  surfaceIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  surfaceDisplayText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  surfaceAutoTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  surfaceAutoTagText: { fontSize: 10, fontWeight: '700', color: '#4CAF50', textTransform: 'uppercase', letterSpacing: 0.3 },
  surfaceManualTag: { backgroundColor: '#E3F2FD' },
  surfaceManualTagText: { color: '#1976D2' },
  surfaceChoicesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  surfaceChoiceChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#BBDEFB', paddingHorizontal: 14, paddingVertical: 10 },
  surfaceChoiceChipSelected: { backgroundColor: '#2196F3', borderColor: '#1976D2' },
  surfaceChoiceChipText: { fontSize: 13, fontWeight: '700', color: '#1976D2' },
  surfaceChoiceChipTextSelected: { color: '#fff' },
  noSurfaceContainer: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, elevation: 2 },
  noSurfaceText: { fontSize: 12, fontWeight: '600', color: '#666' },
});
