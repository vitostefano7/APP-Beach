import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthContext } from "../../../context/AuthContext";
import { DashboardStackParamList } from "../../../navigation/DashboardStack";
import API_URL from "../../../config/api";
import { styles } from "../styles-player/StrutturaDetailScreen.styles";

const { width: screenWidth } = Dimensions.get('window');

type StrutturaDetailRouteProp = RouteProp<DashboardStackParamList, "StrutturaDetail">;
type StrutturaDetailNavigationProp = NativeStackNavigationProp<DashboardStackParamList, "StrutturaDetail">;

type StrutturaData = {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  location: {
    address: string;
    city: string;
    coordinates?: number[];
  };
  phoneNumber?: string;
  email?: string;
  website?: string;
  openingHours?: string | {
    monday?: string | { closed?: boolean; slots?: string[] };
    tuesday?: string | { closed?: boolean; slots?: string[] };
    wednesday?: string | { closed?: boolean; slots?: string[] };
    thursday?: string | { closed?: boolean; slots?: string[] };
    friday?: string | { closed?: boolean; slots?: string[] };
    saturday?: string | { closed?: boolean; slots?: string[] };
    sunday?: string | { closed?: boolean; slots?: string[] };
  };
  amenities?: string[];
  fieldsCount?: number;
  isFollowing: boolean;
  followersCount?: number;
};

type Post = {
  _id: string;
  struttura: {
    _id: string;
    name: string;
    images: string[];
  };
  content: string;
  image?: string;
  likes: string[];
  comments: Array<{
    _id: string;
    user: { name: string };
    text: string;
  }>;
  createdAt: string;
};

