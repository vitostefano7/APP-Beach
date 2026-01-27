import React from 'react';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface SportIconProps {
  sport: string;
  size?: number;
  color?: string;
}

export default function SportIcon({ sport, size = 24, color = 'black' }: SportIconProps) {
  // Normalizza lo sport per il confronto
  const normalizedSport = sport?.toLowerCase().replace(/\s+/g, '_') || '';
  
  // Usa FontAwesome5 per volley e Beach Volley
  if (normalizedSport.includes('volley')) {
    return <FontAwesome5 name="volleyball-ball" size={size} color={color} />;
  }

  // Usa Ionicons per gli altri sport
  const getIonicon = () => {
    switch (normalizedSport) {
      case 'padel':
      case 'tennis':
        return 'tennisball';
      case 'calcio':
      case 'football':
      case 'soccer':
        return 'football';
      case 'basket':
      case 'basketball':
        return 'basketball';
      default:
        return <FontAwesome5 name="volleyball-ball" size={size} color={color} />;
    }
  };

  return <Ionicons name={getIonicon() as any} size={size} color={color} />;
}
