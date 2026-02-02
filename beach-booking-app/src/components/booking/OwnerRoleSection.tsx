import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar/Avatar';
import BookingDetailsCard from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/BookingDetailsCard';
import { AnimatedCard, FadeInView } from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/AnimatedComponents';
import { calculateDuration } from '../../screens/player/prenotazioni/DettaglioPrenotazione/utils/DettaglioPrenotazione.utils';
import styles from '../../screens/player/prenotazioni/DettaglioPrenotazione/styles/DettaglioPrenotazione.styles';

interface OwnerRoleSectionProps {
  booking: any;
  setShowClientProfile: (show: boolean) => void;
  openChat: () => void;
}

const OwnerRoleSection: React.FC<OwnerRoleSectionProps> = ({
  booking,
  setShowClientProfile,
  openChat,
}) => {
  return (
    <>
      <AnimatedCard delay={150}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={18} color="#2196F3" />
          <Text style={[styles.cardTitle, { fontSize: 16 }]}>Cliente</Text>
        </View>

        <View style={styles.clientCard}>
          <Pressable
            style={styles.clientInfoPressable}
            onPress={() => setShowClientProfile(true)}
          >
            <Avatar
              name={booking.user?.name}
              surname={booking.user?.surname}
              avatarUrl={booking.user?.avatarUrl}
              size={40}
              fallbackIcon="person"
            />
            <View style={styles.clientInfo}>
              <Text style={[styles.clientName, { fontSize: 16 }]}>
                {booking.user?.name || "Utente"} {booking.user?.surname || ""}
              </Text>
              {booking.user?.email && (
                <Text style={[styles.clientEmail, { fontSize: 14 }]}>
                  {booking.user.email}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>

          <Pressable style={styles.chatButtonInline} onPress={openChat}>
            <Ionicons name="chatbubble-outline" size={18} color="#2196F3" />
          </Pressable>
        </View>
      </AnimatedCard>

      {/* NUOVA CARD DETTAGLI - USA BookingDetailsCard */}
      <AnimatedCard delay={200}>
        <BookingDetailsCard
          date={booking.date}
          startTime={booking.startTime}
          endTime={booking.endTime}
          duration={calculateDuration(booking.startTime, booking.endTime)}
          price={booking.price}
          createdAt={booking.createdAt}
        />
      </AnimatedCard>
    </>
  );
};

export default OwnerRoleSection;