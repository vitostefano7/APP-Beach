import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { AmenityIcon as AmenityIconType } from "../amenities/availableAmenities";

type Props = {
  icon: AmenityIconType;
  size?: number;
  color?: string;
};

export default function AmenityIcon({ icon, size = 18, color = "#2196F3" }: Props) {
  if (typeof icon === "string") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }

  if (icon.family === "FontAwesome5") {
    return <FontAwesome5 name={icon.name as any} size={size} color={color} />;
  }

  if (icon.family === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />;
  }

  return <Ionicons name={icon.name as any} size={size} color={color} />;
}
