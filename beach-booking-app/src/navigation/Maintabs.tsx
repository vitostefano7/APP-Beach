import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import ProfilePlayerStack from "./ProfilePlayerStack";
import DashboardStack from "./DashboardStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const [hideTabBar, setHideTabBar] = useState(false);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      console.log('🔍 DEBUG Navigation state changed:', JSON.stringify(state, null, 2));
      
      // Trova la route attiva nel tab corrente
      const currentRoute = state?.routes[state.index];
      console.log('🔍 DEBUG Current route:', currentRoute?.name);
      
      if (currentRoute?.state) {
        const nestedState = currentRoute.state;
        const nestedRoute = nestedState.routes[nestedState.index];
        console.log('🔍 DEBUG Nested route:', nestedRoute?.name);
        
        if (nestedRoute?.name === 'ConfermaPrenotazione') {
          console.log('✅ Hiding tab bar');
          setHideTabBar(true);
        } else {
          setHideTabBar(false);
        }
      } else {
        setHideTabBar(false);
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2979ff",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: "white",
          display: hideTabBar ? 'none' : 'flex',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Strutture" 
        component={StruttureStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "business" : "business-outline"} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Prenotazioni" 
        component={BookingsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "calendar" : "calendar-outline"} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profilo" 
        component={ProfilePlayerStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
