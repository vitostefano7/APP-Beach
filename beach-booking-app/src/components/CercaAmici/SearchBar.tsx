import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export default function SearchBar({
  placeholder = 'Cerca...',
  value,
  onChangeText,
  onClear,
  showClearButton = false,
}: SearchBarProps) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color="#999" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showClearButton && onClear && (
        <Pressable onPress={onClear} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
});
