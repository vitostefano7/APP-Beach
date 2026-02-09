import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnreadMessages } from "../context/UnreadMessagesContext";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import DashboardStack from "./DashboardStack";
import CommunityStack from "./CommunityStack";
import ProfilePlayerStack from "./ProfilePlayerStack";

const Tab = createBottomTabNavigator();

export default function PlayerTabs() {
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const insets = useSafeAreaInsets();
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
    
    if (routeName === "Chat" || routeName === "GroupChat") {
      console.log('✅ Hiding tab bar for Chat');
      return { display: "none" };
    }
    
    if (routeName === "ConfermaPrenotazione") {
      console.log('✅ Hiding tab bar for ConfermaPrenotazione');
      return { display: "none" };
    }
    
    return undefined;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const baseStyle = {
          height: 65 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 6,
          backgroundColor: "white",
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
        };
        
        const customStyle = getTabBarStyle(route);
        
        return {
          headerShown: false,
          tabBarActiveTintColor: "#2979ff",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: customStyle?.display === "none" ? customStyle : baseStyle,
          tabBarItemStyle: {
            height: 65 + insets.bottom,
          },
        animation: 'none', // Disabilita animazioni
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;
          // Usa sempre le icone filled per garantire altezza uniforme
          if (route.name === "Dashboard") iconName = "home";
          if (route.name === "StruttureTab") iconName = "business";
          if (route.name === "Prenotazioni") iconName = "calendar";
          if (route.name === "Social") iconName = "people";
          if (route.name === "Profilo") iconName = "person";

          return (
            <View 
              style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                console.log(`📐 ${route.name} icon layout - x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, width: ${width}, height: ${height}, focused: ${focused}`);
              }}
            >
              <Ionicons 
                name={iconName} 
                size={22} 
                color={color}
                style={{ opacity: focused ? 1 : 0.6 }}
              />
            </View>
          );
        },
      };
      }}
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
        children={() => <StruttureStack isTabMode={true} />}
        options={{
          tabBarLabel: "Strutture",
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <Tab.Screen 
        name="Prenotazioni" 
        component={BookingsStack}
        options={{
          tabBarLabel: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ fontSize: 12, textAlign: 'center', color, fontWeight: focused ? '700' : undefined }} numberOfLines={2}>
              Prenotazioni
            </Text>
          ),
          tabBarItemStyle: { flex: 1.2, alignItems: 'center' },
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <Tab.Screen
        name="Social"
        component={CommunityStack}
        options={{
          tabBarLabel: "Social",
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
