import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useUnreadMessages } from "../context/UnreadMessagesContext";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import ProfilePlayerStack from "./ProfilePlayerStack";

const Tab = createBottomTabNavigator();

export default function PlayerTabs() {
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();

  // 🔥 FORZA REFRESH IMMEDIATO AL MOUNT
  useEffect(() => {
    console.log('🔥 PlayerTabs mounted, forcing refresh');
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // DEBUG
  console.log('🚨🚨🚨 PLAYERTABS unreadCount:', unreadCount);
  console.log('🚨🚨🚨 PLAYERTABS typeof:', typeof unreadCount);
  console.log('🚨🚨🚨 PLAYERTABS > 0?:', unreadCount > 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2979ff",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: "white",
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === "StruttureTab")
            iconName = focused ? "business" : "business-outline";
          if (route.name === "Prenotazioni")
            iconName = focused ? "calendar" : "calendar-outline";
          if (route.name === "Profilo")
            iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="StruttureTab" 
        component={StruttureStack} 
        options={{ tabBarLabel: "Strutture" }} 
      />
      <Tab.Screen 
        name="Prenotazioni" 
        component={BookingsStack}
      />
      <Tab.Screen 
        name="Profilo" 
        component={ProfilePlayerStack}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF5252",
            color: "white",
            fontSize: 11,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            top: 3,
          },
        }}
      />
    </Tab.Navigator>
  );
}