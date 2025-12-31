import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useUnreadMessages } from "../context/UnreadMessagesContext";

import OwnerStruttureScreen from "../screens/owner/OwnerStruttureScreen";
import OwnerBookingsScreen from "../screens/owner/OwnerBookingsScreen";
import OwnerProfileScreen from "../screens/owner/OwnerProfileScreen";
import ConversationScreen from "../screens/owner/Comunicazioni/ConversationScreen";

const Tab = createBottomTabNavigator();

export default function OwnerTabs() {
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();

  // 🔥 FORZA REFRESH IMMEDIATO AL MOUNT
  useEffect(() => {
    console.log('🔥 OwnerTabs mounted, forcing refresh');
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // DEBUG
  console.log('🚨🚨🚨 OWNERTABS unreadCount:', unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Strutture: "business",
            Prenotazioni: "calendar",
            Comunicazioni: "chatbox",
            Profilo: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2b8cee",
        tabBarInactiveTintColor: "#999",
      })}
    >
      <Tab.Screen name="Strutture" component={OwnerStruttureScreen} />
      <Tab.Screen name="Prenotazioni" component={OwnerBookingsScreen} />
      <Tab.Screen 
        name="Comunicazioni" 
        component={ConversationScreen}
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
      <Tab.Screen name="Profilo" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
}