import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MatchHistoryCard from "./MatchHistoryCard";
import { styles } from "../styles";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.88;
const CARD_MARGIN = 10;

interface RecentMatchesCarouselProps {
  matches: any[];
  userId?: string;
  onPressMatch: (bookingId?: string) => void;
  onViewAll: () => void;
}

const RecentMatchesCarousel: React.FC<RecentMatchesCarouselProps> = ({
  matches,
  userId,
  onPressMatch,
  onViewAll,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!matches || matches.length === 0) {
    return (
      <View style={styles.emptyCarouselContainer}>
        <Ionicons name="stats-chart-outline" size={48} color="#ccc" />
        <Text style={styles.emptyCarouselText}>Nessuna partita recente</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));
    setCurrentIndex(index);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}>
      <MatchHistoryCard
        match={item}
        userId={userId}
        onPress={onPressMatch}
        style={styles.carouselCard}
      />
    </View>
  );

  return (
    <View style={styles.carouselSection}>
      <View style={styles.carouselHeader}>
        <Text style={styles.sectionTitle}>Ultime Partite</Text>
        
        <Pressable 
          style={styles.viewAllButton} 
          onPress={onViewAll}
        >
          <Text style={styles.viewAllText}>Tutte</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={matches}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="start"
        contentContainerStyle={styles.carouselContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <Text style={styles.carouselCounter}>
        {currentIndex + 1} di {matches.length}
      </Text>
    </View>
  );
};

export default RecentMatchesCarousel;