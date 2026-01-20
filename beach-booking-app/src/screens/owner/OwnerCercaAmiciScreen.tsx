import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import API_URL from '../../config/api';
import { useOwnerSuggestedUsers } from "../player/dashboard/hooks/useOwnerSuggestedUsers";
import { SuggestedFriendCard } from '../player/dashboard/components/SuggestedFriendCard';
import { StyleSheet } from 'react-native';
import Avatar from "../../components/Avatar/Avatar";

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

interface Struttura {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  location: {
    address: string;
    city: string;
  };
  isFollowing?: boolean;
}

type SearchItem = { type: 'user'; data: SearchResult } | { type: 'struttura'; data: Struttura };

export default function OwnerCercaAmiciScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [combinedResults, setCombinedResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Hook per utenti suggeriti per owner
  const {
    suggestions: suggestedUsers,
    loading: suggestionsLoading,
    sendFriendRequest,
  } = useOwnerSuggestedUsers({ limit: 10 });

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

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

  const refreshRecentSearchesData = async (searches: SearchResult[]) => {
    if (!token) return;

    try {
      const updatedSearches = await Promise.all(
        searches.map(async (search) => {
          try {
            const response = await fetch(`${API_URL}/users/${search._id}/friendship-status`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              const data = await response.json();
              return {
                ...search,
                friendshipStatus: data.friendshipStatus,
                commonMatchesCount: data.commonMatchesCount,
                mutualFriendsCount: data.mutualFriendsCount,
              };
            }
          } catch (error) {
            console.error(`Errore refresh dati per ${search._id}:`, error);
          }
          return search;
        })
      );

      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Errore refresh ricerche recenti:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setCombinedResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setHasSearched(true);

      // Chiama entrambi gli endpoint in parallelo
      const [usersResponse, struttureResponse] = await Promise.all([
        fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/community/strutture/search?q=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const results: SearchItem[] = [];

      // Gestisci risposta utenti
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData || [];
        results.push(...users.map((user: SearchResult) => ({ type: 'user' as const, data: user })));
      }

      // Gestisci risposta strutture
      if (struttureResponse.ok) {
        const struttureData = await struttureResponse.json();
        const strutture = struttureData.strutture || [];
        results.push(...strutture.map((struttura: Struttura) => ({ type: 'struttura' as const, data: struttura })));
      }

      setCombinedResults(results);
    } catch (error) {
      console.error('Errore ricerca:', error);
      setCombinedResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearch = (query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleUserPress = (user: SearchResult | { _id: string; name: string; username: string; avatarUrl?: string }) => {
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handleStrutturaPress = (struttura: Struttura) => {
    navigation.navigate('StrutturaDetail', { strutturaId: struttura._id });
  };

  const handleSendFriendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
  };

  const handleFollowStruttura = async (strutturaId: string) => {
    if (followingInProgress.has(strutturaId)) return;

    setFollowingInProgress(prev => new Set(prev).add(strutturaId));

    try {
      const response = await fetch(`${API_URL}/strutture/${strutturaId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCombinedResults(prev =>
          prev.map(item =>
            item.type === 'struttura' && item.data._id === strutturaId
              ? { ...item, data: { ...item.data, isFollowing: !item.data.isFollowing } }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Errore follow struttura:', error);
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(strutturaId);
        return newSet;
      });
    }
  };

  const saveRecentSearch = async (item: SearchResult | Struttura) => {
    try {
      const isUser = '_id' in item && 'username' in item;
      const searchItem: SearchResult = isUser
        ? item as SearchResult
        : {
            _id: item._id,
            name: item.name,
            username: item.name, // Per strutture usiamo il nome come username
            avatarUrl: item.images[0],
          };

      const stored = await AsyncStorage.getItem('@recent_searches');
      let recent = stored ? JSON.parse(stored) : [];

      // Rimuovi se già presente
      recent = recent.filter((r: SearchResult) => r._id !== searchItem._id);

      // Aggiungi all'inizio
      recent.unshift(searchItem);

      // Mantieni solo gli ultimi 10
      recent = recent.slice(0, 10);

      setRecentSearches(recent);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(recent));
    } catch (error) {
      console.error('Errore salvataggio ricerca recente:', error);
    }
  };

  const renderSuggestedUser = ({ item }: { item: any }) => {
    const user = item.user;
    const reason = item.reason;

    let reasonText = '';
    switch (reason.type) {
      case 'most_games_played':
        reasonText = `Ha giocato ${reason.details.matchCount} partite`;
        break;
      case 'follows_structure':
        reasonText = `Segue ${reason.details.strutturaName || 'la struttura'}`;
        break;
      case 'vip_user':
        reasonText = `Utente ${reason.details.vipLevel || 'VIP'}`;
        break;
      default:
        reasonText = 'Suggerito per te';
    }

    return (
      <Pressable style={styles.suggestionCardCarousel} onPress={() => handleUserPress(user)}>
        <View style={styles.suggestionHeader}>
          <Avatar
            avatarUrl={user.avatarUrl}
            name={user.name}
            size={50}
          />
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionName}>{user.name}</Text>
            <Text style={styles.suggestionUsername}>@{user.username}</Text>
            <Text style={styles.suggestionReason}>{reasonText}</Text>
          </View>
        </View>
        <Pressable
          style={[
            styles.friendRequestButton,
            item.friendshipStatus === 'pending' && styles.pendingButton,
            item.friendshipStatus === 'accepted' && styles.acceptedButton,
          ]}
          onPress={(e) => {
            e.stopPropagation(); // Previene la propagazione al Pressable padre
            handleSendFriendRequest(user._id);
          }}
          disabled={item.friendshipStatus === 'pending' || item.friendshipStatus === 'accepted'}
        >
          <Text style={styles.friendRequestText}>
            {item.friendshipStatus === 'pending' ? 'In attesa' :
             item.friendshipStatus === 'accepted' ? 'Amici' : 'Aggiungi'}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderSearchResult = ({ item }: { item: SearchItem }) => {
    if (item.type === 'user') {
      return (
        <SuggestedFriendCard
          friend={item.data}
          onPress={() => {
            saveRecentSearch(item.data);
            handleUserPress(item.data);
          }}
          onInvite={() => handleSendFriendRequest(item.data._id)}
        />
      );
    } else {
      return (
        <Pressable
          style={styles.userCard}
          onPress={() => {
            saveRecentSearch(item.data);
            handleStrutturaPress(item.data);
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="business" size={40} color="#2196F3" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.data.name}</Text>
              <Text style={styles.cardUsername}>{item.data.location.city}</Text>
            </View>
          </View>
          <Pressable
            style={[
              styles.followButtonSmall,
              item.data.isFollowing && styles.followingButtonSmall,
            ]}
            onPress={() => handleFollowStruttura(item.data._id)}
            disabled={followingInProgress.has(item.data._id)}
          >
            <Text style={styles.followButtonTextSmall}>
              {followingInProgress.has(item.data._id) ? '...' : item.data.isFollowing ? 'Segui già' : 'Segui'}
            </Text>
          </Pressable>
        </Pressable>
      );
    }
  };

  const renderRecentSearch = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={styles.recentSearchItem}
      onPress={() => handleUserPress(item)}
    >
      <Avatar
        avatarUrl={item.avatarUrl}
        name={item.name}
        size={40}
      />
      <View style={styles.recentSearchInfo}>
        <Text style={styles.recentSearchName}>{item.name}</Text>
        <Text style={styles.recentSearchUsername}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Cerca Amici</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca utenti e strutture..."
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setCombinedResults([]);
                setHasSearched(false);
              }}
            >
              <Ionicons name="close" size={20} color="#666" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Suggested Users Carousel - only when not searching */}
      {!searchQuery && suggestedUsers.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Suggerimenti per te</Text>
          <FlatList
            data={suggestedUsers}
            keyExtractor={(item) => item.user._id}
            renderItem={renderSuggestedUser}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        </View>
      )}

      {/* Recent Searches - only when not searching */}
      {!searchQuery && recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.sectionTitle}>Ricerche recenti</Text>
          <FlatList
            data={recentSearches}
            keyExtractor={(item) => item._id}
            renderItem={renderRecentSearch}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentSearchesList}
          />
        </View>
      )}

      {/* Content - Search Results */}
      <FlatList
        data={searchQuery ? combinedResults : []}
        keyExtractor={(item) => item.data._id}
        renderItem={renderSearchResult}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          searchLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : hasSearched && searchQuery ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nessun risultato trovato</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  recentSearchesContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  recentSearchesList: {
    paddingRight: 20,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentSearchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentSearchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  recentSearchUsername: {
    fontSize: 14,
    color: '#666',
  },
  suggestionCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  suggestionUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suggestionReason: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 4,
  },
  friendRequestButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  pendingButton: {
    backgroundColor: '#ffa726',
  },
  acceptedButton: {
    backgroundColor: '#4caf50',
  },
  friendRequestText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  suggestionsList: {
    paddingVertical: 10,
  },
  suggestionCardCarousel: {
    backgroundColor: 'white',
    width: screenWidth * 0.8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  userCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  cardUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButtonSmall: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followingButtonSmall: {
    backgroundColor: '#4caf50',
  },
  followButtonTextSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});