export default function StrutturaDetailScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<StrutturaDetailNavigationProp>();
  const route = useRoute<StrutturaDetailRouteProp>();

  const { strutturaId } = route.params;
  const [loading, setLoading] = useState(true);
  const [struttura, setStruttura] = useState<StrutturaData | null>(null);
  const [followingInProgress, setFollowingInProgress] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadStrutturaDetails();
      loadStrutturaPosts();
    }, [strutturaId])
  );

  useEffect(() => {
    loadStrutturaDetails();
    loadStrutturaPosts();
  }, [strutturaId]);

  const loadStrutturaDetails = async () => {
    if (!token || !strutturaId) return;

    try {
      setLoading(true);
      console.log("🏢 [StrutturaDetail] Loading details for:", strutturaId);

      const res = await fetch(`${API_URL}/community/strutture/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ [StrutturaDetail] Data received:", data.name);
        setStruttura(data);
      } else {
        console.error("❌ [StrutturaDetail] Error:", res.status);
      }
    } catch (error) {
      console.error("❌ [StrutturaDetail] Exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStrutturaPosts = async () => {
    if (!token || !strutturaId) return;

    try {
      setLoadingPosts(true);
      console.log("📝 [StrutturaDetail] Loading posts for:", strutturaId);

      const res = await fetch(`${API_URL}/community/strutture/${strutturaId}/posts?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        console.log("✅ [StrutturaDetail] Posts received:", json.posts?.length || 0);
        setPosts(json.posts || []);
      } else {
        console.error("❌ [StrutturaDetail] Error loading posts:", res.status);
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ [StrutturaDetail] Exception loading posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFollow = async () => {
    if (!token || !strutturaId || followingInProgress) return;

    try {
      setFollowingInProgress(true);

      const response = await fetch(`${API_URL}/community/strutture/${strutturaId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStruttura((prev) => prev ? { ...prev, isFollowing: true, followersCount: (prev.followersCount || 0) + 1 } : prev);
      } else {
        console.error('❌ [StrutturaDetail] Error following');
      }
    } catch (error) {
      console.error('❌ [StrutturaDetail] Exception following:', error);
    } finally {
      setFollowingInProgress(false);
    }
  };

  const handleUnfollow = async () => {
    if (!token || !strutturaId || followingInProgress) return;

    try {
      setFollowingInProgress(true);

      const response = await fetch(`${API_URL}/community/strutture/${strutturaId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStruttura((prev) => prev ? { ...prev, isFollowing: false, followersCount: Math.max((prev.followersCount || 1) - 1, 0) } : prev);
      } else {
        console.error('❌ [StrutturaDetail] Error unfollowing');
      }
    } catch (error) {
      console.error('❌ [StrutturaDetail] Exception unfollowing:', error);
    } finally {
      setFollowingInProgress(false);
    }
  };

  const handleChat = async () => {
    if (!token || !strutturaId || !struttura) return;

    try {
      console.log("💬 [StrutturaDetail] Starting chat with struttura:", strutturaId);
      const res = await fetch(`${API_URL}/api/conversations/struttura/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const conversation = await res.json();
        console.log("✅ [StrutturaDetail] Conversation obtained:", conversation._id);
        
        navigation.navigate("Chat", {
          conversationId: conversation._id,
          strutturaName: struttura.name,
          isUserChat: false,
        });
      } else {
        console.error("❌ [StrutturaDetail] Failed to get conversation:", res.status);
      }
    } catch (error) {
      console.error("❌ [StrutturaDetail] Exception starting chat:", error);
    }
  };

  const handleCall = () => {
    if (struttura?.phoneNumber) {
      Linking.openURL(`tel:${struttura.phoneNumber}`);
    }
  };

  const handleEmail = () => {
    if (struttura?.email) {
      Linking.openURL(`mailto:${struttura.email}`);
    }
  };

  const handleWebsite = () => {
    if (struttura?.website) {
      const url = struttura.website.startsWith('http') ? struttura.website : `https://${struttura.website}`;
      Linking.openURL(url);
    }
  };

  const handleOpenMaps = () => {
    if (struttura?.location.coordinates && struttura.location.coordinates.length === 2) {
      const [lng, lat] = struttura.location.coordinates;
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    } else if (struttura?.location.address) {
      const query = encodeURIComponent(`${struttura.location.address}, ${struttura.location.city}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Struttura</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!struttura) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Struttura</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="business-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Struttura</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        {struttura.images.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {struttura.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {struttura.images.length > 1 && (
              <View style={styles.imageIndicators}>
                {struttura.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageIndicator,
                      index === activeImageIndex && styles.imageIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.nameContainer}>
            <Ionicons name="business" size={28} color="#2196F3" />
            <Text style={styles.name}>{struttura.name}</Text>
          </View>

          {/* Location */}
          <Pressable style={styles.locationContainer} onPress={handleOpenMaps}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationText}>{struttura.location.address}</Text>
              <Text style={styles.cityText}>{struttura.location.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2196F3" />
          </Pressable>

          {/* Description */}
          {struttura.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{struttura.description}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            {struttura.followersCount !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{struttura.followersCount}</Text>
                <Text style={styles.statLabel}>Follower</Text>
              </View>
            )}
            {struttura.fieldsCount !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{struttura.fieldsCount}</Text>
                <Text style={styles.statLabel}>Campi</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {struttura.isFollowing ? (
              <Pressable
                style={[styles.followButton, styles.followingButton]}
                onPress={handleUnfollow}
                disabled={followingInProgress}
              >
                {followingInProgress ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.followButtonText, styles.followingButtonText]}>Segui già</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={styles.followButton}
                onPress={handleFollow}
                disabled={followingInProgress}
              >
                {followingInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.followButtonText}>Segui</Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable style={styles.chatButton} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </Pressable>
          </View>

          {/* Contact Info */}
          {(struttura.phoneNumber || struttura.email || struttura.website) && (
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Contatti</Text>
              {struttura.phoneNumber && (
                <Pressable style={styles.contactItem} onPress={handleCall}>
                  <Ionicons name="call" size={20} color="#2196F3" />
                  <Text style={styles.contactText}>{struttura.phoneNumber}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>
              )}
              {struttura.email && (
                <Pressable style={styles.contactItem} onPress={handleEmail}>
                  <Ionicons name="mail" size={20} color="#2196F3" />
                  <Text style={styles.contactText}>{struttura.email}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>
              )}
              {struttura.website && (
                <Pressable style={styles.contactItem} onPress={handleWebsite}>
                  <Ionicons name="globe" size={20} color="#2196F3" />
                  <Text style={styles.contactText}>{struttura.website}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </Pressable>
              )}
            </View>
          )}

          {/* Amenities */}
          {struttura.amenities && struttura.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Servizi</Text>
              <View style={styles.amenitiesContainer}>
                {struttura.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Opening Hours */}
          {struttura.openingHours && (
            <View style={styles.hoursSection}>
              <View style={styles.hoursHeader}>
                <Ionicons name="time" size={20} color="#2196F3" />
                <Text style={styles.sectionTitle}>Orari</Text>
              </View>
              {typeof struttura.openingHours === 'string' ? (
                <Text style={styles.hoursText}>{struttura.openingHours}</Text>
              ) : (
                <View style={styles.hoursContainer}>
                  {Object.entries(struttura.openingHours).map(([day, hours]) => {
                    const dayNames: { [key: string]: string } = {
                      monday: 'Lunedì',
                      tuesday: 'Martedì',
                      wednesday: 'Mercoledì',
                      thursday: 'Giovedì',
                      friday: 'Venerdì',
                      saturday: 'Sabato',
                      sunday: 'Domenica',
                    };
                    
                    if (!hours) return null;
                    
                    return (
                      <View key={day} style={styles.hourRow}>
                        <Text style={styles.dayLabel}>{dayNames[day]}:</Text>
                        <Text style={styles.hourText}>
                          {typeof hours === 'string' 
                            ? hours 
                            : hours.closed 
                              ? 'Chiuso' 
                              : hours.slots?.join(', ') || 'N/A'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.postsSectionTitle}>Post</Text>
            {loadingPosts && <ActivityIndicator size="small" color="#2196F3" />}
          </View>

          {posts.length > 0 ? (
            posts.map((post) => (
              <View key={post._id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postStrutturaAvatar}>
                    {post.struttura.images[0] ? (
                      <Image
                        source={{ uri: post.struttura.images[0] }}
                        style={styles.postStrutturaAvatarImage}
                      />
                    ) : (
                      <Ionicons name="business" size={24} color="#2196F3" />
                    )}
                  </View>
                  <View style={styles.postHeaderText}>
                    <Text style={styles.postAuthor}>{post.struttura.name}</Text>
                    <Text style={styles.postTime}>
                      {new Date(post.createdAt).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.image && (
                  <Image
                    source={{ uri: post.image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={18} color="#666" />
                    <Text style={styles.postStatText}>{post.likes.length}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={16} color="#666" />
                    <Text style={styles.postStatText}>{post.comments.length}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : !loadingPosts ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="newspaper-outline" size={48} color="#ccc" />
              <Text style={styles.emptyPostsText}>Nessun post pubblicato</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
