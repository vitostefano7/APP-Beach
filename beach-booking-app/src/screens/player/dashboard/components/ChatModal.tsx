// components/ChatModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import ConversationsList from './ConversationsList';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose }) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(modalSlide, {
            toValue: 1,
            bounciness: 10,
            speed: 8,
            useNativeDriver: true,
          }),
          Animated.spring(modalScale, {
            toValue: 1,
            bounciness: 8,
            speed: 10,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      closeModal();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalSlide, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const modalTranslateY = modalSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalOpacity,
              transform: [
                { translateY: modalTranslateY },
                { scale: modalScale },
              ],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header del modal con X e "Messaggi" */}
          <View style={styles.chatModalHeader}>
            <Pressable 
              onPress={closeModal}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>

            <Text style={styles.chatModalTitle}>Messaggi</Text>

            <View style={{ width: 40 }} />
          </View>

          {/* Lista conversazioni - senza header duplicato */}
          <ConversationsList onCloseModal={closeModal} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ChatModal;