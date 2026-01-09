import React, { useState } from 'react';
import { View, Image, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveAvatarUrl, getInitials } from '../../utils/avatar';
import { getAvatarStyles, SIZE_MAP, TEAM_COLOR_MAP } from './Avatar.styles';

export interface AvatarProps {
  // Core
  name?: string;
  surname?: string;
  avatarUrl?: string | null;

  // Dimensioni
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;

  // Colori team (per match/partite)
  teamColor?: 'A' | 'B' | 'none' | string;

  // Personalizzazione
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;

  // Features opzionali
  showStatusDot?: boolean;
  statusDotColor?: string;

  // Interazione
  onPress?: () => void;
  disabled?: boolean;

  // Avatar sovrapposti
  zIndex?: number;

  // Fallback
  fallbackIcon?: keyof typeof Ionicons.glyphMap;

  testID?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  surname,
  avatarUrl,
  size = 'medium',
  teamColor = 'none',
  backgroundColor,
  textColor = '#fff',
  style,
  showStatusDot = false,
  statusDotColor = '#4CAF50',
  onPress,
  disabled = false,
  zIndex,
  fallbackIcon = 'person',
  testID,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeValue = typeof size === 'number' ? size : SIZE_MAP[size];
  const resolvedUrl = resolveAvatarUrl(avatarUrl);

  // Determina background color
  const bgColor = backgroundColor || TEAM_COLOR_MAP[teamColor as keyof typeof TEAM_COLOR_MAP] || TEAM_COLOR_MAP.none;

  // Ottieni stili dinamici basati sulla dimensione
  const avatarStyles = getAvatarStyles(sizeValue, bgColor);

  const content = (
    <View
      style={[avatarStyles.container, style, zIndex !== undefined && { zIndex }]}
      testID={testID}
    >
      {resolvedUrl && !imageError ? (
        <Image
          source={{ uri: `${resolvedUrl}?t=${Date.now()}` }}
          style={avatarStyles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={avatarStyles.placeholder}>
          {name ? (
            <Text style={[avatarStyles.text, { color: textColor }]}>
              {getInitials(name, surname)}
            </Text>
          ) : (
            <Ionicons
              name={fallbackIcon}
              size={sizeValue * 0.5}
              color={textColor}
            />
          )}
        </View>
      )}

      {showStatusDot && (
        <View style={[avatarStyles.statusDot, { backgroundColor: statusDotColor }]} />
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        {content}
      </Pressable>
    );
  }

  return content;
};

export default Avatar;
