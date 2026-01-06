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

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(modalSlide, {
          toValue: 1,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      closeModal();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(modalSlide, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const modalTranslateY = modalSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.modalBackdrop, { opacity: modalOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalOpacity,
              transform: [{ translateY: modalTranslateY }],
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