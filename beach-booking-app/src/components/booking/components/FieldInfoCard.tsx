import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AnimatedCard, FadeInView } from './AnimatedComponents';
import SportIcon from '../../SportIcon';

interface FieldInfoCardProps {
  struttura: {
    _id: string;
    name: string;
    location: {
      city: string;
      address?: string;
    };
  };
  campo: {
    name: string;
    sport: {
      _id: string;
      name: string;
      code: string;
      icon?: string;
    } | string;
  };
  onStrutturaPress?: () => void;
  onChatPress?: () => void;
  onMapPress?: () => void;
  showChatButton?: boolean; // Solo per player
  role?: string;
}

export const FieldInfoCard: React.FC<FieldInfoCardProps> = ({
  struttura,
  campo,
  onStrutturaPress,
  onChatPress,
  onMapPress,
  showChatButton = false,
  role,
}) => {
  const getSportDisplayName = (sport: { _id: string; name: string; code: string; icon?: string } | string) => {
    const sportName = typeof sport === 'string' ? sport : sport.name || sport.code;
    if (sportName === 'beach_volley' || sportName === 'beach volley' || sportName === 'Beach Volley') {
      return 'Beach Volley';
    }
    return sportName.charAt(0).toUpperCase() + sportName.slice(1);
  };

  const title = role === 'owner' ? 'Luogo della prenotazione' : 'Dove giochi';

  return (
    <AnimatedCard delay={100}>
      <View style={styles.fieldInfoCard}>
        <View style={styles.fieldInfoHeader}>
          <Ionicons name="location-sharp" size={20} color="#FF9800" />
          <Text style={styles.fieldInfoTitle}>{title}</Text>
        </View>
        
        <View style={styles.fieldInfoList}>
          {/* Struttura */}
          <FadeInView delay={200}>
            {onStrutturaPress ? (
              <Pressable style={styles.fieldInfoRow} onPress={onStrutturaPress}>
                <View style={styles.fieldIconCircle}>
                  <Ionicons name="business" size={18} color="#2196F3" />
                </View>
                <View style={styles.fieldInfoContent}>
                  <Text style={styles.fieldInfoLabel}>STRUTTURA</Text>
                  <Text style={styles.fieldInfoValue}>{struttura.name}</Text>
                </View>
                {showChatButton && onChatPress && (
                  <Pressable 
                    style={styles.chatIconButton}
                    onPress={onChatPress}
                    hitSlop={10}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
                  </Pressable>
                )}
              </Pressable>
            ) : (
              <View style={styles.fieldInfoRow}>
                <View style={styles.fieldIconCircle}>
                  <Ionicons name="business" size={18} color="#2196F3" />
                </View>
                <View style={styles.fieldInfoContent}>
                  <Text style={styles.fieldInfoLabel}>STRUTTURA</Text>
                  <Text style={styles.fieldInfoValue}>{struttura.name}</Text>
                </View>
                {showChatButton && onChatPress && (
                  <Pressable 
                    style={styles.chatIconButton}
                    onPress={onChatPress}
                    hitSlop={10}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
                  </Pressable>
                )}
              </View>
            )}
          </FadeInView>

          {/* Sport e Campo - Due colonne */}
          <View style={styles.sportCampoGrid}>
            <FadeInView delay={300} style={styles.sportCampoColumn}>
              <View style={styles.sportCampoBox}>
                <View style={[styles.fieldIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <SportIcon sport={getSportDisplayName(campo.sport)} size={18} color="#FF9800" />
                </View>
                <View style={styles.fieldInfoContent}>
                  <Text style={styles.fieldInfoLabel}>SPORT</Text>
                  <Text style={styles.fieldInfoValue}>
                    {getSportDisplayName(campo.sport)}
                  </Text>
                </View>
              </View>
            </FadeInView>

            <FadeInView delay={350} style={styles.sportCampoColumn}>
              <View style={styles.sportCampoBox}>
                <View style={[styles.fieldIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="grid-outline" size={18} color="#4CAF50" />
                </View>
                <View style={styles.fieldInfoContent}>
                  <Text style={styles.fieldInfoLabel}>CAMPO</Text>
                  <Text style={styles.fieldInfoValue}>{campo.name}</Text>
                </View>
              </View>
            </FadeInView>
          </View>

          {/* Località - Cliccabile */}
          <FadeInView delay={400}>
            <View style={styles.fieldInfoRow}>
              <View style={[styles.fieldIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="location" size={18} color="#2196F3" />
              </View>
              <View style={styles.fieldInfoContent}>
                <Text style={styles.fieldInfoLabel}>LOCALITÀ</Text>
                <View style={styles.locationRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldInfoValue}>{struttura.location.city}</Text>
                    {struttura.location.address && (
                      <Text style={styles.fieldInfoSubValue}>{struttura.location.address}</Text>
                    )}
                  </View>
                  {onMapPress && (
                    <Pressable 
                      style={styles.mapButton}
                      onPress={onMapPress}
                      android_ripple={{ color: 'rgba(156, 39, 176, 0.1)', radius: 40 }}
                    >
                      <Ionicons name="navigate" size={14} color="#2196F3" />
                      <Text style={styles.mapButtonText}>Indicazioni</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </FadeInView>
        </View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  fieldInfoCard: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  fieldInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  fieldInfoList: {
    gap: 8,
  },
  fieldInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  fieldIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldInfoContent: {
    flex: 1,
  },
  fieldInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  fieldInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  fieldInfoSubValue: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666',
    marginTop: 2,
  },
  chatIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInfoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  sportCampoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 0,
  },
  sportCampoColumn: {
    flex: 1,
  },
  sportCampoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    gap: 4,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
});
