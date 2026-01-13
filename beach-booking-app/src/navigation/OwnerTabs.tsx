import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { View } from "react-native";
import { useUnreadMessages } from "../context/UnreadMessagesContext";

import OwnerDashboardScreen from "../screens/owner/dashboard/OwnerDashboardScreen";
import OwnerStruttureScreen from "../screens/owner/OwnerStruttureScreen";
import OwnerBookingsScreen from "../screens/owner/prenotazioni/OwnerBookingsScreen";
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
            Dashboard: "grid",
            Strutture: "business",
            Prenotazioni: "calendar",
            Comunicazioni: "chatbox",
            Profilo: "person",
          };
          return (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={icons[route.name]} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: "#2b8cee",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarItemStyle: {
          height: 60, // Forza altezza fissa per ogni tab
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        animation: 'none', // Disabilita animazioni
      })}
      screenListeners={{
        tabPress: (e) => {
          console.log('🎯 Owner Tab pressed:', e.target?.split('-')[0]);
        },
        state: (e) => {
          console.log('🎯 Owner Tab state changed:', e.data?.state?.index);
        }
      }}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Prenotazioni" component={OwnerBookingsScreen} />
      <Tab.Screen 
        name="Comunicazioni" 
        component={ConversationScreen}
        options={{
          // Temporaneamente rimosso badge per test
          // tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          // tabBarBadgeStyle: {
          //   backgroundColor: "#FF5252",
          //   color: "white",
          //   fontSize: 11,
          //   fontWeight: "700",
          //   minWidth: 18,
          //   height: 18,
          //   borderRadius: 9,
          // },
        }}
      />
      <Tab.Screen name="Profilo" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
}