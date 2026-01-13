import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  ViewToken,
} from "react-native";
import { StatsCard, StatsCardType } from "./StatsCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH;

interface StatsCarouselProps {
  performanceData: any;
  socialData: any;
  venuesData: any;
  loading?: boolean;
}

interface CardData {
  id: string;
  type: StatsCardType;
  data: any;
}

export const StatsCarousel: React.FC<StatsCarouselProps> = ({
  performanceData,
  socialData,
  venuesData,
  loading = false,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Caricamento statistiche...</Text>
      </View>
    );
  }

  // Costruisci l'array di card da mostrare
  const cards: CardData[] = [];

  if (performanceData?.matchesPlayed > 0) {
    cards.push({ id: "performance", type: "performance", data: performanceData });
  }

  if (socialData?.totalPeopleMet > 0) {
    cards.push({ id: "social", type: "social", data: socialData });
  }

  if (venuesData?.totalVenues > 0) {
    cards.push({ id: "venues", type: "venues", data: venuesData });
  }

  // Se non ci sono dati, non mostrare nulla
  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Nessuna statistica</Text>
        <Text style={styles.emptyText}>
          Inizia a giocare partite per vedere le tue statistiche qui!
        </Text>
      </View>
    );
  }

  const renderCard = ({ item }: { item: CardData }) => (
    <View style={styles.cardWrapper}>
      <StatsCard type={item.type} data={item.data} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Le tue statistiche</Text>
        <Text style={styles.subtitle}>Scorri per vedere tutte</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.scrollContent}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
      />

      {/* Pagination Indicators */}
      {cards.length > 1 && (
        <View style={styles.pagination}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
  },
  scrollContent: {
    paddingVertical: 4,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    transition: "all 0.3s",
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: "#FF6B35",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    marginHorizontal: 20,
    borderRadius: 16,
    marginVertical: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
