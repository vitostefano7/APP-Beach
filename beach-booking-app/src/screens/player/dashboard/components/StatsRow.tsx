import React from 'react';
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

interface StatsRowProps {
  stats: {
    totalMatches: number;
    wins: number;
    winRate: number;
  };
}

const StatsRow: React.FC<StatsRowProps> = ({ stats }) => {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Ionicons name="trophy" size={20} color="#FFD700" />
        <Text style={styles.statValue}>{stats.wins}</Text>
        <Text style={styles.statLabel}>Vittorie</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="star" size={20} color="#FF9800" />
        <Text style={styles.statValue}>{stats.winRate}%</Text>
        <Text style={styles.statLabel}>Win Rate</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="flash" size={20} color="#4CAF50" />
        <Text style={styles.statValue}>{stats.totalMatches}</Text>
        <Text style={styles.statLabel}>Partite</Text>
      </View>
    </View>
  );
};

export default StatsRow;