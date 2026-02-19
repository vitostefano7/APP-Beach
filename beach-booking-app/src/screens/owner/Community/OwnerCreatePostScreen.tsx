import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../../context/AuthContext';
import { Avatar } from '../../../components/Avatar';
import API_URL from '../../../config/api';
import { StyleSheet } from 'react-native';

interface Struttura {
  _id: string;
  name: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
}

export default function OwnerCreatePostScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [selectedStrutturaId, setSelectedStrutturaId] = useState<string>('');
  const [loadingStrutture, setLoadingStrutture] = useState(true);
  const [showStrutturaModal, setShowStrutturaModal] = useState(false);

  // Carica le strutture dell'owner
  useEffect(() => {
    loadStrutture();
  }, []);

  const loadStrutture = async () => {
    try {
      setLoadingStrutture(true);
      const response = await fetch(`${API_URL}/owner/strutture`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStrutture(data);
        
        // Seleziona automaticamente la prima struttura se disponibile
        if (data.length > 0) {
          setSelectedStrutturaId(data[0]._id);
        }
      } else {
        Alert.alert('Errore', 'Impossibile caricare le tue strutture');
      }
    } catch (error) {
      console.error('Errore caricamento strutture:', error);
      Alert.alert('Errore', 'Errore nel caricamento delle strutture');
    } finally {
      setLoadingStrutture(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permessi necessari',
          'Abbiamo bisogno dei permessi per accedere alla tua galleria'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Errore selezione immagine:', error);
      Alert.alert('Errore', 'Impossibile selezionare l\'immagine');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permessi necessari',
          'Abbiamo bisogno dei permessi per accedere alla fotocamera'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Errore scatto foto:', error);
      Alert.alert('Errore', 'Impossibile scattare la foto');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Aggiungi foto',
      'Scegli come vuoi aggiungere una foto',
      [
        {
          text: 'Scatta foto',
          onPress: handleTakePhoto,
        },
        {
          text: 'Scegli dalla galleria',
          onPress: handlePickImage,
        },
        {
          text: 'Annulla',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('Attenzione', 'Scrivi qualcosa o aggiungi una foto');
      return;
    }

    if (!selectedStrutturaId) {
      Alert.alert('Attenzione', 'Seleziona una struttura per cui pubblicare');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('strutturaId', selectedStrutturaId);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(`${API_URL}/community/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Successo', 'Post pubblicato con successo!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        throw new Error(error.message || 'Errore nella pubblicazione');
      }
    } catch (error: any) {
      Alert.alert(
        'Errore',
        error.message || 'Impossibile pubblicare il post. Riprova.'
      );
    } finally {
      setUploading(false);
    }
  };

  const canPost = (content.trim().length > 0 || selectedImage) && !uploading && selectedStrutturaId;

  const selectedStruttura = strutture.find((s) => s._id === selectedStrutturaId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            disabled={uploading}
          >
            <Ionicons name="close" size={28} color="#212121" />
          </Pressable>

          <Text style={styles.headerTitle}>Nuovo Post</Text>

          <Pressable
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!canPost}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  !canPost && styles.postButtonTextDisabled,
                ]}
              >
                Pubblica
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Struttura Selection */}
          {loadingStrutture ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Caricamento strutture...</Text>
            </View>
          ) : strutture.length === 0 ? (
            <View style={styles.noStruttureContainer}>
              <Ionicons name="business-outline" size={48} color="#999" />
              <Text style={styles.noStruttureText}>
                Non hai ancora creato nessuna struttura
              </Text>
              <Pressable
                style={styles.createStrutturaButton}
                onPress={() => navigation.navigate('CreaStruttura')}
              >
                <Text style={styles.createStrutturaButtonText}>Crea Struttura</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.strutturaSelectorContainer}>
                <Text style={styles.strutturaSelectorLabel}>Pubblica per:</Text>
                <Pressable
                  style={styles.strutturaSelectorButton}
                  onPress={() => setShowStrutturaModal(true)}
                  disabled={uploading}
                >
                  <Text style={styles.strutturaSelectorButtonText}>
                    {selectedStruttura?.name || 'Seleziona una struttura'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </Pressable>
              </View>

              {/* Struttura Info */}
              {selectedStruttura && (
                <View style={styles.strutturaInfo}>
                  {selectedStruttura.images[0] && (
                    <Image
                      source={{ uri: selectedStruttura.images[0] }}
                      style={styles.strutturaImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.strutturaDetails}>
                    <Ionicons name="business" size={20} color="#2196F3" />
                    <View style={styles.strutturaTextContainer}>
                      <Text style={styles.strutturaName}>{selectedStruttura.name}</Text>
                      <Text style={styles.strutturaLocation}>
                        {selectedStruttura.location.city}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Content Input */}
              <TextInput
                style={styles.input}
                placeholder="Cosa vuoi condividere sulla tua struttura?"
                placeholderTextColor="#999"
                multiline
                value={content}
                onChangeText={setContent}
                editable={!uploading}
                autoFocus
                maxLength={1000}
              />

              {/* Character Counter */}
              <Text style={styles.characterCounter}>{content.length}/1000</Text>

              {/* Selected Image Preview */}
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    disabled={uploading}
                  >
                    <Ionicons name="close-circle" size={32} color="#fff" />
                  </Pressable>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Text style={styles.actionsTitle}>Aggiungi al post</Text>

                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={handleImageOptions}
                    disabled={uploading}
                  >
                    <Ionicons name="image" size={24} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Foto</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Struttura Selection Modal */}
      <Modal
        visible={showStrutturaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStrutturaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Struttura</Text>
              <Pressable onPress={() => setShowStrutturaModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            
            <FlatList
              data={strutture}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.strutturaModalItem,
                    selectedStrutturaId === item._id && styles.strutturaModalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedStrutturaId(item._id);
                    setShowStrutturaModal(false);
                  }}
                >
                  {item.images[0] && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.strutturaModalImage}
                    />
                  )}
                  <View style={styles.strutturaModalInfo}>
                    <Text style={styles.strutturaModalName}>{item.name}</Text>
                    <Text style={styles.strutturaModalLocation}>{item.location.city}</Text>
                  </View>
                  {selectedStrutturaId === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  postButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: '#999',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  noStruttureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noStruttureText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createStrutturaButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createStrutturaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  strutturaSelectorContainer: {
    marginBottom: 16,
  },
  strutturaSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  strutturaSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  strutturaSelectorButtonText: {
    fontSize: 16,
    color: '#212121',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  strutturaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  strutturaImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  strutturaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  strutturaTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  strutturaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  strutturaLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  input: {
    fontSize: 16,
    color: '#212121',
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  imagePreviewContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  actionsContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  strutturaModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  strutturaModalItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  strutturaModalImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  strutturaModalInfo: {
    flex: 1,
  },
  strutturaModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  strutturaModalLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
