import React, { ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

interface FilterModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  cancelText?: string;
  showCancelButton?: boolean;
  contentScrollable?: boolean;
  closeOnOverlayPress?: boolean;
  modalStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}

export default function FilterModal({
  visible,
  title,
  subtitle,
  onClose,
  children,
  cancelText = "Annulla",
  showCancelButton = true,
  contentScrollable = false,
  closeOnOverlayPress = false,
  modalStyle,
  contentContainerStyle,
  footer,
}: FilterModalProps) {
  const content = contentScrollable ? (
    <ScrollView
      style={[styles.filterModalContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.filterModalContent, contentContainerStyle]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.centeredModalOverlay}
        onPress={closeOnOverlayPress ? onClose : undefined}
      >
        <Pressable style={[styles.filterModal, modalStyle]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>{title}</Text>
            {subtitle ? <Text style={styles.filterModalSubtitle}>{subtitle}</Text> : null}
          </View>

          {content}

          {footer ? (
            footer
          ) : showCancelButton ? (
            <View style={styles.filterModalFooter}>
              <Pressable style={styles.filterModalCancel} onPress={onClose}>
                <Text style={styles.filterModalCancelText}>{cancelText}</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    backgroundColor: "white",
    borderRadius: 20,
    marginHorizontal: 40,
    width: "85%",
    maxHeight: "75%",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  filterModalHeader: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#2196F3",
    minHeight: 70,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  filterModalSubtitle: {
    fontSize: 12,
    color: "#E3F2FD",
    marginTop: 4,
    fontStyle: "italic",
  },
  filterModalContent: {
    maxHeight: 350,
    paddingTop: 8,
    backgroundColor: "white",
  },
  filterModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
  },
  filterModalCancel: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  filterModalCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "700",
  },
});
