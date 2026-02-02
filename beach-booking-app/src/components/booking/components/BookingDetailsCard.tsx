import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInView } from './AnimatedComponents';

interface BookingDetailsCardProps {
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  price: number;
  createdAt: string;
  isPublic?: boolean;
  displayPrice?: number;
}

export const BookingDetailsCard: React.FC<BookingDetailsCardProps> = ({
  date,
  startTime,
  endTime,
  duration,
  price,
  createdAt,
  isPublic,
  displayPrice,
}) => {
  const formatDateTime = (dateStr: string, time: string) => {
    try {
      let dateObj: Date;
      if (dateStr.includes('-')) {
        dateObj = new Date(dateStr + 'T12:00:00');
      } else if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        return `${dateStr}, ${time}`;
      }

      if (isNaN(dateObj.getTime())) {
        return `${dateStr}, ${time}`;
      }

      const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      const day = dateObj.getDate();
      const monthName = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return `${day} ${monthName} ${year}, ${time}`;
    } catch (error) {
      return `${dateStr}, ${time}`;
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dettagli Prenotazione</Text>
      
      <View style={styles.grid}>
        {/* Data e Ora */}
        <FadeInView delay={100} style={styles.gridItem}>
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={18} color="#2196F3" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>DATA E ORA</Text>
              <Text style={styles.itemValue}>
                {formatDateTime(date, startTime)}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Durata */}
        <FadeInView delay={200} style={styles.gridItem}>
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="time" size={18} color="#FF9800" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>DURATA</Text>
              <Text style={styles.itemValue}>{duration}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Prezzo */}
        <FadeInView delay={300} style={styles.gridItem}>
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="cash" size={18} color="#4CAF50" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>PREZZO</Text>
              <Text style={[styles.itemValue, styles.priceValue]}>
                {formatPrice(displayPrice ?? price)}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Visibilità Partita */}
        {isPublic !== undefined && (
          <FadeInView delay={500} style={styles.gridItem}>
            <View style={styles.itemContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isPublic ? "globe-outline" : "lock-closed"}
                  size={18}
                  color={isPublic ? "#03A9F4" : "#FF5722"}
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemLabel}>Tipo di Partita</Text>
                <Text style={styles.itemValue}>
                  {isPublic ? "Aperta" : "Privata"}
                </Text>
              </View>
            </View>
          </FadeInView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  itemContent: {
    padding: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemInfo: {
    gap: 4,
  },
  itemLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  itemValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  priceValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '800',
  },
});
