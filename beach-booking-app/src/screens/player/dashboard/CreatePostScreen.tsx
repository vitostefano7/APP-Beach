import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../../context/AuthContext';
import { Avatar } from '../../../components/Avatar';
import { styles } from './styles/CreatePostScreen.styles';
import API_URL from '../../../config/api';
import { useAlert } from '../../../context/AlertContext';

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { showAlert } = useAlert();

  const handlePickImage = async () => {
    try {
      // Richiedi permessi
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showAlert({
          type: 'warning',
          title: 'Permessi necessari',
          message: 'Abbiamo bisogno dei permessi per accedere alla tua galleria',
        });
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
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile selezionare l\'immagine',
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Richiedi permessi camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        showAlert({
          type: 'warning',
          title: 'Permessi necessari',
          message: 'Abbiamo bisogno dei permessi per accedere alla fotocamera',
        });
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
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile scattare la foto',
      });
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
    console.log('========================================');
    console.log('📤 INIZIO PUBBLICAZIONE POST');
    console.log('========================================');

    if (!content.trim() && !selectedImage) {
      console.log('❌ Validazione fallita: nessun contenuto o immagine');
      showAlert({
        type: 'warning',
        title: 'Attenzione',
        message: 'Scrivi qualcosa o aggiungi una foto',
      });
      return;
    }

    console.log('📋 DATI POST:');
    console.log('  Content:', content);
    console.log('  Content length:', content.length);
    console.log('  Has image:', !!selectedImage);
    console.log('  User ID:', user?.id);
    console.log('  User name:', user?.name);
    console.log('  Token presente:', !!token);

    try {
      setUploading(true);
      console.log('\n🔨 COSTRUZIONE FORMDATA:');

      const formData = new FormData();
      formData.append('content', content.trim());
      console.log('  ✅ Content aggiunto:', content.trim().substring(0, 50) + '...');

      // Upload immagine se presente
      if (selectedImage) {
        console.log('\n🖼️  PREPARAZIONE IMMAGINE:');
        const filename = selectedImage.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        console.log('  Filename:', filename);
        console.log('  Type:', type);
        console.log('  URI:', selectedImage);

        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
        console.log('  ✅ Immagine aggiunta al FormData');
      }

      console.log('\n📡 INVIO RICHIESTA API:');
      const url = `${API_URL}/community/posts`;
      console.log('  URL:', url);
      console.log('  Method: POST');
      console.log('  Headers: Authorization Bearer [token]');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Non impostare Content-Type, verrà gestito automaticamente per FormData
        },
        body: formData,
      });

      console.log('\n📥 RISPOSTA RICEVUTA:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('\n✅ POST CREATO CON SUCCESSO!');
        console.log('  Response data:', JSON.stringify(data, null, 2));
        console.log('  Post ID:', data.post?._id);
        console.log('  Post content:', data.post?.content);
        console.log('  Post user:', data.post?.user?.name);
        console.log('========================================\n');

        showAlert({
          type: 'success',
          title: 'Successo',
          message: 'Post pubblicato con successo!',
          buttons: [
            {
              text: 'OK',
              onPress: () => {
                console.log('🔙 Navigazione indietro alla Community');
                navigation.goBack();
              },
            },
          ],
        });
      } else {
        const errorText = await response.text();
        console.error('\n❌ ERRORE RISPOSTA API:');
        console.error('  Status:', response.status);
        console.error('  Response text:', errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }

        console.error('  Error message:', error.message);
        console.error('========================================\n');
        throw new Error(error.message || 'Errore nella pubblicazione');
      }
    } catch (error: any) {
      console.error('\n========================================');
      console.error('❌ ERRORE CATCH PUBBLICAZIONE POST:');
      console.error('  Nome:', error.name);
      console.error('  Messaggio:', error.message);
      console.error('  Stack:', error.stack);
      console.error('========================================\n');

      showAlert({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Impossibile pubblicare il post. Riprova.',
      });
    } finally {
      setUploading(false);
      console.log('🏁 Fine processo pubblicazione\n');
    }
  };

  const canPost = (content.trim().length > 0 || selectedImage) && !uploading;

  return (
    <>
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
          {/* User Info */}
          <View style={styles.userSection}>
            <Avatar avatarUrl={user?.avatarUrl} name={user?.name} size={48} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.visibilityBadge}>
                <Ionicons name="globe-outline" size={14} color="#666" />
                <Text style={styles.visibilityText}>Pubblico</Text>
              </View>
            </View>
          </View>

          {/* Content Input */}
          <TextInput
            style={styles.input}
            placeholder="Cosa vuoi condividere?"
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
            <Text style={styles.actionsTitle}>Aggiungi al tuo post</Text>

            <View style={styles.actionButtons}>
              <Pressable
                style={styles.actionButton}
                onPress={handleImageOptions}
                disabled={uploading}
              >
                <Ionicons name="image" size={24} color="#2196F3" />
                <Text style={styles.actionButtonText}>Foto</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.actionButtonDisabled]}
                disabled
              >
                <Ionicons name="location" size={24} color="#ccc" />
                <Text style={[styles.actionButtonText, { color: '#ccc' }]}>
                  Posizione
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.actionButtonDisabled]}
                disabled
              >
                <Ionicons name="pricetag" size={24} color="#ccc" />
                <Text style={[styles.actionButtonText, { color: '#ccc' }]}>
                  Tag
                </Text>
              </Pressable>
            </View>

            <Text style={styles.comingSoonText}>
              Alcune funzionalità saranno disponibili a breve
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}
