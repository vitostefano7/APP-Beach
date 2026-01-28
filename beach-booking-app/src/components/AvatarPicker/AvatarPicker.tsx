import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AvatarPicker.styles';

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
  onRemovePhoto?: () => void;
  hasPhoto: boolean;
}

function AvatarPicker({
  visible,
  onClose,
  onSelectGallery,
  onSelectCamera,
  onRemovePhoto,
  hasPhoto,
}: AvatarPickerProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Immagine profilo</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.options}>
            <Pressable
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
              onPress={() => {
                handleClose();
                setTimeout(onSelectGallery, 300);
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="images" size={24} color="#2196F3" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Scegli dalla galleria</Text>
                <Text style={styles.optionSubtitle}>
                  Seleziona una foto esistente
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
              onPress={() => {
                handleClose();
                setTimeout(onSelectCamera, 300);
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="camera" size={24} color="#4CAF50" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Scatta una foto</Text>
                <Text style={styles.optionSubtitle}>
                  Usa la fotocamera del dispositivo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </Pressable>

            {hasPhoto && onRemovePhoto && (
              <>
                <View style={styles.divider} />

                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    handleClose();
                    setTimeout(onRemovePhoto, 300);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="trash-outline" size={24} color="#F44336" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: '#F44336' }]}>
                      Rimuovi foto
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Torna all'immagine predefinita
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>
              </>
            )}
          </View>

          {/* Safe area bottom */}
          <View style={styles.safeArea} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default AvatarPicker;
