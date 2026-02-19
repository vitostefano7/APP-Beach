import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../../context/AuthContext';
import API_URL from '../../../config/api';
import { useOwnerSuggestedUsers } from '../../../hooks/CercaAmici/useOwnerSuggestedUsers';
import { useSuggestedStrutture } from '../../../hooks/CercaAmici/useSuggestedStrutture';
import { SuggestedFriendCard } from '../../../components/CercaAmici/SuggestedFriendCard';
import Avatar from "../../../components/Avatar/Avatar";
import SearchBar from '../../../components/CercaAmici/SearchBar';
import StrutturaCard from '../../../components/StrutturaCard/StrutturaCard';
import { RecentUserCard, RecentStrutturaCard } from '../../../components/CercaAmici/RecentSearchCard';
import { useSearchLogic } from '../../../hooks/useSearchLogic';
import {
  loadRecentUserSearches,
  loadRecentStruttureSearches,
  saveRecentUserSearch,
  saveRecentStrutturaSearch,
  clearRecentUserSearches,
  clearRecentStruttureSearches,
  refreshRecentUserSearches,
  refreshRecentStruttureSearches,
  getFollowStrutturaEndpoint,
  SearchResult,
  Struttura,
} from '../../../utils/searchHelpers';
import { searchScreenStyles } from '../../../styles/searchScreenStyles';
import { StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function OwnerCercaAmiciScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);

  const [searchType, setSearchType] = useState<'users' | 'strutture'>('users');
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [recentStruttureSearches, setRecentStruttureSearches] = useState<Struttura[]>([]);
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  // Use the new search logic hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    struttureResults,
    searchLoading,
    hasSearched,
    clearSearch,
  } = useSearchLogic({
    token: token || '',
    role: 'owner',
    currentUserId: user?.id,
  });

  // Hook per utenti suggeriti per owner
  const {
    suggestions: suggestedUsers,
    loading: suggestionsLoading,
    sendFriendRequest,
  } = useOwnerSuggestedUsers({ limit: 10 });

  // Hook per strutture suggerite
  const {
    suggestions: suggestedStrutture,
    loading: struttureLoading,
    followStruttura,
    unfollowStruttura,
  } = useSuggestedStrutture({ limit: 10 });

  // Load recent searches on mount
  useEffect(() => {
    loadRecentUserSearches().then(setRecentSearches);
    loadRecentStruttureSearches().then(setRecentStruttureSearches);
  }, []);

  // Refresh recent searches data when token changes
  useEffect(() => {
    if (token) {
      refreshRecentUserSearches(token).then(setRecentSearches);
      refreshRecentStruttureSearches(token, 'owner').then(setRecentStruttureSearches);
    }
  }, [token]);

  const handleUserPress = async (user: SearchResult) => {
    await saveRecentUserSearch(user);
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handleStrutturaPress = async (struttura: Struttura) => {
    await saveRecentStrutturaSearch(struttura);
    navigation.navigate('StrutturaDetail', { strutturaId: struttura._id });
  };

  const handleSendFriendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
  };

  const handleFollowStruttura = async (strutturaId: string) => {
    if (followingInProgress.has(strutturaId) || !token) return;

    setFollowingInProgress(prev => new Set(prev).add(strutturaId));

    try {
      const endpoint = getFollowStrutturaEndpoint('owner', strutturaId);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update struttureResults if searching
        // Update recentStruttureSearches
        setRecentStruttureSearches(prev =>
          prev.map(s =>
            s._id === strutturaId ? { ...s, isFollowing: !s.isFollowing } : s
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
      <View style={{ width: screenWidth * 0.75, marginRight: 16 }}>
        <SuggestedFriendCard
          friend={item}
          onPress={() => handleUserPress(user)}
          onInvite={() => handleSendFriendRequest(user._id)}
        />
      </View>
    );
  };

  const renderSearchResultUser = (user: SearchResult) => (
    <SuggestedFriendCard
      friend={{ user, reason: { type: 'search' } }}
      onPress={() => handleUserPress(user)}
      onInvite={() => handleSendFriendRequest(user._id)}
    />
  );

  const renderSearchResultStruttura = (struttura: Struttura) => (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <StrutturaCard
        struttura={struttura}
        onPress={() => handleStrutturaPress(struttura)}
        onFollow={() => handleFollowStruttura(struttura._id)}
        isFollowing={struttura.isFollowing || false}
        isLoading={followingInProgress.has(struttura._id)}
        showDescription={true}
      />
    </View>
  );

  const renderSuggestedStruttura = (item: any) => (
    <View style={{ width: screenWidth * 0.75, marginRight: 16 }}>
      <StrutturaCard
        struttura={item}
        onPress={() => handleStrutturaPress(item)}
        onFollow={async () => {
          item.isFollowing ? await unfollowStruttura(item._id) : await followStruttura(item._id);
        }}
        isFollowing={item.isFollowing || false}
        isLoading={false}
        showDescription={true}
      />
    </View>
  );

  return (
    <SafeAreaView style={searchScreenStyles.safe} edges={['top']}>
      {/* Header with integrated search */}
      <View style={searchScreenStyles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={searchScreenStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        
        <View style={searchScreenStyles.headerSearchBar}>
          <SearchBar
            placeholder={searchType === 'users' ? 'Cerca giocatori...' : 'Cerca strutture...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={clearSearch}
            showClearButton={searchQuery.length > 0}
          />
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={searchScreenStyles.tabSwitcher}>
        <Pressable
          style={[searchScreenStyles.tabButton, searchType === 'users' && searchScreenStyles.tabButtonActive]}
          onPress={() => {
            setSearchType('users');
            clearSearch();
          }}
        >
          <Ionicons
            name="people"
            size={20}
            color={searchType === 'users' ? '#2196F3' : '#999'}
          />
          <Text style={[searchScreenStyles.tabButtonText, searchType === 'users' && searchScreenStyles.tabButtonTextActive]}>
            Utenti
          </Text>
        </Pressable>

        <Pressable
          style={[searchScreenStyles.tabButton, searchType === 'strutture' && searchScreenStyles.tabButtonActive]}
          onPress={() => {
            setSearchType('strutture');
            clearSearch();
          }}
        >
          <Ionicons
            name="business"
            size={20}
            color={searchType === 'strutture' ? '#2196F3' : '#999'}
          />
          <Text style={[searchScreenStyles.tabButtonText, searchType === 'strutture' && searchScreenStyles.tabButtonTextActive]}>
            Strutture
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {/* Suggested Carousel - only users for owner */}
            {!hasSearched && searchType === 'users' && (
              <View style={searchScreenStyles.section}>
                <View style={searchScreenStyles.sectionHeader}>
                  <Text style={searchScreenStyles.sectionTitle}>Suggerimenti per te</Text>
                  {suggestedUsers.length > 0 && (
                    <View style={searchScreenStyles.countBadge}>
                      <Text style={searchScreenStyles.countText}>{suggestedUsers.length}</Text>
                    </View>
                  )}
                </View>

                {suggestionsLoading ? (
                  <View style={searchScreenStyles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={searchScreenStyles.loadingText}>Caricamento...</Text>
                  </View>
                ) : suggestedUsers.length > 0 ? (
                  <FlatList
                    data={suggestedUsers}
                    renderItem={renderSuggestedUser}
                    keyExtractor={(item) => item.user._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                ) : (
                  <View style={searchScreenStyles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={searchScreenStyles.emptyTitle}>Nessun suggerimento</Text>
                    <Text style={searchScreenStyles.emptyText}>
                      Non ci sono suggerimenti al momento
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Suggested Strutture */}
            {!hasSearched && searchType === 'strutture' && (
              <View style={searchScreenStyles.section}>
                <View style={searchScreenStyles.sectionHeader}>
                  <Text style={searchScreenStyles.sectionTitle}>Strutture suggerite</Text>
                  {suggestedStrutture.length > 0 && (
                    <View style={searchScreenStyles.countBadge}>
                      <Text style={searchScreenStyles.countText}>{suggestedStrutture.length}</Text>
                    </View>
                  )}
                </View>

                {struttureLoading ? (
                  <View style={searchScreenStyles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={searchScreenStyles.loadingText}>Caricamento...</Text>
                  </View>
                ) : suggestedStrutture.length > 0 ? (
                  <FlatList
                    data={suggestedStrutture}
                    renderItem={({ item }) => renderSuggestedStruttura(item)}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                ) : (
                  <View style={searchScreenStyles.emptyState}>
                    <Ionicons name="business-outline" size={48} color="#ccc" />
                    <Text style={searchScreenStyles.emptyTitle}>Nessuna struttura suggerita</Text>
                    <Text style={searchScreenStyles.emptyText}>
                      Non ci sono strutture suggerite al momento
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Recent User Searches */}
            {!hasSearched && searchType === 'users' && recentSearches.length > 0 && (
              <View style={searchScreenStyles.section}>
                <View style={searchScreenStyles.sectionHeader}>
                  <Text style={searchScreenStyles.sectionTitle}>Ricerche recenti</Text>
                  <Pressable onPress={() => clearRecentUserSearches().then(() => setRecentSearches([]))}>
                    <Text style={searchScreenStyles.clearText}>Cancella</Text>
                  </Pressable>
                </View>
                
                <View style={searchScreenStyles.recentSearchesContainer}>
                  {recentSearches.map((user) => (
                    <RecentUserCard
                      key={user._id}
                      user={user}
                      onPress={() => handleUserPress(user)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Recent Strutture Searches */}
            {!hasSearched && searchType === 'strutture' && recentStruttureSearches.length > 0 && (
              <View style={searchScreenStyles.section}>
                <View style={searchScreenStyles.sectionHeader}>
                  <Text style={searchScreenStyles.sectionTitle}>Ricerche recenti</Text>
                  <Pressable onPress={() => clearRecentStruttureSearches().then(() => setRecentStruttureSearches([]))}>
                    <Text style={searchScreenStyles.clearText}>Cancella</Text>
                  </Pressable>
                </View>

                <View style={searchScreenStyles.recentSearchesContainer}>
                  {recentStruttureSearches.map((struttura) => (
                    <RecentStrutturaCard
                      key={struttura._id}
                      struttura={struttura}
                      onPress={() => handleStrutturaPress(struttura)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Search Results */}
            {hasSearched && (
              <View style={searchScreenStyles.section}>
                <View style={searchScreenStyles.sectionHeader}>
                  <Text style={searchScreenStyles.sectionTitle}>
                    {searchType === 'users' 
                      ? `Utenti (${searchResults.length})` 
                      : `Strutture (${struttureResults.length})`}
                  </Text>
                </View>

                {searchLoading ? (
                  <View style={searchScreenStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={searchScreenStyles.loadingText}>Ricerca in corso...</Text>
                  </View>
                ) : searchType === 'users' ? (
                  searchResults.length === 0 ? (
                    <View style={searchScreenStyles.emptyState}>
                      <Ionicons name="people-outline" size={48} color="#ccc" />
                      <Text style={searchScreenStyles.emptyTitle}>Nessun utente trovato</Text>
                      <Text style={searchScreenStyles.emptyText}>
                        Prova con un altro nome o username
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={searchResults}
                      renderItem={({ item }) => (
                        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                          {renderSearchResultUser(item)}
                        </View>
                      )}
                      keyExtractor={(item) => item._id}
                      scrollEnabled={false}
                    />
                  )
                ) : (
                  struttureResults.length === 0 ? (
                    <View style={searchScreenStyles.emptyState}>
                      <Ionicons name="business-outline" size={48} color="#ccc" />
                      <Text style={searchScreenStyles.emptyTitle}>Nessuna struttura trovata</Text>
                      <Text style={searchScreenStyles.emptyText}>
                        Prova con un altro nome o città
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={struttureResults}
                      renderItem={({ item }) => renderSearchResultStruttura(item)}
                      keyExtractor={(item) => item._id}
                      scrollEnabled={false}
                    />
                  )
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
