import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from './AnimatedComponents';

interface BookingHeaderProps {
  onBack: () => void;
  title: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  cancellingBooking?: boolean;
}

export const BookingHeader: React.FC<BookingHeaderProps> = ({
  onBack,
  title,
  showCancelButton = false,
  onCancel,
  cancellingBooking = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <AnimatedButton style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#2196F3" />
          </AnimatedButton>
        </View>
        
        <Text style={styles.title} numberOfLines={1}> 
          {title}
        </Text>

        {showCancelButton && onCancel ? (
          <Pressable
            onPress={onCancel}
            disabled={cancellingBooking}
            style={styles.headerCancelButton}
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={22} color="#F44336" />
          </Pressable>
        ) : (
          <View style={styles.rightSection} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: 40,
  },
  backButton: {
    padding: 0,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  rightSection: {
    width: 40,
  },
  headerCancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
