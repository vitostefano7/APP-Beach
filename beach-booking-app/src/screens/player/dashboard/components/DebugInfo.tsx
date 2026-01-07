import React from 'react';
import { View, Text, Pressable } from "react-native";
import { styles } from "../styles"
import { formatDate } from "../utils/dateFormatter";

interface DebugInfoProps {
  user: any;
  nextBooking: any;
  pendingInvites: any[];
  recentMatches: any[];
  loadDashboardData: () => void;
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  user,
  nextBooking,
  pendingInvites,
  recentMatches,
  loadDashboardData,
}) => {
  return (
    <View style={styles.debugSection}>
      <Text style={styles.debugTitle}>DEBUG INFO - User: {user?.name}</Text>
      <Text style={styles.debugText}>
        User ID: {user?.id}
      </Text>
      <Text style={styles.debugText}>
        Prenotazioni future: {nextBooking ? "1" : "0"}
      </Text>
      <Text style={styles.debugText}>
        Inviti pendenti: {pendingInvites.length}
      </Text>
      <Text style={styles.debugText}>
        Match recenti: {recentMatches.length}
      </Text>
      {nextBooking && (
        <Text style={styles.debugText}>
          Prossima: {nextBooking.date} ({formatDate(nextBooking.date)})
        </Text>
      )}
      <Pressable 
        style={styles.debugButton}
        onPress={() => {
          console.log("=== MANUAL DEBUG TRIGGER ===");
          console.log("Pending invites array:", pendingInvites);
          loadDashboardData();
        }}
      >
        <Text style={styles.debugButtonText}>Debug Inviti</Text>
      </Pressable>
    </View>
  );
};

export default DebugInfo;