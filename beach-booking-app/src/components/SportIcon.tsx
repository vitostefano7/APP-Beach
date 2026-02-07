import React from 'react';
import { Ionicons, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { sportIcons } from '../utils/sportIcons';

interface SportIconProps {
  sport?: string;
  size?: number;
  color?: string;
}

export default function SportIcon({ sport, size = 24, color = 'black' }: SportIconProps) {
  // Normalizza lo sport per il confronto
  const normalizedSport = sport ? sport.toLowerCase().replace(/\s+/g, '_') : '';

  const iconData = sportIcons[normalizedSport];

  if (iconData) {
    const { library, name } = iconData;
    if (library === 'FontAwesome5') {
      return <FontAwesome5 name={name as any} size={size} color={color} />;
    } else if (library === 'FontAwesome6') {
      return <FontAwesome6 name={name as any} size={size} color={color} />;
    } else if (library === 'Ionicons') {
      return <Ionicons name={name as any} size={size} color={color} />;
    }
  }

  // Default icon
  return <FontAwesome5 name="volleyball-ball" size={size} color={color} />;
}
