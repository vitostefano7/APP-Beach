import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../../context/AuthContext';
import API_URL from '../../../config/api';
import { useSuggestedFriends } from './hooks/useSuggestedFriends';
import { SuggestedFriendCard } from './components/SuggestedFriendCard';
import { StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SearchResult {
  _id: string;
  name: string;
  surname?: string;
  username: string;
  avatarUrl?: string;
  preferredSports?: string[];
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  commonMatchesCount?: number;
  mutualFriendsCount?: number;
}

export default function CercaAmiciScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Hook per amici suggeriti
  const {
    suggestions: suggestedFriends,
    loading: suggestionsLoading,
    sendFriendRequest,
  } = useSuggestedFriends({ limit: 10 });

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debug per verificare il caricamento
  useEffect(() => {
    console.log('=== CERCA AMICI SCREEN - SUGGERIMENTI ===');
    console.log('Loading:', suggestionsLoading);
    console.log('Suggerimenti:', suggestedFriends?.length);
    console.log('Dati suggerimenti:', suggestedFriends);
  }, [suggestionsLoading, suggestedFriends]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('@recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
        // Ricarica i dati aggiornati con commonMatchesCount
        refreshRecentSearchesData(parsed);
      }
    } catch (error) {
      console.error('Errore caricamento ricerche recenti:', error);
    }
  };

  const refreshRecentSearchesData = async (users: SearchResult[]) => {
    if (!token || users.length === 0) return;

    try {
      // Fetch updated data for each user
      const updatedUsers = await Promise.all(
        users.map(async (user) => {
          try {
            const res = await fetch(
              `${API_URL}/users/${user._id}/public-profile`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (res.ok) {
              const data = await res.json();
              return {
                ...user,
                commonMatchesCount: data.stats?.commonMatchesCount,
                mutualFriendsCount: data.stats?.mutualFriendsCount,
                friendshipStatus: data.friendshipStatus,
              };
            }
            return user;
          } catch (err) {
            console.error('Error fetching user data:', err);
            return user;
          }
        })
      );

      setRecentSearches(updatedUsers);
      // Aggiorna anche AsyncStorage con i nuovi dati
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Errore aggiornamento dati recenti:', error);
    }
  };

  const saveRecentUser = async (user: SearchResult) => {
    try {
      // Remove duplicates based on user ID
      const updated = [user, ...recentSearches.filter(u => u._id !== user._id)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Errore salvataggio utente recente:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('@recent_searches');
    } catch (error) {
      console.error('Errore cancellazione ricerche:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Solo se ci sono almeno 2 caratteri
    if (searchQuery.trim().length < 2) {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!token || query.length < 2) return;

    try {
      setSearchLoading(true);
      setHasSearched(true);

      console.log('🔍 Searching for:', query);
      const response = await fetch(
        `${API_URL}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data.users || data || []);
      } else {
        const errorText = await response.text();
        console.error('Errore ricerca:', response.status, errorText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Errore ricerca utenti:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    try {
      const success = await sendFriendRequest(friendId);
      if (success) {
        // Aggiorna lo stato locale - ora è "accepted" perché è follow automatico
        setSearchResults((prev) =>
          prev.map((result) =>
            result._id === friendId
              ? { ...result, friendshipStatus: 'accepted' }
              : result
          )
        );
      }
    } catch (error) {
      console.error('Errore follow utente:', error);
    }
  };

  const handlePressFriend = async (friend: any, fromSearchResults: boolean = false) => {
    const friendId = friend.user?._id || friend._id;
    
    // If clicked from search results, save to recent searches
    if (fromSearchResults && friend._id) {
      await saveRecentUser(friend);
    }
    
    navigation.navigate('ProfiloUtente', {
      userId: friendId,
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const displayName = item.surname
      ? `${item.name} ${item.surname}`
      : item.name;

    const isCurrentUser = item._id === user?.id;
    const canSendRequest =
      !isCurrentUser &&
      (!item.friendshipStatus || item.friendshipStatus === 'none');

    return (
      <Pressable
        style={styles.searchResultCard}
        onPress={() => handlePressFriend(item, true)}
      >
        <View style={styles.searchResultLeft}>
          <View style={styles.searchResultAvatar}>
            <Ionicons name="person" size={24} color="#2196F3" />
          </View>

          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName}>{displayName}</Text>
            <Text style={styles.searchResultUsername}>@{item.username}</Text>
            {item.commonMatchesCount !== undefined && item.commonMatchesCount > 0 && (
              <Text style={styles.commonMatchesText}>
                {item.commonMatchesCount} {item.commonMatchesCount === 1 ? 'partita insieme' : 'partite insieme'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.searchResultRight}>
          {isCurrentUser ? (
            <Text style={styles.youBadge}>Tu</Text>
          ) : item.friendshipStatus === 'accepted' ? (
            <View style={styles.friendBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.friendBadgeText}>Segui già</Text>
            </View>
          ) : canSendRequest ? (
            <Pressable
              style={styles.addButton}
              onPress={() => handleAddFriend(item._id, displayName)}
            >
              <Ionicons name="person-add" size={20} color="white" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header with integrated search */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        
        <View style={styles.headerSearchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.headerSearchInput}
            placeholder="Cerca amici..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {/* Suggested Friends Carousel */}
            {!hasSearched && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Persone che potresti conoscere</Text>
                  {suggestedFriends && suggestedFriends.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{suggestedFriends.length}</Text>
                    </View>
                  )}
                </View>

                {suggestionsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.loadingText}>Caricamento suggerimenti...</Text>
                  </View>
                ) : suggestedFriends && suggestedFriends.length > 0 ? (
                  <FlatList
                    data={suggestedFriends}
                    renderItem={({ item }) => (
                      <View style={{ width: screenWidth * 0.75, marginRight: 16 }}>
                        <SuggestedFriendCard
                          friend={item}
                          onPress={() => handlePressFriend(item)}
                          onInvite={() =>
                            handleAddFriend(
                              item.user._id,
                              item.user.name
                            )
                          }
                        />
                      </View>
                    )}
                    keyExtractor={(item, index) =>
                      `suggested-${item.user._id || index}`
                    }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Nessun suggerimento disponibile</Text>
                    <Text style={styles.emptySubtext}>
                      Gioca più partite per ricevere suggerimenti personalizzati
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Recent Searches - Show only when not searching */}
            {!hasSearched && recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Visti di recente</Text>
                  <Pressable onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Cancella</Text>
                  </Pressable>
                </View>
                
                <View style={styles.recentSearchesContainer}>
                  {recentSearches.map((user, index) => {
                    const displayName = user.surname
                      ? `${user.name} ${user.surname}`
                      : user.name;
                    
                    return (
                      <Pressable
                        key={user._id || `recent-${index}`}
                        style={styles.recentUserCard}
                        onPress={() => handlePressFriend(user, false)}
                      >
                        <View style={styles.recentUserAvatar}>
                          <Ionicons name="person" size={24} color="#2196F3" />
                        </View>
                        <View style={styles.recentUserInfo}>
                          <Text style={styles.recentUserName} numberOfLines={1}>{displayName}</Text>
                          <Text style={styles.recentUserUsername} numberOfLines={1}>@{user.username}</Text>
                          {user.commonMatchesCount !== undefined && user.commonMatchesCount > 0 ? (
                            <Text style={styles.recentCommonMatchesText} numberOfLines={1}>
                              {user.commonMatchesCount} {user.commonMatchesCount === 1 ? 'partita' : 'partite'}
                            </Text>
                          ) : user.mutualFriendsCount !== undefined && user.mutualFriendsCount > 0 ? (
                            <Text style={styles.recentCommonMatchesText} numberOfLines={1}>
                              {user.mutualFriendsCount} {user.mutualFriendsCount === 1 ? 'amico in comune' : 'amici in comune'}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Search Results */}
            {hasSearched && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {searchLoading
                      ? 'Ricerca in corso...'
                      : `Risultati (${searchResults.length})`}
                  </Text>
                </View>

                {searchLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>Cercando...</Text>
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Nessun risultato</Text>
                    <Text style={styles.emptyText}>
                      Prova a cercare con un nome o username diverso
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                )}
              </View>
            )}
          </>
        }
        renderItem={null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  section: {
    marginTop: 16,
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  countBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2196F3',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 4,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
    gap: 4,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#666',
  },
  commonMatchesText: {
    fontSize: 13,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '500',
  },
  sportsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sportText: {
    fontSize: 12,
  },
  searchResultRight: {
    marginLeft: 12,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  friendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  recentSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  recentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentUserInfo: {
    flex: 1,
    gap: 2,
  },
  recentUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  recentUserUsername: {
    fontSize: 12,
    color: '#666',
  },
  recentCommonMatchesText: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
    fontWeight: '500',
  },
  recentUserSports: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  recentUserSportIcon: {
    fontSize: 12,
  },
});
