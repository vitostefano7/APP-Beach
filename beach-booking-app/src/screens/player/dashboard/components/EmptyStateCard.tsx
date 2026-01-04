import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

interface EmptyStateCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
  type?: 'booking' | 'invite';
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  subtitle,
  buttonText,
  onPress,
  type = 'booking',
}) => {
  const cardStyle = type === 'booking' 
    ? [styles.nextMatchCard, styles.emptyNextMatchCard]
    : [styles.inviteCard, styles.emptyInviteCard];

  return (
    <Pressable style={cardStyle} onPress={onPress}>
      <View style={type === 'booking' ? styles.emptyMatchContent : styles.emptyInviteContent}>
        <Ionicons 
          name={icon as any} 
          size={type === 'booking' ? 48 : 32} 
          color="#999" 
        />
        <Text style={type === 'booking' ? styles.emptyMatchTitle : styles.emptyInviteTitle}>
          {title}
        </Text>
        {subtitle && (
          <Text style={type === 'booking' ? styles.emptyMatchSubtitle : styles.emptyInviteSubtitle}>
            {subtitle}
          </Text>
        )}
        {buttonText && onPress && (
          <Pressable style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookButtonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

export default EmptyStateCard;