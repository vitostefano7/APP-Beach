import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useUnreadMessages } from "../context/UnreadMessagesContext";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import DashboardStack from "./DashboardStack";
import ProfilePlayerStack from "./ProfilePlayerStack";

const Tab = createBottomTabNavigator();

export default function PlayerTabs() {
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const previousUnreadCount = useRef(unreadCount);

  // 🔥 FORZA REFRESH IMMEDIATO AL MOUNT
  useEffect(() => {
    console.log('🔥 PlayerTabs mounted, forcing refresh');
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // DEBUG unread count changes
  useEffect(() => {
    if (previousUnreadCount.current !== unreadCount) {
      console.log('📊 Unread count changed:', previousUnreadCount.current, '->', unreadCount);
      previousUnreadCount.current = unreadCount;
    }
  }, [unreadCount]);

  // DEBUG ridotto - solo quando necessario
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 PlayerTabs render check - unreadCount:', unreadCount);
    }, 5000); // Solo ogni 5 secondi
    return () => clearInterval(interval);
  }, [unreadCount]);

  const getTabBarStyle = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "";
    console.log('🔍 DEBUG getTabBarStyle - routeName:', routeName);
    
    if (routeName === "Chat" || routeName === "GroupChat") {
      console.log('✅ Hiding tab bar for Chat');
      return { display: "none" };
    }
    
    if (routeName === "ConfermaPrenotazione") {
      console.log('✅ Hiding tab bar for ConfermaPrenotazione');
      return { display: "none" };
    }
    
    console.log('❌ Showing tab bar');
    return undefined;
  };

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
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarItemStyle: {
          height: 65, // Forza altezza fissa per ogni tab
        },
        animation: 'none', // Disabilita animazioni
        tabBarIcon: ({ color, size, focused }) => {
          // Rimuovi logging pesante che causa re-render
          let iconName: any;
          if (route.name === "Dashboard")
            iconName = focused ? "home" : "home-outline";
          if (route.name === "StruttureTab")
            iconName = focused ? "business" : "business-outline";
          if (route.name === "Prenotazioni")
            iconName = focused ? "calendar" : "calendar-outline";
          if (route.name === "Profilo")
            iconName = focused ? "person" : "person-outline";

          return (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
      screenListeners={{
        tabPress: (e) => {
          console.log('🎯 TAB PRESSED:', e.target?.split('-')[0]);
        },
        state: (e) => {
          console.log('🎯 TAB STATE CHANGED to:', e.data?.state?.routes?.[e.data?.state?.index]?.name);
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack} 
        options={{
          tabBarLabel: "Dashboard",
          tabBarLabelStyle: { fontSize: 12 },
        }} 
      />
      <Tab.Screen 
        name="StruttureTab" 
        component={StruttureStack} 
        options={({ route }) => ({
          tabBarLabel: "Strutture",
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen 
        name="Prenotazioni" 
        component={BookingsStack}
        options={{
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <Tab.Screen 
        name="Profilo" 
        component={ProfilePlayerStack}
        options={{
          tabBarLabel: "Profilo",
          tabBarLabelStyle: { fontSize: 12 },
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
    </Tab.Navigator>
  );
}
