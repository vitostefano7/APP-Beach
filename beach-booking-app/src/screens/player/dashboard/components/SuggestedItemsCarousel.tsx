// SuggestedItemsCarousel.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SuggestedFriendCard } from "../../../../components/CercaAmici/SuggestedFriendCard";
import { SuggestedStrutturaCard } from "./SuggestedStrutturaCard";
import { styles } from "../styles";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_MARGIN = 8;

interface SuggestedItem {
  type: 'friend' | 'struttura';
  data: any;
  score: number;
}

interface SuggestedItemsCarouselProps {
  items: SuggestedItem[];
  onPressFriend: (friend: any) => void;
  onInviteFriend: (friendId: string) => void;
  onPressStruttura: (struttura: any) => void;
  onFollowStruttura: (strutturaId: string) => void;
  onViewAll?: () => void;
}

export const SuggestedItemsCarousel: React.FC<SuggestedItemsCarouselProps> = ({
  items,
  onPressFriend,
  onInviteFriend,
  onPressStruttura,
  onFollowStruttura,
  onViewAll,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyCarouselContainer}>
        <Ionicons name="people-outline" size={48} color="#ccc" />
        <Text style={styles.emptyCarouselText}>
          Nessun suggerimento al momento
        </Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));
    setCurrentIndex(index);
  };

  const renderItem = ({ item }: { item: SuggestedItem }) => (
    <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}>
      {item.type === 'friend' ? (
        <SuggestedFriendCard
          friend={item.data}
          onPress={onPressFriend}
          onInvite={onInviteFriend}
        />
      ) : (
        <SuggestedStrutturaCard
          struttura={item.data}
          onPress={onPressStruttura}
          onFollow={onFollowStruttura}
        />
      )}
    </View>
  );

  return (
    <View style={styles.carouselSection}>
      <View style={styles.carouselHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.sectionTitle}>Suggerimenti</Text>
          <View style={styles.friendsCountBadge}>
            <Text style={styles.friendsCountText}>{items.length}</Text>
          </View>
        </View>
        
        {onViewAll && (
          <Pressable 
            style={styles.viewAllButton} 
            onPress={onViewAll}
          >
            <Text style={styles.viewAllText}>Tutti</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => {
          const id = item.type === 'friend' 
            ? (item.data.user?._id || item.data._id)
            : item.data._id;
          return `${item.type}-${id}`;
        }}
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
    </View>
  );
};