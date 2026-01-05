// SuggestedFriendsCarousel.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SuggestedFriendCard } from "./SuggestedFriendCard";
import { styles } from "../styles";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_MARGIN = 8;

interface SuggestedFriendsCarouselProps {
  friends: any[];
  onPressFriend: (friend: any) => void;
  onInviteFriend: (friendId: string) => void;
  onViewAll?: () => void;
}

export const SuggestedFriendsCarousel: React.FC<SuggestedFriendsCarouselProps> = ({
  friends,
  onPressFriend,
  onInviteFriend,
  onViewAll,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!friends || friends.length === 0) {
    return (
      <View style={styles.emptyCarouselContainer}>
        <Ionicons name="people-outline" size={48} color="#ccc" />
        <Text style={styles.emptyCarouselText}>
          Nessun amico suggerito al momento
        </Text>
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
      <SuggestedFriendCard
        friend={item}
        onPress={onPressFriend}
        onInvite={onInviteFriend}
      />
    </View>
  );

  return (
    <View style={styles.carouselSection}>
      <View style={styles.carouselHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.sectionTitle}>Amici suggeriti</Text>
          <View style={styles.friendsCountBadge}>
            <Text style={styles.friendsCountText}>{friends.length}</Text>
          </View>
        </View>
        
        <View style={styles.carouselControls}>
          <View style={styles.dotsContainer}>
            {friends.slice(0, 5).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
            {friends.length > 5 && (
              <Text style={styles.moreDotsText}>+{friends.length - 5}</Text>
            )}
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
      </View>

      <FlatList
        ref={flatListRef}
        data={friends}
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
        {currentIndex + 1} di {friends.length}
      </Text>
    </View>
  );
};