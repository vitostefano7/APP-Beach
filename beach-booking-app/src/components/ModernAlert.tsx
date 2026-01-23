import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModernAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ModernAlert: React.FC<ModernAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  showCancel = false,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Annulla',
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#4CAF50' };
      case 'warning':
        return { icon: 'warning', color: '#FF9800' };
      case 'error':
        return { icon: 'close-circle', color: '#f44336' };
      default:
        return { icon: 'information-circle', color: '#2196F3' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
      >
        <Pressable 
          style={styles.alertContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
              <Ionicons name={icon as any} size={48} color={color} />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {showCancel && (
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel || onClose}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.button, styles.confirmButton, { backgroundColor: color }]}
              onPress={onClose}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ModernAlert;
