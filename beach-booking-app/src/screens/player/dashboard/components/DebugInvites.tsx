// components/DebugInvites.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from "react-native";
import { styles } from "../styles";

interface DebugInvitesProps {
  pendingInvites: any[];
  user: any;
  onReload: () => void;
}

const DebugInvites: React.FC<DebugInvitesProps> = ({ pendingInvites, user, onReload }) => {
  return (
    <View style={styles.debugSection}>
      <Text style={styles.debugTitle}>DEBUG INVITI - User ID: {user?.id}</Text>
      <Text style={styles.debugText}>
        Inviti trovati: {pendingInvites.length}
      </Text>
      
      {pendingInvites.length > 0 && (
        <ScrollView style={{ maxHeight: 200 }}>
          {pendingInvites.map((invite, index) => {
            const match = invite.match || invite;
            const myPlayer = match.players?.find((p: any) => p.user._id === user?.id);
            
            return (
              <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff8e1', borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333' }}>
                  Invito {index + 1}
                </Text>
                <Text style={{ fontSize: 9, color: '#666' }}>
                  Match ID: {match._id}
                </Text>
                <Text style={{ fontSize: 9, color: '#666' }}>
                  Match Status: {match.status}
                </Text>
                <Text style={{ fontSize: 9, color: '#666' }}>
                  Creato da: {match.createdBy?.name}
                </Text>
                {myPlayer && (
                  <Text style={{ fontSize: 9, color: '#2196F3', fontWeight: 'bold' }}>
                    Mio stato: {myPlayer.status}
                  </Text>
                )}
                {match.booking && (
                  <Text style={{ fontSize: 9, color: '#4CAF50' }}>
                    Prenotazione: {match.booking.date} {match.booking.startTime}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
      
      <Pressable 
        style={styles.debugButton}
        onPress={onReload}
      >
        <Text style={styles.debugButtonText}>Ricarica Dati</Text>
      </Pressable>
    </View>
  );
};

export default DebugInvites;