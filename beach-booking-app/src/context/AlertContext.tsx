import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  hideButtons?: boolean;
  disableBackdropClose?: boolean;
  autoCloseMs?: number;
  onAutoClose?: () => void;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert deve essere usato all\'interno di AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  });
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [translateYAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const showAlert = (options: AlertOptions) => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    setAlertOptions(options);
    setVisible(true);
    
    // Reset animations
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    translateYAnim.setValue(-50);
    
    // Parallel animations for smooth entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    if (options.autoCloseMs && options.autoCloseMs > 0) {
      autoCloseTimerRef.current = setTimeout(() => {
        if (options.onAutoClose) {
          options.onAutoClose();
        }
        hideAlert();
      }, options.autoCloseMs);
    }
  };

  const hideAlert = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setAlertOptions({
        title: '',
        message: '',
        type: 'info',
      });
    });
  };

  const handleConfirm = () => {
    if (alertOptions.onConfirm) {
      alertOptions.onConfirm();
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alertOptions.onCancel) {
      alertOptions.onCancel();
    }
    hideAlert();
  };

  const handleCustomButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    hideAlert();
  };

  const getIconAndColor = () => {
    switch (alertOptions.type) {
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
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={
          alertOptions.showCancel || alertOptions.disableBackdropClose || alertOptions.hideButtons || (alertOptions.buttons?.length || 0) > 0
            ? () => {}
            : hideAlert
        }
      >
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable 
            style={StyleSheet.absoluteFill}
            onPress={
              alertOptions.showCancel || alertOptions.disableBackdropClose || alertOptions.hideButtons || (alertOptions.buttons?.length || 0) > 0
                ? undefined
                : hideAlert
            }
          />
          <Animated.View 
            style={[
              styles.alertContainer,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: translateYAnim },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
                  <Ionicons name={icon as any} size={50} color={color} />
                </View>
              </View>

              <Text style={styles.title}>{alertOptions.title}</Text>
              <Text style={styles.message}>{alertOptions.message}</Text>

              {!alertOptions.hideButtons && (
                <View style={styles.buttonContainer}>
                  {(alertOptions.buttons?.length || 0) > 0 ? (
                    alertOptions.buttons!.map((button, index) => {
                      const isCancel = button.style === 'cancel';
                      const isDestructive = button.style === 'destructive';

                      return (
                        <Pressable
                          key={`${button.text}-${index}`}
                          style={[
                            styles.button,
                            isCancel
                              ? styles.cancelButton
                              : styles.confirmButton,
                            isDestructive && styles.destructiveButton,
                          ]}
                          onPress={() => handleCustomButtonPress(button)}
                          android_ripple={{ color: isCancel ? '#e0e0e0' : 'rgba(255,255,255,0.3)' }}
                        >
                          <Text
                            style={[
                              isCancel ? styles.cancelButtonText : styles.confirmButtonText,
                            ]}
                          >
                            {button.text}
                          </Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    <>
                      {alertOptions.showCancel && (
                        <Pressable
                          style={[styles.button, styles.cancelButton]}
                          onPress={handleCancel}
                          android_ripple={{ color: '#e0e0e0' }}
                        >
                          <Text style={styles.cancelButtonText}>
                            {alertOptions.cancelText || 'Annulla'}
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[
                          styles.button,
                          styles.confirmButton,
                          { backgroundColor: color },
                          alertOptions.showCancel && { flex: 1 }
                        ]}
                        onPress={handleConfirm}
                        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        <Text style={styles.confirmButtonText}>
                          {alertOptions.confirmText || 'OK'}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: '#f44336',
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
