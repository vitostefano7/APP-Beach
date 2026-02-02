import React from 'react';
import { View, Text, Modal, ScrollView, TextInput, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton, FadeInView, ScaleInView } from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/AnimatedComponents';
import { resolveAvatarUrl } from '../../../utils/avatar';
import styles from '../../screens/player/prenotazioni/DettaglioPrenotazione/styles/DettaglioPrenotazione.styles';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  inviteToTeam: "A" | "B" | null;
  inviteToSlot: number | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchUsers: (query: string) => void;
  searching: boolean;
  searchResults: any[];
  handleInvitePlayer: (username: string) => void;
  openUserProfile: (userId: string) => void;
  getTeamColors: (team: "A" | "B" | null) => any;
  getTeamIcon: (team: "A" | "B" | null) => string;
  suppressInvitePress: React.MutableRefObject<boolean>;
}

const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onClose,
  inviteToTeam,
  inviteToSlot,
  searchQuery,
  setSearchQuery,
  handleSearchUsers,
  searching,
  searchResults,
  handleInvitePlayer,
  openUserProfile,
  getTeamColors,
  getTeamIcon,
  suppressInvitePress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScaleInView style={styles.modalContent}>
          <View style={[styles.modalHeader, { backgroundColor: getTeamColors(inviteToTeam).primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={getTeamIcon(inviteToTeam)}
                size={24}
                color="white"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.modalTitle}>
                {inviteToTeam ? `Invita a Team ${inviteToTeam}` : 'Invita Giocatore'}
                {inviteToSlot && ` - Slot ${inviteToSlot}`}
              </Text>
            </View>
            <AnimatedButton onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="white" />
            </AnimatedButton>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca per username..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearchUsers(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.searchResults}>
            {searching ? (
              <ActivityIndicator size="small" color="#FF9800" style={{ marginTop: 20 }} />
            ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
              <Text style={styles.noResults}>Nessun utente trovato</Text>
            ) : (
              searchResults.map((user, index) => (
                <FadeInView key={user._id} delay={index * 50}>
                  <AnimatedButton
                    style={styles.searchResultItem}
                    onPress={() => {
                      if (suppressInvitePress.current) {
                        suppressInvitePress.current = false;
                        return;
                      }
                      handleInvitePlayer(user.username);
                    }}
                  >
                    <Pressable
                      onPress={() => openUserProfile(user._id)}
                      hitSlop={10}
                      onPressIn={() => {
                        suppressInvitePress.current = true;
                      }}
                      onPressOut={() => {
                        setTimeout(() => {
                          suppressInvitePress.current = false;
                        }, 150);
                      }}
                    >
                      {user.avatarUrl ? (
                        <Image
                          source={{ uri: resolveAvatarUrl(user.avatarUrl) || "" }}
                          style={styles.resultAvatar}
                        />
                      ) : (
                        <View style={styles.resultAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#999" />
                        </View>
                      )}
                    </Pressable>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{user.name} {user.surname}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.resultUsername, { color: getTeamColors(inviteToTeam).primary }]}>@{user.username}</Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle" size={24} color={getTeamColors(inviteToTeam).primary} />
                  </AnimatedButton>
                </FadeInView>
              ))
            )}
          </ScrollView>
        </ScaleInView>
      </View>
    </Modal>
  );
};

export default InviteModal;