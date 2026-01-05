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
}

const BookingDetailsCard: React.FC<BookingDetailsCardProps> = ({
  date,
  startTime,
  endTime,
  duration,
  price,
  createdAt,
}) => {
  const formatDateTime = (dateStr: string, time: string) => {
    const [day, month, year] = dateStr.split('/');
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}, ${time}`;
  };

  const formatBookingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dettagli Prenotazione</Text>
      
      <View style={styles.grid}>
        {/* Data e Ora */}
        <FadeInView delay={100} style={styles.gridItem}>
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
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
              <Ionicons name="time" size={20} color="#FF9800" />
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
              <Ionicons name="cash" size={20} color="#4CAF50" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>PREZZO</Text>
              <Text style={[styles.itemValue, styles.priceValue]}>
                €{price.toFixed(2)}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Data Prenotazione */}
        <FadeInView delay={400} style={styles.gridItem}>
          <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#9C27B0" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>PRENOTATO IL</Text>
              <Text style={styles.itemValue}>
                {formatBookingDate(createdAt)}
              </Text>
            </View>
          </View>
        </FadeInView>
      </View>

      {/* Orario completo in basso */}
      <FadeInView delay={500}>
        <View style={styles.timeRangeContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.timeRangeText}>
            {startTime} - {endTime}
          </Text>
        </View>
      </FadeInView>
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
    padding: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  itemValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  priceValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '800',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

export default BookingDetailsCard;