import React, { ReactNode, useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInput,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ChildrenProp = ((searchText: string) => ReactNode) | ReactNode;

interface FilterModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ChildrenProp;
  cancelText?: string;
  showCancelButton?: boolean;
  contentScrollable?: boolean;
  closeOnOverlayPress?: boolean;
  modalStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Cerca...",
}: FilterModalProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Reset ricerca quando il modal viene chiuso
  useEffect(() => {
    if (!visible) {
      setSearchOpen(false);
      setSearchText("");
    }
  }, [visible]);

  const handleToggleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchText("");
      Keyboard.dismiss();
    } else {
      setSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const resolvedChildren =
    typeof children === "function" ? children(searchText) : children;

  const content = contentScrollable ? (
    <ScrollView
      style={[styles.filterModalContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {resolvedChildren}
    </ScrollView>
  ) : (
    <View style={[styles.filterModalContent, contentContainerStyle]}>{resolvedChildren}</View>
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
            {/* Spacer sinistro per centrare il titolo */}
            <View style={styles.filterModalHeaderSide} />
            <View style={styles.filterModalHeaderCenter}>
              <Text style={styles.filterModalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.filterModalSubtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.filterModalHeaderSide}>
              {searchable && (
                <Pressable onPress={handleToggleSearch} style={styles.searchIconButton}>
                  <Ionicons
                    name={searchOpen ? "close" : "search"}
                    size={22}
                    color="white"
                  />
                </Pressable>
              )}
            </View>
          </View>

          {searchable && searchOpen && (
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color="#999" style={styles.searchBarIcon} />
              <TextInput
                ref={inputRef}
                style={styles.searchBarInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder={searchPlaceholder}
                placeholderTextColor="#bbb"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={18} color="#bbb" />
                </Pressable>
              )}
            </View>
          )}

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#2196F3",
    minHeight: 70,
  },
  filterModalHeaderSide: {
    width: 40,
    alignItems: "flex-end",
  },
  filterModalHeaderCenter: {
    flex: 1,
    alignItems: "center",
  },
  searchIconButton: {
    padding: 6,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#dce8ff",
  },
  searchBarIcon: {
    marginRight: 6,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
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
